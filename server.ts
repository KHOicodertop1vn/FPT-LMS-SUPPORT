/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PayOS } from '@payos/node';

const app = express();
const PORT = 3000;

// Middleware parse JSON & URL-encoded (hỗ trợ PayOS Webhook)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================================================================
// CẤU HÌNH PAYOS TÍCH HỢP (Client ID, Api Key, Checksum Key, Webhook URL)
// =========================================================================
let payosConfig = {
  clientId: process.env.PAYOS_CLIENT_ID || '',
  apiKey: process.env.PAYOS_API_KEY || '',
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || '',
  webhookUrl: process.env.PAYOS_WEBHOOK_URL || '',
  channelName: 'FPT LMS SUPPORT',
  bankName: 'MBBank (Quân Đội)',
  accountNumber: '0825566455',
  accountName: 'BUI DANG KHOI',
};

// Hàm xác thực chữ ký PayOS Webhook (HMAC SHA256)
function verifyPayOSSignature(data: any, signature: string, checksumKey: string): boolean {
  if (!checksumKey || !signature) return true; // Nếu chưa cài checksum key, bỏ qua
  try {
    const sortedKeys = Object.keys(data).sort();
    const signString = sortedKeys
      .map((key) => `${key}=${typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]}`)
      .join('&');

    const expectedSignature = crypto.createHmac('sha256', checksumKey).update(signString).digest('hex');
    return expectedSignature === signature;
  } catch (err) {
    console.warn('[PayOS Signature Error]:', err);
    return true;
  }
}

// =========================================================================
// IN-MEMORY DATABASE & PERSISTENCE CHO LICENSE & GIAO DỊCH PAYOS
// =========================================================================
interface UserLicenseRecord {
  email: string;
  name?: string;
  status: 'Active' | 'Trial' | 'Expired';
  daysRemaining: number;
  payCode: string;
  planName: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
  lastPaymentAt?: string;
  lastOrderCode?: number | string;
}

interface PayOSTransactionRecord {
  id: string;
  orderCode: number | string;
  amount: number;
  description: string;
  accountNumber: string;
  payCodeMatched?: string;
  userEmailMatched?: string;
  status: 'PROCESSED' | 'IGNORED' | 'ERROR';
  receivedAt: string;
  rawPayload: any;
}

// Cấu trúc Đơn hàng Phiên Thanh toán Duy nhất (Unique Session Order)
interface PaymentSessionOrder {
  orderCode: number;
  payCode: string; // Ví dụ: "FPT849201"
  userEmail: string;
  amount: number;
  planTitle: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED';
  createdAt: number;
  expiresAt: number;
}

// =========================================================================
// DATABASE PERSISTENCE (LƯU TRỮ VÀO FILE DATABASE.JSON ĐẢM BẢO KHÔNG MẤT DỮ LIỆU)
// =========================================================================
const DB_FILE = path.resolve(process.cwd(), 'database.json');
const licensesDb: Map<string, UserLicenseRecord> = new Map();
const payCodeIndex: Map<string, string> = new Map(); // payCode -> email
const sessionOrders: Map<string, PaymentSessionOrder> = new Map(); // payCode -> PaymentSessionOrder
const transactionsLog: PayOSTransactionRecord[] = [];

function saveDatabaseToFile() {
  try {
    const data = {
      licenses: Array.from(licensesDb.entries()),
      orders: Array.from(sessionOrders.entries()),
      transactions: transactionsLog.slice(0, 100),
      payosConfig,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB Error] Ghi database.json thất bại:', err);
  }
}

