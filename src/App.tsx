/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { StudentInfoCard } from './components/StudentInfoCard';
import { PaymentQRCard } from './components/PaymentQRCard';
import { PaymentModal } from './components/PaymentModal';
import { StudentInfoView } from './components/StudentInfoView';
import { PlansSelectionView, PlanType } from './components/PlansSelectionView';
import { BankConfigModal } from './components/BankConfigModal';
import { BackendCodeModal } from './components/BackendCodeModal';
import { PayOSWebhookModal } from './components/PayOSWebhookModal';
import { AlertToast, ToastMessage } from './components/AlertToast';
import { UserProfile, LicenseResponse, LicenseStatus, BankInfo } from './types';
import { decodeJwtResponse, isFptEmail, isValidEmail } from './utils/jwt';
import { VIETQR_CONFIG, DEFAULT_BACKEND_API, DEFAULT_GOOGLE_CLIENT_ID } from './config/paymentConfig';
import { AlertCircle, ServerOff, CheckCircle2, ShieldAlert, Sparkles, CreditCard, User, Layers, ArrowLeft } from 'lucide-react';

export default function App() {
  // =========================================================================
  // 1. STATE QUẢN LÝ NGƯỜI DÙNG & PHIÊN ĐĂNG NHẬP
  // =========================================================================
  const [user, setUser] = useState<UserProfile | null>(() => {
    // Khôi phục phiên làm việc trước đó từ sessionStorage nếu có
    const saved = sessionStorage.getItem('fpt_user');
    return saved ? JSON.parse(saved) : null;
  });

  // State cấu hình Google OAuth Client ID
  const [googleClientId, setGoogleClientId] = useState<string>(() => {
    return (
      localStorage.getItem('google_client_id') ||
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      DEFAULT_GOOGLE_CLIENT_ID
    );
  });

  // =========================================================================
  // 1.1 TÁCH RỜI TRANG & MODAL THANH TOÁN THEO YÊU CẦU
  // - activeTab: 'plans' (Gói thành viên) | 'student' (Thông tin sinh viên & Giấy phép)
  // - isPaymentModalOpen: modal thanh toán VietQR nổi lên với background mờ và đếm ngược phiên
  // - isPayOSWebhookOpen: modal cấu hình và bắt chuyển khoản tự động PayOS MBBank
  // =========================================================================
  const [activeTab, setActiveTab] = useState<'plans' | 'student'>('plans');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPayOSWebhookOpen, setIsPayOSWebhookOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');

  // =========================================================================
  // 2. STATE DỮ LIỆU BẢN QUYỀN (LICENSE) TỪ BACKEND API
  // =========================================================================
  const [license, setLicense] = useState<LicenseResponse>({
    status: 'Trial',
    daysRemaining: 7,
    payCode: 'GH1000',
    planName: 'Gói Dùng thử Trial (7 ngày)',
    amount: 10000,
    updatedAt: new Date().toLocaleTimeString('vi-VN'),
  });

  const [isLoadingLicense, setIsLoadingLicense] = useState(false);
  const [backendUrl, setBackendUrl] = useState<string>(() => {
    const saved = localStorage.getItem('backend_api_url');
    if (saved) return saved;
    localStorage.setItem('backend_api_url', 'http://localhost:8080/api/v1/license');
    return 'http://localhost:8080/api/v1/license';
  });
  const [backendError, setBackendError] = useState<string | null>(null);

  // =========================================================================
  // 3. STATE CẤU HÌNH NGÂN HÀNG VIETQR
  // =========================================================================
  const [bankInfo, setBankInfo] = useState<BankInfo>(() => {
    const saved = localStorage.getItem('vietqr_bank_info');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.accountNo !== '0388888888' && parsed.accountName !== 'NGUYEN VAN A') {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return {
      bankId: VIETQR_CONFIG.BANK_ID,
      accountNo: VIETQR_CONFIG.ACCOUNT_NO,
      accountName: VIETQR_CONFIG.ACCOUNT_NAME,
      amount: VIETQR_CONFIG.DEFAULT_AMOUNT,
    };
  });

  // UI state: Modal cấu hình & Toasts thông báo
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isBackendCodeOpen, setIsBackendCodeOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  /**
   * Hàm hiển thị thông báo Toast nổi trên màn hình
   */
  const addToast = useCallback(
    (type: ToastMessage['type'], title: string, message: string) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
      setToasts((prev) => [...prev, { id, type, title, message }]);

      // Tự động đóng toast sau 5 giây
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // =========================================================================
  // ⭐️ YÊU CẦU 2: GỌI API BACKEND LẤY THÔNG TIN BẢN QUYỀN
  // GET http://localhost:8080/api/v1/license?email={email}
  // =========================================================================
  /**
   * Hàm fetchLicenseData:
   * 1. Nhận email người dùng làm tham số
   * 2. Gọi fetch tới endpoint backend
   * 3. Xử lý dữ liệu trả về và cập nhật state license
   * 4. Bắt lỗi kết nối nếu backend localhost:8080 chưa khởi động
   */
  const fetchLicenseData = useCallback(
    async (email: string, nameOrShowToast?: string | boolean, maybeShowToast = true) => {
      if (!email) return;

      const name = typeof nameOrShowToast === 'string' ? nameOrShowToast : undefined;
      const showToast = typeof nameOrShowToast === 'boolean' ? nameOrShowToast : maybeShowToast;

      setIsLoadingLicense(true);
      setBackendError(null);

      const queryParams = new URLSearchParams({ email });
      if (name) queryParams.set('name', name);

      const targetUrl = backendUrl.includes('?')
        ? `${backendUrl}&${queryParams.toString()}`
        : `${backendUrl}?${queryParams.toString()}`;
      console.log(`[API Call] Đang gọi tới: ${targetUrl}`);

      try {
        const response = await fetch(targetUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Mã lỗi HTTP: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[API Call] Dữ liệu nhận từ Backend:', data);

        let normalizedStatus: LicenseStatus = 'Trial';
        if (data.status) {
          const s = String(data.status).toUpperCase();
          if (s === 'ACTIVE') normalizedStatus = 'Active';
          else if (s === 'EXPIRED') normalizedStatus = 'Expired';
          else normalizedStatus = 'Trial';
        }

        const days = typeof data.daysRemaining === 'number'
          ? data.daysRemaining
          : (typeof data.daysLeft === 'number' ? data.daysLeft : 7);

        // Cập nhật thông tin bản quyền từ response của Backend
        const formattedLicense: LicenseResponse = {
          email: data.email || email,
          status: normalizedStatus,
          daysRemaining: days,
          payCode: data.payCode || 'GH1000',
          planName: data.planName || (normalizedStatus === 'Active' ? 'Gói Tháng - FPT LMS Support Pro' : 'Gói Dùng thử Trial (7 ngày)'),
          amount: data.amount || 10000,
          updatedAt: new Date().toLocaleTimeString('vi-VN'),
        };

        setLicense(formattedLicense);

        if (showToast) {
          const isLocal = backendUrl.includes('8080');
          addToast(
            'success',
            isLocal ? '🟢 Đã lưu vào SQL Server (Localhost 8080)!' : 'Đồng bộ thành công!',
            isLocal
              ? `Tài khoản ${data.email} đã được lưu vào SQL với mã thanh toán ${data.payCode}!`
              : `Đã cập nhật trạng thái bản quyền mới nhất từ máy chủ.`
          );
        }
      } catch (err: any) {
        console.warn('[API Call] Lỗi kết nối Backend:', err.message);
        setBackendError(err.message || 'Không thể kết nối đến máy chủ backend');

        // Khi chạy demo hoặc backend localhost:8080 chưa được mở hoặc bị chặn CORS,
        // sinh payCode động dựa trên email sinh viên để mã VietQR luôn hoạt động
        const studentCodeMatch = email.match(/([a-zA-Z]{2}\d{5,6})/i);
        const dynamicPayCode = studentCodeMatch
          ? `FPT${studentCodeMatch[1].toUpperCase()}`
          : `GH${Math.floor(1000 + Math.random() * 9000)}`;

        setLicense((prev) => ({
          ...prev,
          email,
          payCode: prev.payCode || dynamicPayCode,
          updatedAt: new Date().toLocaleTimeString('vi-VN'),
        }));

        if (showToast) {
          const isLocal = backendUrl.includes('8080');
          addToast(
            'warning',
            isLocal ? '⚠️ Chưa kết nối được localhost:8080' : 'Đang dùng chế độ mô phỏng',
            isLocal
              ? `Vui lòng đảm bảo Spring Boot đang chạy và đã thêm @CrossOrigin(origins = "*") trên LicenseController để trình duyệt cho phép kết nối.`
              : `Không thể kết nối tới ${backendUrl}. Đang hiển thị dữ liệu mô phỏng.`
          );
        }
      } finally {
        setIsLoadingLicense(false);
      }
    },
    [backendUrl, license.payCode, addToast]
  );

  // =========================================================================
  // ⭐️ PAYOS WEBHOOK: TỰ ĐỘNG KIỂM TRA ĐỊNH KỲ (AUTO-POLLING) & MÔ PHỎNG TEST
  // =========================================================================
  const previousStatusRef = React.useRef(license.status);
  const [isSimulatingPayOS, setIsSimulatingPayOS] = useState(false);

  // Tự động kiểm tra (auto-polling) mỗi 4 giây khi trạng thái chưa Active (đang chờ PayOS webhook)
  useEffect(() => {
    if (!user?.email || license.status === 'Active') return;

    const interval = setInterval(() => {
      fetchLicenseData(user.email, false);
    }, 4000);

    return () => clearInterval(interval);
  }, [user?.email, license.status, fetchLicenseData]);

  // Thông báo chúc mừng khi PayOS Webhook cập nhật CSDL thành công
  useEffect(() => {
    if (previousStatusRef.current !== 'Active' && license.status === 'Active') {
      addToast(
        'success',
        '🎉 Kích hoạt bản quyền thành công!',
        `Cổng PayOS đã xác nhận giao dịch hợp lệ! Bản quyền của bạn đã được gia hạn thêm 30 ngày.`
      );
    }
    previousStatusRef.current = license.status;
  }, [license.status, addToast]);

  /**
   * Xử lý chọn gói dịch vụ (Miễn phí 0đ, Gói tháng 10.000đ, Gói năm 90.000đ)
   * Theo yêu cầu: Khi bấm vào gói tháng hoặc năm thì modal thanh toán VietQR nổi lên với background mờ
   */
  const handleSelectPlan = (plan: PlanType) => {
    setSelectedPlan(plan);
    if (plan === 'trial') {
      setLicense((prev) => ({
        ...prev,
        status: 'Trial',
        daysRemaining: 7,
        planName: 'Gói Dùng thử Trial (7 ngày)',
        amount: 0,
        updatedAt: new Date().toLocaleTimeString('vi-VN'),
      }));
      setActiveTab('student');
      addToast(
        'success',
        'Kích hoạt dùng thử thành công!',
        'Bạn đã kích hoạt gói Trial 7 ngày miễn phí. Trải nghiệm ngay các tính năng FPT LMS Support!'
      );
    } else if (plan === 'monthly') {
      setBankInfo((prev) => ({ ...prev, amount: 10000 }));
      setLicense((prev) => ({
        ...prev,
        amount: 10000,
        planName: 'Gói Tháng - FPT LMS Support Pro (30 ngày)',
        updatedAt: new Date().toLocaleTimeString('vi-VN'),
      }));
      setIsPaymentModalOpen(true);
      addToast(
        'info',
        'Đã mở cổng thanh toán VietQR (10.000 VNĐ)',
        'Mã VietQR đã sẵn sàng. Phiên thanh toán an toàn kéo dài 10 phút!'
      );
    } else if (plan === 'yearly') {
      setBankInfo((prev) => ({ ...prev, amount: 90000 }));
      setLicense((prev) => ({
        ...prev,
        amount: 90000,
        planName: 'Gói Năm - FPT LMS Support VIP (365 ngày)',
        updatedAt: new Date().toLocaleTimeString('vi-VN'),
      }));
      setIsPaymentModalOpen(true);
      addToast(
        'info',
        'Đã mở cổng thanh toán VietQR (90.000 VNĐ - Tiết kiệm 25%)',
        'Mã VietQR 365 ngày đã sẵn sàng. Phiên thanh toán an toàn kéo dài 10 phút!'
      );
    }
  };

  // Hàm mô phỏng gửi Webhook PayOS tới Backend để kiểm tra mở License
  const handleSimulatePayOS = async () => {
    setIsSimulatingPayOS(true);
    const isYearly = (bankInfo.amount || 10000) >= 90000;
    const daysToAdd = isYearly ? 365 : 30;
    const planTitle = isYearly
      ? 'Gói Năm - FPT LMS Support VIP (365 ngày)'
      : 'Gói Tháng - FPT LMS Support Pro (30 ngày)';

    try {
      const res = await fetch('/api/payos/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email || license.email || 'buidangkhoi28@gmail.com',
          amount: bankInfo.amount || 10000,
          payCode: license.payCode,
        }),
      });

      if (res.ok) {
        addToast(
          'success',
          'MBBank: Đã nhận chuyển khoản thành công!',
          `PayOS Webhook đã xử lý giao dịch. Bản quyền đã tự động nâng cấp sang ACTIVE (+${daysToAdd} ngày)!`
        );
        await fetchLicenseData(user?.email || license.email || '', false);
        setActiveTab('student');
        setIsSimulatingPayOS(false);
        return;
      }
    } catch (e: any) {
      console.warn('Lỗi gọi Webhook local, kích hoạt fallback:', e.message);
    }

    // Fallback nếu chạy độc lập
    setLicense((prev) => ({
      ...prev,
      status: 'Active',
      planName: planTitle,
      daysRemaining: daysToAdd,
      updatedAt: new Date().toLocaleTimeString('vi-VN'),
    }));
    addToast(
      'success',
      'Kích hoạt thành công (Mô phỏng PayOS)!',
      `Nội dung chuyển khoản chứa mã "${license.payCode}" hợp lệ -> Bản quyền đã chuyển sang ACTIVE (${daysToAdd} ngày)!`
    );
    setIsSimulatingPayOS(false);
    setActiveTab('student');
  };

  // =========================================================================
  // ⭐️ XỬ LÝ SỰ KIỆN GOOGLE SIGN-IN & KIỂM TRA ĐỊNH DẠNG EMAIL HỢP LỆ
  // =========================================================================
  /**
   * Hàm callback bắt sự kiện đăng nhập thành công từ Google Identity Services
   * 1. Nhận response chứa `credential` (JWT token) từ Google
   * 2. Giải mã (decode) JWT để lấy `email`, `name`, `picture`
   * 3. Kiểm tra định dạng email có hợp lệ hay không (RFC email check)
   * 4. Chấp nhận mọi tài khoản email hợp lệ (@gmail.com, @fpt.edu.vn...)
   * 5. Lưu user và gọi API backend để lấy thông tin bản quyền và tạo mã VietQR
   */
  const handleGoogleCredentialResponse = useCallback(
    (response: any) => {
      console.log('[Google Identity Services] Bắt sự kiện đăng nhập thành công');

      try {
        if (!response.credential) {
          throw new Error('Không tìm thấy credential JWT trong phản hồi Google.');
        }

        // Bước 1: Giải mã JWT token
        const profile = decodeJwtResponse(response.credential);
        console.log('[Google Identity Services] Đã giải mã profile:', profile);

        // Bước 2: Kiểm tra email có hợp lệ không
        if (!isValidEmail(profile.email)) {
          console.warn('[Xác thực] Từ chối đăng nhập: email không hợp lệ ->', profile.email);
          addToast(
            'error',
            'Email không hợp lệ!',
            `Địa chỉ email "${profile.email}" không đúng định dạng. Vui lòng thử lại với tài khoản Google hợp lệ.`
          );
          return;
        }

        // Bước 3: Đăng nhập thành công với bất kỳ email hợp lệ
        setUser(profile);
        sessionStorage.setItem('fpt_user', JSON.stringify(profile));
        
        const isFpt = isFptEmail(profile.email);
        addToast(
          'success',
          'Đăng nhập thành công!',
          `Chào mừng ${profile.name} (${profile.email})${isFpt ? ' - Sinh viên FPT' : ''}!`
        );

        // Bước 4: Gọi API backend lấy trạng thái bản quyền và thêm vào database
        fetchLicenseData(profile.email, profile.name, false);
      } catch (err: any) {
        console.error('[Google Sign-In Error]:', err);
        addToast(
          'error',
          'Lỗi đăng nhập',
          err.message || 'Có lỗi xảy ra khi xử lý phản hồi từ Google.'
        );
      }
    },
    [addToast, fetchLicenseData]
  );

  /**
   * Hàm hỗ trợ đăng nhập test / mô phỏng (chấp nhận mọi email hợp lệ)
   */
  const handleSimulatedLogin = (email: string, name: string) => {
    if (!isValidEmail(email)) {
      handleRejectAttempt(email);
      return;
    }

    const mockProfile: UserProfile = {
      name,
      email,
      picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        email
      )}&backgroundColor=ffdfbf,ffd5dc,d1d4f9,c0aede,b6e3f4`,
      hd: email.includes('@') ? email.split('@')[1] : 'google.com',
    };

    setUser(mockProfile);
    sessionStorage.setItem('fpt_user', JSON.stringify(mockProfile));
    addToast(
      'success',
      'Đăng nhập thành công!',
      `Đã đăng nhập với tài khoản: ${email}`
    );

    fetchLicenseData(email, name, false);
  };

  /**
   * Hàm xử lý khi email không hợp lệ
   */
  const handleRejectAttempt = (rejectedEmail: string) => {
    addToast(
      'error',
      'Cảnh báo: Email không hợp lệ!',
      `Địa chỉ "${rejectedEmail}" không đúng định dạng email (ví dụ: username@domain.com). Vui lòng nhập email hợp lệ!`
    );
  };

  /**
   * Hàm Đăng xuất
   */
  const handleLogout = () => {
    setUser(null);
    setIsPaymentModalOpen(false);
    setActiveTab('plans');
    sessionStorage.removeItem('fpt_user');
    addToast('info', 'Đã đăng xuất', 'Bạn đã đăng xuất khỏi hệ thống thành công.');
  };

  /**
   * Lưu cấu hình ngân hàng vào localStorage
   */
  const handleSaveBankInfo = (newInfo: BankInfo) => {
    setBankInfo(newInfo);
    localStorage.setItem('vietqr_bank_info', JSON.stringify(newInfo));
    addToast(
      'success',
      'Đã lưu thông tin VietQR',
      `Ngân hàng: ${newInfo.bankId}, STK: ${newInfo.accountNo}, Tên: ${newInfo.accountName}`
    );
  };

  /**
   * Lưu URL backend API
   */
  const handleSaveApiEndpoint = (newUrl: string) => {
    setBackendUrl(newUrl);
    localStorage.setItem('backend_api_url', newUrl);
  };

  /**
   * Lưu Google Client ID
   */
  const handleSaveClientId = (newId: string) => {
    setGoogleClientId(newId);
    localStorage.setItem('google_client_id', newId);
  };

  /**
   * Chuyển đổi thủ công trạng thái bản quyền (phục vụ mục đích test & demo giao diện)
   */
  const handleManualStatusChange = (status: LicenseStatus, days: number) => {
    setLicense((prev) => ({
      ...prev,
      status,
      daysRemaining: days,
      updatedAt: new Date().toLocaleTimeString('vi-VN'),
    }));
    addToast(
      'info',
      `Đã chuyển trạng thái: ${status}`,
      `Thời hạn: ${days} ngày. Mã thanh toán: ${license.payCode}`
    );
  };

  // Tự động tải thông tin bản quyền khi đã có user đăng nhập
  useEffect(() => {
    if (user && user.email) {
      fetchLicenseData(user.email, false);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Toast thông báo cảnh báo / thành công */}
      <AlertToast toasts={toasts} onDismiss={dismissToast} />

      {/* Thanh điều hướng Navbar */}
      <Navbar
        user={user}
        status={license.status}
        backendUrl={backendUrl}
        onLogout={handleLogout}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenBackendCode={() => setIsBackendCodeOpen(true)}
        onOpenPayOSWebhook={() => setIsPayOSWebhookOpen(true)}
        onRefresh={user ? () => fetchLicenseData(user.email, true) : undefined}
        isRefreshing={isLoadingLicense}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!user ? (
          // =========================================================================
          // TRẠNG THÁI CHƯA ĐĂNG NHẬP: Hiển thị nút "Đăng nhập bằng Email FPT" ở giữa
          // =========================================================================
          <LoginView
            onGoogleSuccess={handleGoogleCredentialResponse}
            onSimulatedLogin={handleSimulatedLogin}
            onRejectAttempt={handleRejectAttempt}
            googleClientId={googleClientId}
            onSaveClientId={handleSaveClientId}
          />
        ) : (
          // =========================================================================
          // TRẠNG THÁI ĐÃ ĐĂNG NHẬP: Hiển thị Tab chọn gói cước trước hoặc Dashboard
          // =========================================================================
          <div className="space-y-6">
            {/* Banner cảnh báo nếu không kết nối được backend localhost:8080 */}
            {backendError && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <ServerOff className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold">Lưu ý kết nối Backend:</span> Không kết nối được{' '}
                    <code className="font-mono bg-amber-100/70 px-1 py-0.5 rounded text-amber-950 font-semibold">
                      {backendUrl}
                    </code>
                    . Hệ thống đang hiển thị dữ liệu mô phỏng để bạn có thể xem và kiểm tra mã VietQR ngay!
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => fetchLicenseData(user.email, true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors"
                  >
                    Thử kết nối lại
                  </button>
                  <button
                    onClick={() => setIsConfigOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 text-xs font-semibold transition-colors"
                  >
                    Đổi URL API
                  </button>
                </div>
              </div>
            )}

            {/* Thanh điều hướng 2 Trang độc lập theo yêu cầu:
                1. Gói thành viên & Bảng giá
                2. Thông tin sinh viên & Giấy phép */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('plans')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'plans'
                      ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1. Gói thành viên & Bảng giá</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('student')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'student'
                      ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>2. Thông tin sinh viên & Giấy phép</span>
                </button>
              </div>

              {/* Quick Status Pill */}
              <div className="flex items-center gap-2 pr-2">
                <span className="text-[11px] text-slate-500 hidden sm:inline">Gói hiện tại:</span>
                <span className="text-xs font-bold text-slate-800 font-mono bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  {license.status} ({license.daysRemaining} ngày)
                </span>
                {license.status !== 'Active' && (
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200 cursor-pointer transition-colors"
                  >
                    <CreditCard className="w-3 h-3 text-orange-600" />
                    <span>Mở thanh toán VietQR</span>
                  </button>
                )}
              </div>
            </div>

            {/* NỘI DUNG THEO TRANG ĐÃ ĐƯỢC TÁCH HOÀN TOÀN */}
            {activeTab === 'plans' ? (
              // TRANG 1: BẢNG GIÁ & CHỌN GÓI THÀNH VIÊN (Hiện ra đầu tiên theo yêu cầu)
              <PlansSelectionView
                currentStatus={license.status}
                selectedPlan={selectedPlan}
                onSelectPlan={handleSelectPlan}
                onViewDashboard={() => setActiveTab('student')}
                userEmail={user.email}
              />
            ) : (
              // TRANG 2: THÔNG TIN SINH VIÊN & BẢN QUYỀN ĐỘC LẬP
              <StudentInfoView
                user={user}
                license={license}
                isLoading={isLoadingLicense}
                onRefresh={() => fetchLicenseData(user.email, true)}
                onUpgradeClick={() => setIsPaymentModalOpen(true)}
                onManualStatusChange={handleManualStatusChange}
              />
            )}
          </div>
        )}
      </main>

      {/* MODAL THANH TOÁN & KÍCH HOẠT BẢN QUYỀN (Nổi lên trên, background mờ, đếm ngược phiên 10 phút) */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        license={license}
        bankInfo={bankInfo}
        onOpenConfig={() => setIsConfigOpen(true)}
        onRefresh={() => fetchLicenseData(user?.email || license.email || '', true)}
        onSimulatePayOS={handleSimulatePayOS}
        onOpenPayOSWebhook={() => {
          setIsPaymentModalOpen(false);
          setIsPayOSWebhookOpen(true);
        }}
        isSimulatingPayOS={isSimulatingPayOS}
        isPolling={!isLoadingLicense && license.status !== 'Active'}
        selectedPlanTitle={
          bankInfo.amount === 90000
            ? 'Gói Năm - FPT LMS Support VIP (365 ngày)'
            : 'Gói Tháng - FPT LMS Support Pro (30 ngày)'
        }
        onChangePlan={() => {
          setIsPaymentModalOpen(false);
          setActiveTab('plans');
        }}
        onSessionReset={() => {
          fetchLicenseData(user?.email || license.email || '', false);
        }}
      />

      {/* Modal Cấu hình & Bắt Chuyển Khoản PayOS Webhook (MBBank 0825566455) */}
      <PayOSWebhookModal
        isOpen={isPayOSWebhookOpen}
        onClose={() => setIsPayOSWebhookOpen(false)}
        currentUserEmail={user?.email || license.email}
        currentPayCode={license.payCode}
        onWebhookSuccess={() => fetchLicenseData(user?.email || license.email || '', false)}
      />

      {/* Modal Cấu hình Ngân hàng & Backend API */}
      <BankConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        bankInfo={bankInfo}
        onSave={handleSaveBankInfo}
        apiEndpoint={backendUrl}
        onSaveApiEndpoint={handleSaveApiEndpoint}
      />

      {/* Modal Xem toàn bộ Code Java Spring Boot 3.x & SQL Server */}
      <BackendCodeModal
        isOpen={isBackendCodeOpen}
        onClose={() => setIsBackendCodeOpen(false)}
      />
    </div>
  );
}
