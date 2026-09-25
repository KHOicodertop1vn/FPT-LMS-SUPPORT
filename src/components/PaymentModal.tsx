/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Copy,
  Check,
  Download,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Smartphone,
  ArrowRight,
  Info,
  CheckCircle2,
  Zap,
  RefreshCw,
  Radio,
  Clock,
  X,
  Lock,
} from 'lucide-react';
import { BankInfo, LicenseResponse, LicenseStatus } from '../types';
import { buildVietQRUrl, POPULAR_BANKS } from '../config/paymentConfig';

const SESSION_DURATION_SECONDS = 600; // 10 phút đếm ngược

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: LicenseResponse;
  bankInfo: BankInfo;
  onOpenConfig: () => void;
  onRefresh: () => void;
  onSimulatePayOS?: () => void;
  onOpenPayOSWebhook?: () => void;
  isSimulatingPayOS?: boolean;
  isPolling?: boolean;
  selectedPlanTitle?: string;
  onChangePlan?: () => void;
  onSessionReset?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  license,
  bankInfo,
  onOpenConfig,
  onRefresh,
  onSimulatePayOS,
  onOpenPayOSWebhook,
  isSimulatingPayOS = false,
  isPolling = false,
  selectedPlanTitle,
  onChangePlan,
  onSessionReset,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(SESSION_DURATION_SECONDS);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [sessionPayCode, setSessionPayCode] = useState<string>(license.payCode || 'GH1000');
  const [sessionOrderCode, setSessionOrderCode] = useState<number | null>(null);

  // Khởi tạo phiên thanh toán mới với mã giao dịch ngẫu nhiên duy nhất
  const createNewSession = async () => {
    try {
      const res = await fetch('/api/payment/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: license.email,
          amount: bankInfo.amount,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionPayCode(data.payCode);
        setSessionOrderCode(data.orderCode);
      }
    } catch (e) {
      console.warn('Lỗi tạo session:', e);
    }
  };

  // Đếm ngược phiên thanh toán mỗi khi modal mở
  useEffect(() => {
    if (!isOpen) return;

    // Reset lại timer và sinh mã phiên mới mỗi khi mở modal
    setTimeLeft(SESSION_DURATION_SECONDS);
    setIsExpired(false);
    createNewSession();

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, bankInfo.amount, license.email]);

  // Format mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResetSession = () => {
    setTimeLeft(SESSION_DURATION_SECONDS);
    setIsExpired(false);
    setQrLoaded(false);
    createNewSession();
    if (onSessionReset) {
      onSessionReset();
    }
  };

  if (!isOpen) return null;

  const payCode = sessionPayCode || license.payCode || 'GH1000';
  const vietQrImageUrl = buildVietQRUrl(
    bankInfo.bankId,
    bankInfo.accountNo,
    bankInfo.accountName,
    bankInfo.amount || 10000,
    payCode
  );

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isWarningTime = timeLeft <= 120 && timeLeft > 0; // Còn dưới 2 phút

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Background mờ đi (Backdrop blur) theo yêu cầu */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog chính nổi lên trên */}
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200/90 z-10 overflow-hidden my-auto animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Thanh toán & Kích hoạt bản quyền VietQR
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {selectedPlanTitle || 'Gói FPT LMS Support'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bộ đếm ngược thời gian phiên an toàn */}
            <div
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                isExpired
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : isWarningTime
                  ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {isExpired ? 'Phiên hết hạn' : `Hết hạn: ${formatTime(timeLeft)}`}
              </span>
            </div>

            {/* Nút đóng modal */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nội dung Modal có thể cuộn nếu màn hình nhỏ */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Thanh cảnh báo phiên đếm ngược trên Mobile & Máy tính */}
          <div
            className={`p-3 rounded-2xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
              isExpired
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : isWarningTime
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-orange-50/70 border-orange-200 text-orange-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock
                className={`w-4 h-4 flex-shrink-0 ${
                  isExpired ? 'text-rose-600' : 'text-orange-600 animate-pulse'
                }`}
              />
              <div>
                {isExpired ? (
                  <span className="font-bold text-rose-700">
                    ⚠️ Phiên giao dịch đã hết hạn! Vui lòng làm mới để tiếp tục chuyển khoản an toàn.
                  </span>
                ) : (
                  <span>
                    Phiên thanh toán an toàn còn:{' '}
                    <strong className="font-mono text-sm font-black text-orange-700">
                      {formatTime(timeLeft)}
                    </strong>
                    . Vui lòng chuyển khoản trước khi phiên kết thúc.
                  </span>
                )}
              </div>
            </div>

            {onChangePlan && (
              <button
                type="button"
                onClick={onChangePlan}
                className="text-xs font-bold text-orange-700 hover:text-orange-900 underline whitespace-nowrap self-end sm:self-auto cursor-pointer"
              >
                Đổi gói khác &rarr;
              </button>
            )}
          </div>

          {/* Khối chính 2 cột: Ảnh VietQR & Thông tin chuyển khoản */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
            {/* Cột trái: Mã VietQR có khóa bảo vệ phiên */}
            <div className="sm:col-span-5 flex flex-col items-center">
              <div className="relative group p-3 bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl border-2 border-slate-200/90 shadow-md w-full max-w-[240px]">
                {/* Badge VietQR */}
                <div className="absolute top-2 right-2 z-10 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  VietQR 24/7
                </div>

                {/* Thẻ QR với lớp phủ hết hạn */}
                <div className="relative w-full aspect-square bg-white rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
                  {!qrLoaded && !isExpired && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-2 p-3 text-center">
                      <QrCode className="w-8 h-8 animate-pulse text-orange-500" />
                      <span className="text-[11px] font-medium">Đang tạo mã VietQR...</span>
                    </div>
                  )}

                  <img
                    src={vietQrImageUrl}
                    alt={`Mã VietQR thanh toán ${payCode}`}
                    onLoad={() => setQrLoaded(true)}
                    className={`w-full h-auto object-contain transition-all duration-300 ${
                      isExpired ? 'blur-md opacity-30 scale-95' : qrLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                  />

                  {/* Lớp phủ khi hết hạn phiên (Session Expired) */}
                  {isExpired && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center text-white space-y-2 animate-in fade-in">
                      <Lock className="w-8 h-8 text-rose-400" />
                      <span className="text-xs font-bold text-rose-300 leading-tight">
                        Mã QR đã hết hiệu lực
                      </span>
                      <p className="text-[10px] text-slate-300">
                        Đã đóng để bảo vệ phiên giao dịch
                      </p>
                      <button
                        type="button"
                        onClick={handleResetSession}
                        className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Tạo mã mới</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Mã payCode */}
                <div className="mt-2 text-center">
                  <span className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {payCode}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Quét bằng MoMo hoặc App Ngân Hàng
                  </span>
                </div>
              </div>

              {/* Nút tải / mở QR */}
              {!isExpired && (
                <div className="mt-3 flex items-center gap-2 w-full max-w-[240px] justify-center">
                  <a
                    href={vietQrImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 transition-colors shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>Mở ảnh lớn</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleResetSession}
                    title="Làm mới lại 10 phút"
                    className="py-1.5 px-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Làm mới</span>
                  </button>
                </div>
              )}
            </div>

            {/* Cột phải: Chi tiết chuyển khoản & Sao chép nhanh */}
            <div className="sm:col-span-7 space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                {/* Ngân hàng */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <span className="text-slate-500 font-medium">Ngân hàng / Ví:</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {bankInfo.bankId === 'MOMO' ? 'Ví điện tử MoMo' : bankInfo.bankId}
                  </span>
                </div>

                {/* Số tài khoản */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <span className="text-slate-500 font-medium">Số tài khoản / SĐT:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {bankInfo.accountNo}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(bankInfo.accountNo, 'accountNo')}
                      className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                      title="Sao chép số tài khoản"
                    >
                      {copiedField === 'accountNo' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Chủ tài khoản */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <span className="text-slate-500 font-medium">Chủ tài khoản:</span>
                  <span className="font-bold text-slate-900 uppercase">
                    {bankInfo.accountName}
                  </span>
                </div>

                {/* Số tiền */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <span className="text-slate-500 font-medium">Số tiền:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-orange-600 text-base">
                      {(bankInfo.amount || 10000).toLocaleString('vi-VN')} VNĐ
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard((bankInfo.amount || 10000).toString(), 'amount')
                      }
                      className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                      title="Sao chép số tiền"
                    >
                      {copiedField === 'amount' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Nội dung chuyển khoản (Bắt buộc) */}
                <div className="pt-0.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-orange-700 font-bold block">Nội dung chuyển khoản:</span>
                      <span className="text-[10px] text-slate-400 block">
                        (Bắt buộc để hệ thống nhận diện)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-orange-700 bg-orange-100/80 px-2.5 py-1 rounded-lg border border-orange-300 text-sm">
                        {payCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(payCode, 'payCode')}
                        className="p-1.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors shadow-xs cursor-pointer"
                        title="Sao chép mã chuyển khoản"
                      >
                        {copiedField === 'payCode' ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>
                      Mã phiên thanh toán ngẫu nhiên duy nhất{' '}
                      {sessionOrderCode ? `(#${sessionOrderCode})` : ''} - Tự động đối soát và chống trùng lặp đơn hàng 100%!
                    </span>
                  </div>
                </div>
              </div>

              {/* Nút Tra soát & Kích hoạt ngay khi đã chuyển khoản MBBank */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Bạn vừa chuyển khoản qua MBBank?
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-tight">
                  Nếu tiền đã trừ khỏi tài khoản MBBank, bấm nút bên dưới để máy chủ đối soát CSDL và kích hoạt License Active ngay:
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/license/manual-reconcile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email: license.email,
                          amount: bankInfo.amount || 10000,
                          payCode: payCode,
                        }),
                      });
                      if (res.ok) {
                        onRefresh();
                        onClose();
                      }
                    } catch (e) {
                      console.warn(e);
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-4 h-4" />
                  <span>Xác nhận đã chuyển khoản MBBank (Kích hoạt ngay)</span>
                </button>
              </div>

              {/* Nút giả lập Webhook PayOS để test nhanh */}
              {onSimulatePayOS && (
                <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Kiểm thử kích hoạt tự động (PayOS):
                    </span>
                    {onOpenPayOSWebhook && (
                      <button
                        type="button"
                        onClick={onOpenPayOSWebhook}
                        className="text-[11px] font-bold text-orange-700 hover:text-orange-900 underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Cài đặt Webhook &rarr;</span>
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onSimulatePayOS}
                    disabled={isSimulatingPayOS}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>
                      {isSimulatingPayOS
                        ? 'Đang gửi Webhook tới Backend...'
                        : '⚡ Mô phỏng chuyển khoản thành công (PayOS Webhook)'}
                    </span>
                  </button>
                </div>
              )}

              {/* Trạng thái lắng nghe tự động */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Đang tự động lắng nghe giao dịch...</span>
                </div>
                <button
                  type="button"
                  onClick={onRefresh}
                  className="font-bold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Kiểm tra ngay</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Giao dịch an toàn mã hóa 256-bit</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};