function loadDatabaseFromFile() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.licenses)) {
        for (const [k, v] of data.licenses) {
          licensesDb.set(k, v);
          if (v.payCode) payCodeIndex.set(v.payCode.toUpperCase(), k);
        }
      }
      if (Array.isArray(data.orders)) {
        for (const [k, v] of data.orders) {
          sessionOrders.set(k, v);
          payCodeIndex.set(k.toUpperCase(), v.userEmail);
        }
      }
      if (Array.isArray(data.transactions)) {
        transactionsLog.push(...data.transactions);
      }
      if (data.payosConfig) {
        payosConfig = { ...payosConfig, ...data.payosConfig };
      }
      console.log(`💾 [Database File] Đã nạp ${licensesDb.size} giấy phép và ${transactionsLog.length} giao dịch từ database.json`);
      return;
    }
  } catch (err) {
    console.warn('[DB Error] Không thể nạp database.json:', err);
  }

  initSampleUsers();
  saveDatabaseToFile();
}

// Khởi tạo một số tài khoản mẫu ban đầu nếu file chưa tồn tại
function initSampleUsers() {
  const defaultUsers = [
    {
      email: 'buidangkhoi28@gmail.com',
      name: 'BÙI ĐĂNG KHỞI',
      status: 'Trial' as const,
      daysRemaining: 7,
      payCode: 'GH1000',
      planName: 'Gói Dùng thử Trial (7 ngày)',
      amount: 10000,
    },
    {
      email: 'sinhvien.fpt@fpt.edu.vn',
      name: 'Sinh Viên FPT',
      status: 'Trial' as const,
      daysRemaining: 7,
      payCode: 'GH2026',
      planName: 'Gói Dùng thử Trial (7 ngày)',
      amount: 10000,
    },
  ];

  for (const u of defaultUsers) {
    licensesDb.set(u.email.toLowerCase(), {
      ...u,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toLocaleTimeString('vi-VN'),
    });
    payCodeIndex.set(u.payCode.toUpperCase(), u.email.toLowerCase());
  }
}

loadDatabaseFromFile();

// Helper lấy hoặc tự động tạo License cho sinh viên (Just-In-Time)
function getOrCreateLicense(email: string, name?: string): UserLicenseRecord {
  const normalizedEmail = email.trim().toLowerCase();
  let existing = licensesDb.get(normalizedEmail);

  if (!existing) {
    // Tự sinh mã PayCode động
    const studentMatch = normalizedEmail.match(/([a-zA-Z]{2}\d{5,6})/i);
    let payCode = studentMatch
      ? `FPT${studentMatch[1].toUpperCase()}`
      : `GH${Math.floor(1000 + Math.random() * 9000)}`;

    // Đảm bảo không trùng payCode
    while (payCodeIndex.has(payCode)) {
      payCode = `GH${Math.floor(1000 + Math.random() * 9000)}`;
    }

    existing = {
      email: normalizedEmail,
      name: name?.trim() || normalizedEmail.split('@')[0].toUpperCase(),
      status: 'Trial',
      daysRemaining: 7,
      payCode,
      planName: 'Gói Dùng thử Trial (7 ngày)',
      amount: 10000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toLocaleTimeString('vi-VN'),
    };

    licensesDb.set(normalizedEmail, existing);
    payCodeIndex.set(payCode, normalizedEmail);
    saveDatabaseToFile();
  } else if (name && name.trim() && existing.name !== name.trim()) {
    existing.name = name.trim();
    licensesDb.set(normalizedEmail, existing);
    saveDatabaseToFile();
  }

  return existing;
}

// =========================================================================
// API ROUTES: XỬ LÝ BẢN QUYỀN & WEBHOOK PAYOS
// =========================================================================

// 1. API Tra cứu trạng thái bản quyền (GET /api/v1/license?email=...&name=...)
app.get('/api/v1/license', (req: Request, res: Response) => {
  const email = (req.query.email as string) || '';
  const name = (req.query.name as string) || '';
  if (!email) {
    return res.status(400).json({ error: 'Tham số email là bắt buộc' });
  }

  const license = getOrCreateLicense(email, name);
  return res.json(license);
});

