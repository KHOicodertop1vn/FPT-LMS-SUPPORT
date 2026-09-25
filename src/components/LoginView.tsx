/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, HelpCircle, Check, Copy, AlertCircle, Mail, User, ArrowRight, Sparkles } from 'lucide-react';
import { DEFAULT_GOOGLE_CLIENT_ID } from '../config/paymentConfig';

interface LoginViewProps {
  onGoogleSuccess: (response: any) => void;
  onSimulatedLogin?: (email: string, name: string) => void;
  onRejectAttempt?: (email: string) => void;
  googleClientId?: string;
  onSaveClientId?: (id: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onGoogleSuccess,
  googleClientId,
  onSimulatedLogin,
  onRejectAttempt,
  onSaveClientId,
}) => {
  const activeClientId = googleClientId || DEFAULT_GOOGLE_CLIENT_ID;
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [showOriginHelp, setShowOriginHelp] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  // Form đăng nhập bằng Email cho bất kỳ người dùng nào trên Internet
  const [inputEmail, setInputEmail] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputError, setInputError] = useState('');

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const copyOriginToClipboard = () => {
    if (currentOrigin) {
      navigator.clipboard.writeText(currentOrigin);
      setCopiedOrigin(true);
      setTimeout(() => setCopiedOrigin(false), 2000);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = inputEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setInputError('Vui lòng nhập địa chỉ email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setInputError('Email không hợp lệ (Ví dụ: tenban@gmail.com)');
      return;
    }

    setInputError('');
    const cleanName = inputName.trim() || cleanEmail.split('@')[0].replace(/[._-]/g, ' ').toUpperCase();
    if (onSimulatedLogin) {
      onSimulatedLogin(cleanEmail, cleanName);
    }
  };

  const handleQuickLogin = (email: string, name: string) => {
    setInputEmail(email);
    setInputName(name);
    setInputError('');
    if (onSimulatedLogin) {
      onSimulatedLogin(email, name);
    }
  };

  /**
   * Khởi tạo Google Identity Services (GSI)
   * Sử dụng thư viện https://accounts.google.com/gsi/client đã được nhúng trong index.html
   */
  useEffect(() => {
    const initGoogleGsi = () => {
      // @ts-ignore
      if (window.google?.accounts?.id && googleBtnRef.current) {
        setGsiLoaded(true);
        try {
          // @ts-ignore
          window.google.accounts.id.initialize({
            client_id: activeClientId,
            callback: onGoogleSuccess,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render nút Google chuẩn của Google Identity Services
          // @ts-ignore
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'pill',
            text: 'signin_with',
            logo_alignment: 'left',
            width: 320,
          });
        } catch (err) {
          console.warn('Lưu ý khởi tạo Google Identity Services:', err);
        }
      }
    };

    // Kiểm tra định kỳ xem script GSI đã tải xong chưa
    const interval = setInterval(() => {
      // @ts-ignore
      if (window.google?.accounts?.id) {
        initGoogleGsi();
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [activeClientId, onGoogleSuccess]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
        {/* Banner trang trí phong cách FPT */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-orange-700/20 rounded-full blur-2xl" />

          {/* Logo FPT Badge */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white text-orange-600 shadow-lg shadow-black/10 mb-4 transform hover:scale-105 transition-transform">
            <span className="font-extrabold text-2xl tracking-tighter">FPT</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Cổng Bản Quyền Extension
          </h2>
          <p className="text-orange-100 text-sm mt-1.5 max-w-sm mx-auto">
            Hệ thống tra cứu thời hạn bản quyền và gia hạn bằng mã VietQR tự động
          </p>
        </div>

        {/* Thân thẻ đăng nhập */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Thông báo chính sách tự động đăng ký Just-In-Time */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-950">Tự động Đăng ký (Just-In-Time):</span> Không
              cần tạo tài khoản trước! Khi bạn bấm đăng nhập, hệ thống sẽ tự động kiểm tra CSDL và tạo mới tài khoản dùng thử <strong className="text-emerald-800 font-bold">Trial 7 ngày</strong> kèm mã VietQR tự động chỉ sau đúng 1 cú click.
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PHƯƠNG THỨC 1: ĐĂNG NHẬP BẰNG EMAIL BẤT KỲ (Ai cũng vào được ngay) */}
          {/* ========================================================================= */}
          <form onSubmit={handleCustomSubmit} className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nhập Email của bạn để bắt đầu
              </label>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Cấp Trial 7 ngày tự động
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="Ví dụ: nguyenvana@gmail.com hoặc student@fpt.edu.vn"
                  value={inputEmail}
                  onChange={(e) => {
                    setInputEmail(e.target.value);
                    if (inputError) setInputError('');
                  }}
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                    inputError
                      ? 'border-rose-400 focus:ring-rose-500/20 bg-rose-50/20'
                      : 'border-slate-300 focus:border-orange-500 focus:ring-orange-500/20 bg-white'
                  }`}
                />
              </div>

              {inputError && (
                <p className="text-xs text-rose-600 font-medium pl-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {inputError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-sm shadow-lg shadow-orange-600/25 active:scale-[0.99] transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Đăng nhập & Tự động tạo bản quyền Trial</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            {/* Quick chips chọn nhanh */}
            <div className="pt-1.5">
              <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                Hoặc chọn nhanh tài khoản mẫu:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('buidangkhoi28@gmail.com', 'Bùi Đăng Khởi')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 text-slate-700 text-[11px] font-medium border border-slate-200 transition-colors"
                >
                  ⚡ buidangkhoi28@gmail.com
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('sinhvien.fpt@fpt.edu.vn', 'Sinh Viên FPT')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 text-slate-700 text-[11px] font-medium border border-slate-200 transition-colors"
                >
                  🎓 sinhvien.fpt@fpt.edu.vn
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('nguyenvana@gmail.com', 'Nguyễn Văn A')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 text-slate-700 text-[11px] font-medium border border-slate-200 transition-colors"
                >
                  👤 nguyenvana@gmail.com
                </button>
              </div>
            </div>
          </form>

          {/* Dải phân cách OR */}
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                Hoặc đăng nhập bằng Google (Chrome)
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PHƯƠNG THỨC 2: NÚT GOOGLE SIGN-IN CHÍNH THỨC */}
          {/* ========================================================================= */}
          <div className="flex flex-col items-center justify-center space-y-3 pt-1">
            {/* Nút bấm Đăng nhập bằng Google kích thước lớn */}
            <button
              onClick={() => {
                const googleButtonInner = googleBtnRef.current?.querySelector('div[role="button"]') as HTMLElement | null;
                if (googleButtonInner) {
                  googleButtonInner.click();
                  return;
                }
                // @ts-ignore
                if (window.google?.accounts?.id && activeClientId) {
                  // @ts-ignore
                  window.google.accounts.id.prompt();
                } else if (onSimulatedLogin) {
                  onSimulatedLogin('buidangkhoi28@gmail.com', 'Bùi Đăng Khởi');
                }
              }}
              className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border-2 border-slate-200 hover:border-slate-300 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
            >
              {/* Google G Icon */}
              <div className="w-5 h-5 rounded-full p-0.5 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </div>
              <span>Tiếp tục với Tài khoản Google</span>
            </button>

            {/* Container nhúng Google Identity Services nút chuẩn */}
            <div className="flex flex-col items-center w-full">
              <div ref={googleBtnRef} className="min-h-[44px] flex items-center justify-center mt-1" />
              {!gsiLoaded && (
                <div className="text-[11px] text-slate-400 animate-pulse mt-1">
                  Đang khởi tạo popup Google Chrome...
                </div>
              )}
            </div>

            {/* Trợ giúp lỗi ủy quyền Google OAuth */}
            <div className="w-full pt-1 text-center">
              <button
                type="button"
                onClick={() => setShowOriginHelp(!showOriginHelp)}
                className="text-xs text-slate-500 hover:text-orange-600 flex items-center justify-center gap-1 mx-auto font-medium transition-colors"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Bị thông báo "Lỗi ủy quyền" khi bấm vào nút Google?</span>
              </button>

              {showOriginHelp && (
                <div className="mt-2.5 p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 text-left text-xs text-amber-950 space-y-2.5 animate-in fade-in duration-200">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <span>Cách khắc phục "Lỗi ủy quyền" (origin_mismatch):</span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-amber-800">
                    Google yêu cầu tên miền đang chạy phải được khai báo trong Google Cloud Console. Bạn chỉ cần sao chép tên miền này:
                  </p>
                  
                  {/* Box copy URL origin */}
                  <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-amber-300">
                    <code className="flex-1 font-mono text-[11px] text-amber-950 font-bold truncate">
                      {currentOrigin}
                    </code>
                    <button
                      type="button"
                      onClick={copyOriginToClipboard}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1 flex-shrink-0 cursor-pointer"
                    >
                      {copiedOrigin ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>

                  <ol className="text-[11px] text-amber-900/90 list-decimal list-inside space-y-1 pl-1">
                    <li>Vào <strong>Google Cloud Console</strong> &gt; <strong>Credentials</strong></li>
                    <li>Bấm vào <strong>OAuth 2.0 Client ID</strong> bạn đã tạo</li>
                    <li>Ở mục <strong>"Authorized JavaScript origins"</strong>, bấm <strong>ADD URI</strong> và dán link vừa sao chép ở trên vào</li>
                    <li>Nhấn <strong>SAVE (Lưu)</strong> và tải lại trang này là đăng nhập được ngay!</li>
                  </ol>
                </div>
              )}
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1 pt-4 border-t border-slate-100">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Hệ thống Bản quyền Tiện ích FPT • Hỗ trợ 24/7</span>
          </div>
        </div>
      </div>
    </div>
  );
};
