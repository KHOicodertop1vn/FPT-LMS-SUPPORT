/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';

export interface UserRecord {
  email: string;
  name: string;
  picture?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface LicenseRecord {
  id: string;
  email: string;
  status: 'Trial' | 'Active' | 'Expired';
  daysRemaining: number;
  payCode: string;
  planName: string;
  amount: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransactionRecord {
  id: string;
  orderCode: number | string;
  email: string;
  payCode: string;
  amount: number;
  description: string;
  gateway?: string;
  accountNumber?: string;
  reference: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  createdAt: string;
}

export interface PaymentGatewayConfig {
  payosClientId?: string;
  payosApiKey?: string;
  payosChecksumKey?: string;
  sepayApiKey?: string;
  webhookSecret?: string;
}

interface DatabaseSchema {
  users: Record<string, UserRecord>;
  licenses: Record<string, LicenseRecord>;
  payments: PaymentTransactionRecord[];
  processedReferences: Record<string, boolean>; // Idempotency check
  gatewayConfig: PaymentGatewayConfig;
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'license_db.json');

// Khởi tạo thư mục và file database
function initDatabase(): DatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (!parsed.processedReferences) parsed.processedReferences = {};
      if (!parsed.gatewayConfig) parsed.gatewayConfig = {};
      return parsed;
    } catch (e) {
      console.warn('[Database] Lỗi đọc file DB, khôi phục mặc định:', e);
    }
  }

  // Dữ liệu mẫu ban đầu
  const initialData: DatabaseSchema = {
    users: {
      'buidangkhoi28@gmail.com': {
        email: 'buidangkhoi28@gmail.com',
        name: 'Bùi Đăng Khởi',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
    },
    licenses: {
      'buidangkhoi28@gmail.com': {
        id: 'LIC-001',
        email: 'buidangkhoi28@gmail.com',
        status: 'Trial',
        daysRemaining: 7,
        payCode: 'GH1000',
        planName: 'Gói Dùng thử Trial (7 ngày)',
        amount: 10000,
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    payments: [],
    processedReferences: {},
    gatewayConfig: {},
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  return initialData;
}

let dbInstance: DatabaseSchema = initDatabase();

function saveDatabase(): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbInstance, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Database] Lỗi ghi dữ liệu xuống đĩa:', err);
  }
}

/**
 * Sinh mã thanh toán ngẫu nhiên duy nhất: ví dụ GH1000, GH5821
 */
function generatePayCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `GH${num}`;
}

/**
 * Lấy hoặc Tự động tạo bản quyền mới (Just-In-Time)
 */