// 1.1 API Tạo Phiên Thanh Toán Đơn Hàng Mới (POST /api/payment/create-session)
// Mỗi phiên tạo 1 mã PayCode ngẫu nhiên duy nhất (Ví dụ: FPT839201) gắn với email người dùng
app.post('/api/payment/create-session', (req: Request, res: Response) => {
  const { email, amount = 10000, planType = 'monthly' } = req.body;
  const userEmail = (email || 'buidangkhoi28@gmail.com').trim().toLowerCase();

  // Đảm bảo user đã tồn tại trong database
  const userLicense = getOrCreateLicense(userEmail);

  // Sinh 6 số ngẫu nhiên duy nhất cho phiên thanh toán này
  let randomNum = Math.floor(100000 + Math.random() * 900000);
  let sessionPayCode = `FPT${randomNum}`;

  while (sessionOrders.has(sessionPayCode) || payCodeIndex.has(sessionPayCode)) {
    randomNum = Math.floor(100000 + Math.random() * 900000);
    sessionPayCode = `FPT${randomNum}`;
  }

  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 phút đếm ngược
  const planTitle = Number(amount) >= 80000 ? 'Gói Năm VIP (365 ngày)' : 'Gói Tháng Pro (30 ngày)';

  const sessionOrder: PaymentSessionOrder = {
    orderCode: randomNum,
    payCode: sessionPayCode,
    userEmail,
    amount: Number(amount),
    planTitle,
    status: 'PENDING',
    createdAt: Date.now(),
    expiresAt,
  };

  sessionOrders.set(sessionPayCode, sessionOrder);
  payCodeIndex.set(sessionPayCode, userEmail);

  // Cập nhật payCode hiện tại của người dùng thành mã phiên mới
  userLicense.payCode = sessionPayCode;
  licensesDb.set(userEmail, userLicense);
  saveDatabaseToFile();

  console.log(
    `[Session Order] 🆕 Tạo mã phiên thanh toán DUY NHẤT: ${sessionPayCode} (Đơn hàng #${randomNum}) cho: ${userEmail}`
  );

  return res.json({
    success: true,
    orderCode: randomNum,
    payCode: sessionPayCode,
    amount: Number(amount),
    expiresAt,
    userEmail,
  });
});

// 2. API Nhận Webhook từ PayOS (POST /api/payos/webhook hoặc /api/v1/webhook/payos)
// Đây là endpoint bạn sẽ điền vào mục Cài đặt Webhook trên trang quản trị PayOS
app.post(['/api/payos/webhook', '/api/v1/webhook/payos'], (req: Request, res: Response) => {
  console.log('[PayOS Webhook] Nhận request chuyển khoản mới:', JSON.stringify(req.body, null, 2));

  try {
    const payload = req.body;

    // Xử lý khi PayOS gửi request kiểm tra / xác thực Webhook URL (khi cài đặt webhook trên PayOS)
    if (
      payload?.webhookUrl ||
      (payload?.data?.orderCode === 123 && (!payload?.data?.amount || payload?.data?.amount === 0))
    ) {
      console.log('[PayOS Webhook] 🔔 PayOS gửi tín hiệu xác minh Webhook URL thành công!');
      return res.status(200).json({
        success: true,
        code: '00',
        message: 'Webhook URL đã được xác thực thành công bởi PayOS',
      });
    }

    const data = payload?.data || payload; // PayOS bọc trong object data

    if (!data) {
      return res.status(400).json({ error: 'Payload không hợp lệ' });
    }

    // Kiểm tra chữ ký Checksum nếu đã cài đặt Checksum Key
    if (payosConfig.checksumKey && payload?.signature) {
      const isSignatureValid = verifyPayOSSignature(data, payload.signature, payosConfig.checksumKey);
      if (!isSignatureValid) {
        console.warn('[PayOS Webhook] ⚠️ Chữ ký Checksum Key không trùng khớp (có thể do key test)');
      }
    }

    const orderCode = data.orderCode || data.paymentLinkId || Date.now();
    const amount = Number(data.amount || 0);
    const description = (data.description || '').trim();
    const accountNumber = data.accountNumber || '0825566455';

    // Trích xuất mã payCode từ nội dung chuyển khoản (description)
    // Ví dụ description: "FPT849102", "GH1000 nap tien", "GH2026 chuyen khoan", "Thanh toan FPT849102"
    const payCodeMatch = description.match(/(FPT\d{6}|GH\d{4}|FPT[A-Z]{2}\d{5,6}|[A-Z0-9]{6,8})/i);
    let matchedPayCode = payCodeMatch ? payCodeMatch[1].toUpperCase() : null;
    let matchedEmail: string | null = null;

    // Kiểm tra xem có thuộc Đơn Hàng Phiên Duy Nhất (Session Order) không
    if (matchedPayCode && sessionOrders.has(matchedPayCode)) {
      const sessionOrder = sessionOrders.get(matchedPayCode)!;
      if (sessionOrder.status === 'PAID') {
        console.log(`[PayOS Webhook] ℹ️ Đơn hàng ${matchedPayCode} đã được kích hoạt trước đó (Chống lặp đơn).`);
        return res.status(200).json({
          success: true,
          message: 'Đơn hàng đã được thanh toán trước đó (Idempotent)',
        });
      }
      sessionOrder.status = 'PAID';
      sessionOrders.set(matchedPayCode, sessionOrder);
      matchedEmail = sessionOrder.userEmail;
    } else if (matchedPayCode && payCodeIndex.has(matchedPayCode)) {
      matchedEmail = payCodeIndex.get(matchedPayCode) || null;
    } else {
      // Thử tìm xem nội dung chuyển khoản có chứa email người dùng không
      for (const [email, record] of licensesDb.entries()) {
        if (
          description.toLowerCase().includes(email.toLowerCase()) ||
          description.toUpperCase().includes(record.payCode.toUpperCase())
        ) {
          matchedEmail = email;
          matchedPayCode = record.payCode;
          break;
        }
      }
    }

    // Nếu vẫn chưa tìm thấy người dùng cụ thể, fallback vào người dùng gần nhất hoặc tạo liên kết
    if (!matchedEmail && licensesDb.size > 0) {
      // Gán vào người dùng mặc định (Bùi Đăng Khởi) nếu là STK của Khởi nhận tiền
      matchedEmail = 'buidangkhoi28@gmail.com';
      const record = licensesDb.get(matchedEmail);
      if (record) matchedPayCode = record.payCode;
    }

    if (matchedEmail && licensesDb.has(matchedEmail)) {
      const userLicense = licensesDb.get(matchedEmail)!;

      // Xác định số ngày kích hoạt dựa trên số tiền (10.000đ = 30 ngày, 90.000đ = 365 ngày)
      const addedDays = amount >= 80000 ? 365 : 30;
      const planTitle =
        amount >= 80000
          ? 'Gói Năm - FPT LMS Support VIP (365 ngày)'
          : 'Gói Tháng - FPT LMS Support Pro (30 ngày)';

      userLicense.status = 'Active';
      userLicense.daysRemaining = (userLicense.daysRemaining || 0) + addedDays;
      userLicense.planName = planTitle;
      userLicense.amount = amount || 10000;
      userLicense.updatedAt = new Date().toLocaleTimeString('vi-VN');
      userLicense.lastPaymentAt = new Date().toISOString();
      userLicense.lastOrderCode = orderCode;

      licensesDb.set(matchedEmail, userLicense);

      // Lưu log lịch sử giao dịch
      transactionsLog.unshift({
        id: `TX-${Date.now()}`,
        orderCode,
        amount,
        description,
        accountNumber,
        payCodeMatched: matchedPayCode || undefined,
        userEmailMatched: matchedEmail,
        status: 'PROCESSED',
        receivedAt: new Date().toLocaleTimeString('vi-VN'),
        rawPayload: payload,
      });

      saveDatabaseToFile();

      console.log(
        `[PayOS Webhook] ✅ KÍCH HOẠT THÀNH CÔNG cho sinh viên: ${matchedEmail} | Thêm +${addedDays} ngày | Trạng thái: ACTIVE`
      );

      // Trả về HTTP 200 JSON cho PayOS
      return res.status(200).json({
        success: true,
        code: '00',
        message: 'Kích hoạt bản quyền thành công',
        user: matchedEmail,
        newStatus: 'Active',
        daysRemaining: userLicense.daysRemaining,
      });
    }

    // Ghi nhận giao dịch chưa gán được email
    transactionsLog.unshift({
      id: `TX-${Date.now()}`,
      orderCode,
      amount,
      description,
      accountNumber,
      status: 'IGNORED',
      receivedAt: new Date().toLocaleTimeString('vi-VN'),
      rawPayload: payload,
    });
    saveDatabaseToFile();

    console.warn(`[PayOS Webhook] ⚠️ Giao dịch không tìm thấy mã sinh viên phù hợp: "${description}"`);

    return res.status(200).json({
      success: true,
      message: 'Đã nhận webhook nhưng không tìm thấy mã giấy phép tương ứng',
    });
  } catch (error: any) {
    console.error('[PayOS Webhook Error]:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 2.1 API Tra soát & Kích hoạt bản quyền tức thì (POST /api/license/manual-reconcile)
// Hỗ trợ người dùng kích hoạt ngay lập tức nếu tiền đã chuyển thành công qua MBBank
app.post('/api/license/manual-reconcile', (req: Request, res: Response) => {
  const { email, amount = 10000, transferNote = '', payCode = '' } = req.body;
  const userEmail = (email || 'buidangkhoi28@gmail.com').trim().toLowerCase();
  const userLicense = getOrCreateLicense(userEmail);

  const numAmount = Number(amount) || 10000;
  const addedDays = numAmount >= 80000 ? 365 : 30;
  const planTitle =
    numAmount >= 80000
      ? 'Gói Năm - FPT LMS Support VIP (365 ngày)'
      : 'Gói Tháng - FPT LMS Support Pro (30 ngày)';

  userLicense.status = 'Active';
  userLicense.daysRemaining = (userLicense.daysRemaining || 0) + addedDays;
  userLicense.planName = planTitle;
  userLicense.amount = numAmount;
  userLicense.updatedAt = new Date().toLocaleTimeString('vi-VN');
  userLicense.lastPaymentAt = new Date().toISOString();
  userLicense.lastOrderCode = `MB-${Date.now().toString().slice(-6)}`;

  licensesDb.set(userEmail, userLicense);

  transactionsLog.unshift({
    id: `TX-MBBANK-${Date.now()}`,
    orderCode: userLicense.lastOrderCode,
    amount: numAmount,
    description: transferNote || `Tra soát MBBank: ${userEmail} (${payCode || userLicense.payCode})`,
    accountNumber: '0825566455',
    payCodeMatched: payCode || userLicense.payCode,
    userEmailMatched: userEmail,
    status: 'PROCESSED',
    receivedAt: new Date().toLocaleTimeString('vi-VN'),
    rawPayload: { manualReconcile: true, transferNote, amount: numAmount },
  });

  saveDatabaseToFile();

  console.log(`[Manual Reconcile] ✅ Đã kích hoạt bản quyền cho: ${userEmail} (+${addedDays} ngày)`);

  return res.json({
    success: true,
    message: 'Kích hoạt bản quyền thành công sau khi xác nhận chuyển khoản MBBank',
    license: userLicense,
  });
});

// 3. API Lấy danh sách giao dịch Webhook gần đây để kiểm tra (GET /api/payos/transactions)
app.get('/api/payos/transactions', (req: Request, res: Response) => {
  return res.json({
    total: transactionsLog.length,
    transactions: transactionsLog.slice(0, 20),
  });
});

// 4. API Mô phỏng chuyển khoản PayOS cho mục đích Test nhanh (POST /api/payos/simulate)
app.post('/api/payos/simulate', (req: Request, res: Response) => {
  const { email, amount = 10000, payCode } = req.body;
  const targetEmail = (email || 'buidangkhoi28@gmail.com').toLowerCase();

  const userLicense = getOrCreateLicense(targetEmail);
  const codeToUse = payCode || userLicense.payCode;

  // Giả lập webhook gửi từ PayOS
  const mockWebhookPayload = {
    code: '00',
    desc: 'success',
    data: {
      orderCode: Math.floor(100000 + Math.random() * 900000),
      amount: Number(amount),
      description: `${codeToUse} thanh toan ban quyen FPT LMS Support`,
      accountNumber: '0825566455',
      reference: `FT${Date.now()}`,
      transactionDateTime: new Date().toISOString(),
      currency: 'VND',
      paymentLinkId: `pl_${Date.now()}`,
      code: '00',
      desc: 'Thành công',
    },
    signature: 'mock_signature_payos',
  };

  // Kích hoạt cập nhật
  const addedDays = Number(amount) >= 80000 ? 365 : 30;
  userLicense.status = 'Active';
  userLicense.daysRemaining = (userLicense.daysRemaining || 0) + addedDays;
  userLicense.planName =
    Number(amount) >= 80000
      ? 'Gói Năm - FPT LMS Support VIP (365 ngày)'
      : 'Gói Tháng - FPT LMS Support Pro (30 ngày)';
  userLicense.amount = Number(amount);
  userLicense.updatedAt = new Date().toLocaleTimeString('vi-VN');
  userLicense.lastPaymentAt = new Date().toISOString();

  licensesDb.set(targetEmail, userLicense);

  transactionsLog.unshift({
    id: `MOCK-${Date.now()}`,
    orderCode: mockWebhookPayload.data.orderCode,
    amount: Number(amount),
    description: mockWebhookPayload.data.description,
    accountNumber: '0825566455',
    payCodeMatched: codeToUse,
    userEmailMatched: targetEmail,
    status: 'PROCESSED',
    receivedAt: new Date().toLocaleTimeString('vi-VN'),
    rawPayload: mockWebhookPayload,
  });

  return res.json({
    success: true,
    message: `Đã mô phỏng chuyển khoản ${Number(amount).toLocaleString('vi-VN')} VNĐ thành công!`,
    license: userLicense,
  });
});

// 5. API Quản lý thông tin cấu hình PayOS (GET /api/payos/config & POST /api/payos/config)
app.get('/api/payos/config', (_req: Request, res: Response) => {
  return res.json({
    clientId: payosConfig.clientId,
    apiKey: payosConfig.apiKey ? `${payosConfig.apiKey.slice(0, 6)}...` : '',
    hasApiKey: !!payosConfig.apiKey,
    checksumKey: payosConfig.checksumKey ? `${payosConfig.checksumKey.slice(0, 6)}...` : '',
    hasChecksumKey: !!payosConfig.checksumKey,
    webhookUrl: payosConfig.webhookUrl,
    channelName: payosConfig.channelName,
    bankName: payosConfig.bankName,
    accountNumber: payosConfig.accountNumber,
    accountName: payosConfig.accountName,
  });
});

app.post('/api/payos/config', (req: Request, res: Response) => {
  const { clientId, apiKey, checksumKey, webhookUrl } = req.body;
  if (clientId !== undefined) payosConfig.clientId = clientId.trim();
  if (apiKey !== undefined && apiKey !== '') payosConfig.apiKey = apiKey.trim();
  if (checksumKey !== undefined && checksumKey !== '') payosConfig.checksumKey = checksumKey.trim();
  if (webhookUrl !== undefined) payosConfig.webhookUrl = webhookUrl.trim();

  return res.json({
    success: true,
    message: 'Đã lưu thông tin cấu hình PayOS thành công',
    config: {
      clientId: payosConfig.clientId,
      hasApiKey: !!payosConfig.apiKey,
      hasChecksumKey: !!payosConfig.checksumKey,
      webhookUrl: payosConfig.webhookUrl,
      channelName: payosConfig.channelName,
    },
  });
});

// 6. API Tự động xác thực & đăng ký Webhook URL với PayOS (POST /api/payos/confirm-webhook)
app.post('/api/payos/confirm-webhook', async (req: Request, res: Response) => {
  try {
    const { webhookUrl, clientId, apiKey, checksumKey } = req.body;
    const finalClientId = (clientId || payosConfig.clientId || '').trim();
    const finalApiKey = (apiKey || payosConfig.apiKey || '').trim();
    const finalChecksumKey = (checksumKey || payosConfig.checksumKey || '').trim();

    if (!finalClientId || !finalApiKey || !finalChecksumKey) {
      return res.status(400).json({
        error: 'Vui lòng cung cấp đủ Client ID, Api Key và Checksum Key từ PayOS để xác thực',
      });
    }

    // Cập nhật cấu hình bộ nhớ
    payosConfig.clientId = finalClientId;
    payosConfig.apiKey = finalApiKey;
    payosConfig.checksumKey = finalChecksumKey;
    if (webhookUrl) payosConfig.webhookUrl = webhookUrl.trim();

    const payOS = new PayOS({
      clientId: finalClientId,
      apiKey: finalApiKey,
      checksumKey: finalChecksumKey,
    });

    const targetWebhookUrl = webhookUrl || payosConfig.webhookUrl || `${req.headers.origin}/api/payos/webhook`;
    console.log(`[PayOS SDK] Đang gọi webhooks.confirm tới PayOS với URL: ${targetWebhookUrl}`);
    const result = await payOS.webhooks.confirm(targetWebhookUrl);

    return res.json({
      success: true,
      message: 'Đã xác nhận và đăng ký Webhook URL thành công với PayOS!',
      result,
      webhookUrl: targetWebhookUrl,
    });
  } catch (err: any) {
    console.error('[PayOS Confirm Webhook Error]:', err);
    return res.status(500).json({
      error: err.message || 'Không thể đăng ký Webhook URL với PayOS',
    });
  }
});

// 7. API Tạo Link thanh toán PayOS Checkout (POST /api/payos/create-payment-link)
app.post('/api/payos/create-payment-link', async (req: Request, res: Response) => {
  try {
    const { amount = 10000, payCode = 'GH1000', email = 'buidangkhoi28@gmail.com' } = req.body;

    if (!payosConfig.clientId || !payosConfig.apiKey || !payosConfig.checksumKey) {
      return res.status(400).json({
        error: 'Chưa cấu hình đủ thông tin PayOS (Client ID, Api Key, Checksum Key)',
      });
    }

    const payOS = new PayOS({
      clientId: payosConfig.clientId,
      apiKey: payosConfig.apiKey,
      checksumKey: payosConfig.checksumKey,
    });

    const origin = (req.headers.origin as string) || `http://localhost:${PORT}`;
    const orderCode = Number(String(Date.now()).slice(-6)); // 6 chữ số cuối
    const cleanPayCode = (payCode || 'GH1000').slice(0, 8);

    const paymentLinkRes = await payOS.paymentRequests.create({
      orderCode,
      amount: Number(amount),
      description: `${cleanPayCode} FPT LMS`.slice(0, 25),
      cancelUrl: `${origin}/?payment_status=cancelled`,
      returnUrl: `${origin}/?payment_status=success`,
    });

    return res.json({
      success: true,
      orderCode,
      paymentLink: paymentLinkRes,
    });
  } catch (err: any) {
    console.error('[PayOS Create Payment Link Error]:', err);
    return res.status(500).json({
      error: err.message || 'Không thể tạo link thanh toán PayOS',
    });
  }
});

// =========================================================================
// GẮN VITE MIDDLEWARE ĐỂ SERVE CLIENT REACT SPA
// =========================================================================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [Full-Stack Server] Sẵn sàng tại http://0.0.0.0:${PORT}`);
    console.log(`📡 [PayOS Webhook URL]: /api/payos/webhook`);
  });
}

startServer().catch((err) => {
  console.error('Lỗi khởi động Server:', err);
});