export function getOrCreateLicense(email: string, name?: string): LicenseRecord {
  const normalizedEmail = email.trim().toLowerCase();

  // Cập nhật thông tin user
  if (!dbInstance.users[normalizedEmail]) {
    dbInstance.users[normalizedEmail] = {
      email: normalizedEmail,
      name: name || normalizedEmail.split('@')[0],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
  } else {
    dbInstance.users[normalizedEmail].lastLoginAt = new Date().toISOString();
  }

  // Kiểm tra license
  let license = dbInstance.licenses[normalizedEmail];

  if (!license) {
    // Tạo mới với trạng thái Trial 7 ngày
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    license = {
      id: `LIC-${Date.now().toString().slice(-6)}`,
      email: normalizedEmail,
      status: 'Trial',
      daysRemaining: 7,
      payCode: generatePayCode(),
      planName: 'Gói Dùng thử Trial (7 ngày)',
      amount: 10000,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    dbInstance.licenses[normalizedEmail] = license;
    saveDatabase();
  } else {
    // Cập nhật lại số ngày còn lại theo thời gian thực
    const now = new Date();
    const expireDate = new Date(license.expiresAt);
    const diffMs = expireDate.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    license.daysRemaining = daysLeft;

    if (daysLeft <= 0 && license.status !== 'Expired') {
      license.status = 'Expired';
      license.updatedAt = new Date().toISOString();
      saveDatabase();
    }
  }

  return license;
}

/**
 * Tìm kiếm License theo payCode
 */
export function findLicenseByPayCode(payCode: string): LicenseRecord | null {
  const cleanCode = payCode.trim().toUpperCase();
  for (const lic of Object.values(dbInstance.licenses)) {
    if (lic.payCode.toUpperCase() === cleanCode) {
      return lic;
    }
  }
  return null;
}

/**
 * Xử lý Webhook thanh toán chuẩn Production (Hỗ trợ cả PayOS, SePay, MBBank, Vietcombank)
 * Có kiểm tra chống trùng lặp giao dịch (Idempotency)
 */
export function processIncomingPayment(data: {
  orderCode?: number | string;
  amount: number;
  description: string;
  gateway?: string;
  accountNumber?: string;
  reference?: string;
}): { success: boolean; message: string; license?: LicenseRecord; isDuplicate?: boolean } {
  const { amount, description, gateway = 'VIETQR', accountNumber, reference } = data;
  const descUpper = (description || '').toUpperCase();

  // Khóa giao dịch duy nhất để chống lặp
  const uniqueRefKey = reference || `${gateway}_${data.orderCode || ''}_${amount}_${descUpper.slice(0, 30)}`;

  if (uniqueRefKey && dbInstance.processedReferences[uniqueRefKey]) {
    console.warn(`[Payment] Bỏ qua giao dịch trùng lặp: ${uniqueRefKey}`);
    return {
      success: true,
      isDuplicate: true,
      message: 'Giao dịch này đã được hệ thống xử lý trước đó (Idempotency Check Passed).',
    };
  }

  // Tìm mã payCode dạng GHxxxx trong nội dung chuyển khoản
  const match = descUpper.match(/GH\d{3,6}/);
  if (!match) {
    return {
      success: false,
      message: `Không tìm thấy mã thanh toán payCode hợp lệ (ví dụ: GH1000) trong nội dung: "${description}"`,
    };
  }

  const payCode = match[0];

  // Tìm kiếm license có payCode tương ứng
  let targetEmail: string | null = null;
  for (const [email, lic] of Object.entries(dbInstance.licenses)) {
    if (lic.payCode.toUpperCase() === payCode) {
      targetEmail = email;
      break;
    }
  }

  if (!targetEmail) {
    return {
      success: false,
      message: `Mã thanh toán "${payCode}" không khớp với bất kỳ sinh viên nào trong hệ thống!`,
    };
  }

  const license = dbInstance.licenses[targetEmail];

  // Phân loại số ngày gia hạn theo số tiền nạp:
  // - Nếu >= 90.000 VNĐ: Gói Năm (+365 ngày)
  // - Nếu >= 10.000 VNĐ: Gói Tháng (+30 ngày)
  const isYearly = amount >= 90000;
  const daysToAdd = isYearly ? 365 : 30;
  const planName = isYearly
    ? 'Gói Năm - FPT LMS Support VIP (365 ngày)'
    : 'Gói Tháng - FPT LMS Support Pro (30 ngày)';

  // Nếu license đang còn hạn thì cộng dồn tiếp từ ngày hết hạn đó
  const currentExpireMs = new Date(license.expiresAt).getTime();
  const baseTime = currentExpireMs > Date.now() ? currentExpireMs : Date.now();
  const newExpire = new Date(baseTime + daysToAdd * 24 * 60 * 60 * 1000);

  license.status = 'Active';
  license.daysRemaining = Math.max(0, Math.ceil((newExpire.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  license.expiresAt = newExpire.toISOString();
  license.planName = planName;
  license.amount = amount;
  license.updatedAt = new Date().toISOString();

  // Đánh dấu đã xử lý giao dịch này
  if (uniqueRefKey) {
    dbInstance.processedReferences[uniqueRefKey] = true;
  }

  // Lưu lịch sử giao dịch chi tiết
  const transactionRecord: PaymentTransactionRecord = {
    id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    orderCode: data.orderCode || Date.now(),
    email: targetEmail,
    payCode,
    amount,
    description,
    gateway,
    accountNumber,
    reference: reference || uniqueRefKey,
    status: 'SUCCESS',
    createdAt: new Date().toISOString(),
  };

  dbInstance.payments.unshift(transactionRecord);
  saveDatabase();

  return {
    success: true,
    message: `Đã kích hoạt thành công cho tài khoản ${targetEmail} (+${daysToAdd} ngày)!`,
    license,
  };
}

/**
 * Kiểm tra xem một mã payCode đã được thanh toán thành công trong 15 phút gần nhất chưa
 */
export function checkRecentPaymentByPayCode(payCode: string): PaymentTransactionRecord | null {
  const cleanCode = payCode.trim().toUpperCase();
  const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;

  for (const txn of dbInstance.payments) {
    if (txn.payCode.toUpperCase() === cleanCode && txn.status === 'SUCCESS') {
      const txnTime = new Date(txn.createdAt).getTime();
      if (txnTime >= fifteenMinutesAgo) {
        return txn;
      }
    }
  }
  return null;
}

/**
 * Lấy lịch sử giao dịch của 1 email
 */
export function getTransactionsByEmail(email: string): PaymentTransactionRecord[] {
  const cleanEmail = email.trim().toLowerCase();
  return dbInstance.payments.filter((p) => p.email.toLowerCase() === cleanEmail);
}

/**
 * Đổi trạng thái thủ công (Dành cho việc test & demo)
 */
export function manualUpdateLicense(
  email: string,
  status: 'Trial' | 'Active' | 'Expired',
  days: number
): LicenseRecord | null {
  const normalizedEmail = email.trim().toLowerCase();
  const license = dbInstance.licenses[normalizedEmail];
  if (!license) return null;

  license.status = status;
  license.daysRemaining = days;
  license.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  license.updatedAt = new Date().toISOString();
  saveDatabase();

  return license;
}

/**
 * Cập nhật cấu hình Cổng thanh toán (PayOS / SePay)
 */
export function updateGatewayConfig(config: PaymentGatewayConfig): PaymentGatewayConfig {
  dbInstance.gatewayConfig = { ...dbInstance.gatewayConfig, ...config };
  saveDatabase();
  return dbInstance.gatewayConfig;
}

export function getGatewayConfig(): PaymentGatewayConfig {
  return dbInstance.gatewayConfig || {};
}

/**
 * Lấy toàn bộ dữ liệu CSDL (Dành cho trang quản trị / kiểm tra)
 */
export function getDatabaseDump() {
  return dbInstance;
}
