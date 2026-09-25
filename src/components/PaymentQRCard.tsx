/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
} from 'lucide-react';
import { BankInfo, LicenseResponse, LicenseStatus } from '../types';
import { buildVietQRUrl, POPULAR_BANKS } from '../config/paymentConfig';

interface PaymentQRCardProps {
  license: LicenseResponse;
  bankInfo: BankInfo;
  onOpenConfig: () => void;
  onRefresh: () => void;
  onSimulatePayOS?: () => void;
  isSimulatingPayOS?: boolean;
  isPolling?: boolean;
  selectedPlanTitle?: string;
  onChangePlan?: () => void;
}

export const PaymentQRCard: React.FC<PaymentQRCardProps> = ({
  license,
  bankInfo,
  onOpenConfig,
  onRefresh,
  onSimulatePayOS,
  isSimulatingPayOS = false,
  isPolling = false,
  selectedPlanTitle,
  onChangePlan,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [showQrPreview, setShowQrPreview] = useState(false);

  // =================================================================================================
  // ⭐️⭐️⭐️ YÊU CẦU 3: TẠO MÃ VIETQR ĐỘNG ⭐️⭐️⭐️
  //
  // 1. Lấy payCode từ cục JSON do API backend trả về: license.payCode (Ví dụ: "GH1000")
  // 2. Cập nhật thuộc tính src của thẻ <img> bằng URL chuẩn:
  //    https://img.vietqr.io/image/<MÃ_NGÂN_HÀNG>-<SỐ_TÀI_KHOẢN>-compact2.png?amount=10000&addInfo={payCode}&accountName=<TÊN_CHỦ_TÀI_KHOẢN>
  //
  // 👉 NƠI BẠN ĐIỀN THÔNG TIN THỰC TẾ:
  //    - Mã ngân hàng: bankInfo.bankId (mặc định lấy từ VIETQR_CONFIG.BANK_ID trong paymentConfig.ts)
  //    - Số tài khoản: bankInfo.accountNo (mặc định lấy từ VIETQR_CONFIG.ACCOUNT_NO)
  //    - Tên chủ tài khoản: bankInfo.accountName (mặc định lấy từ VIETQR_CONFIG.ACCOUNT_NAME)
  // =================================================================================================
  const payCode = license.payCode || 'GH1000';
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

  /**
   * Trường hợp 1: Trạng thái là "Active"
   * Hiển thị giao diện kích hoạt thành công, dịch vụ đang hoạt động tốt.
   */
  if (license.status === 'Active') {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow p-6 sm:p-7 flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Trạng thái thanh toán & Dịch vụ
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đã thanh toán
            </span>
          </div>

          {/* Active Banner */}
          <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-50 to-teal-50/40 border border-emerald-200 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <div>
              <h4 className="text-xl font-black text-emerald-950">
                Bản quyền đang hoạt động hoàn hảo!
              </h4>
              <p className="text-xs sm:text-sm text-emerald-800 mt-1 max-w-md mx-auto">
                Tài khoản sinh viên FPT của bạn hiện có đầy đủ quyền truy cập các công cụ lập trình, tài nguyên môn học và server trường.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left pt-2 max-w-sm mx-auto">
              <div className="p-3 bg-white/80 rounded-xl border border-emerald-100 shadow-xs">
                <span className="text-[11px] text-slate-500 block">Thời hạn còn lại</span>
                <span className="text-base font-black text-emerald-700">{license.daysRemaining} ngày</span>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-emerald-100 shadow-xs">
                <span className="text-[11px] text-slate-500 block">Mã gói</span>
                <span className="text-base font-bold text-slate-800 font-mono">{license.payCode}</span>
              </div>
            </div>
          </div>

          {/* Danh sách đặc quyền */}
          <div className="mt-6 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Đặc quyền gói sinh viên:
            </h5>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Không giới hạn số lượt request API bài tập lớn & đồ án tốt nghiệp</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Quyền truy cập phòng Lab FPT Edu và môi trường Cloud Dedicated</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Ưu tiên băng thông mạng nội bộ trường học</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nút gia hạn trước hạn */}
        <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500">Bạn muốn gia hạn thêm hoặc nâng cấp gói năm?</span>
          {onChangePlan && (
            <button
              onClick={onChangePlan}
              className="px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Nâng cấp / Đổi gói cước &rarr;
            </button>
          )}
        </div>
      </div>
    );
  }

  /**
   * Trường hợp 2: Trạng thái là "Trial" hoặc "Expired"
   * Theo Yêu cầu 2 & 3: Hiển thị ảnh Mã QR thanh toán VietQR động
   */
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow p-6 sm:p-7 flex flex-col justify-between h-full">
      <div>
        {/* Header Cột phải */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                license.status === 'Trial' ? 'bg-amber-500' : 'bg-rose-500'
              }`}
            />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Thanh toán & Kích hoạt bản quyền
            </h3>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              license.status === 'Trial'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {license.status === 'Trial' ? 'Cần gia hạn trước khi hết hạn' : 'Đã hết hạn - Cần thanh toán'}
          </span>
        </div>

        {/* Banner gói dịch vụ đã chọn & Nút đổi gói cước */}
        <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-orange-950 font-bold">
                {selectedPlanTitle || (bankInfo.amount === 90000 ? 'Gói Năm (365 ngày)' : 'Gói Tháng (30 ngày)')}
              </div>
              <div className="text-[11px] text-orange-800">
                Số tiền thanh toán: <strong className="font-mono text-orange-950 font-black">{(bankInfo.amount || 10000).toLocaleString('vi-VN')} VNĐ</strong>
              </div>
            </div>
          </div>
          {onChangePlan && (
            <button
              type="button"
              onClick={onChangePlan}
              className="text-xs font-bold text-orange-700 hover:text-orange-900 bg-white hover:bg-orange-100 px-3 py-1.5 rounded-xl border border-orange-300 shadow-xs transition-colors flex items-center gap-1 cursor-pointer flex-shrink-0"
            >
              <span>← Đổi gói cước khác</span>
            </button>
          )}
        </div>

        {/* Nội dung thanh toán 2 khối: Ảnh VietQR & Thông tin chuyển khoản */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* ========================================================================= */}
          {/* Thẻ <img> hiển thị mã VietQR động */}
          {/* ========================================================================= */}
          <div className="md:col-span-6 flex flex-col items-center">
            <div className="relative group p-3.5 bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl border-2 border-slate-200/80 shadow-md">
              {/* Badge góc mã QR */}
              <div className="absolute top-2 right-2 z-10 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                VietQR 24/7
              </div>

              {/* Thẻ IMG hiển thị mã VietQR động theo Yêu cầu 3 */}
              <div className="relative w-56 h-auto aspect-square bg-white rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
                {!qrLoaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-2 p-4 text-center">
                    <QrCode className="w-8 h-8 animate-pulse text-orange-500" />
                    <span className="text-xs font-medium">Đang tạo mã VietQR động...</span>
                  </div>
                )}
                <img
                  src={vietQrImageUrl}
                  alt={`Mã VietQR thanh toán bản quyền FPT ${payCode}`}
                  onLoad={() => setQrLoaded(true)}
                  className={`w-full h-auto object-contain transition-opacity duration-300 ${
                    qrLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </div>

              {/* Sub-label dưới QR */}
              <div className="mt-2 text-center">
                <span className="text-[11px] font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {payCode}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Quét bằng App mọi ngân hàng tại Việt Nam
                </span>
              </div>
            </div>

            {/* Các nút tải / mở link VietQR */}
            <div className="mt-3 flex items-center gap-2 w-full justify-center">
              <a
                href={vietQrImageUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                title="Mở ảnh QR gốc trong tab mới"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Xem ảnh lớn</span>
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard(vietQrImageUrl, 'qrUrl')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                title="Sao chép đường link ảnh VietQR"
              >
                {copiedField === 'qrUrl' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Đã chép link</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Chép URL QR</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Chi tiết chuyển khoản & Cú pháp */}
          <div className="md:col-span-6 space-y-3">
            {/* Box số tiền */}
            <div className="p-3.5 rounded-2xl bg-orange-50/80 border border-orange-200/90">
              <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider block">
                Số tiền thanh toán
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black text-orange-600">
                  {(bankInfo.amount || 10000).toLocaleString('vi-VN')}
                </span>
                <span className="text-xs font-bold text-orange-700">VNĐ</span>
                <span className="text-[11px] text-orange-600/80 ml-auto font-medium">/ 30 ngày</span>
              </div>
            </div>

            {/* Chi tiết tài khoản ngân hàng */}
            <div className="space-y-2 text-xs">
              {/* Ngân hàng */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Ngân hàng / Ví nhận
                  </span>
                  <span className="font-bold text-slate-800">
                    {POPULAR_BANKS.find((b) => b.code.toUpperCase() === bankInfo.bankId.toUpperCase())?.name || bankInfo.bankId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenConfig}
                  className="text-[11px] text-orange-600 hover:underline font-semibold"
                >
                  Đổi tài khoản
                </button>
              </div>

              {/* Số tài khoản với nút Copy */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Số tài khoản
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {bankInfo.accountNo}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(bankInfo.accountNo, 'accountNo')}
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                  title="Sao chép số tài khoản"
                >
                  {copiedField === 'accountNo' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Tên chủ tài khoản */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Chủ tài khoản
                </span>
                <span className="font-bold text-slate-800 uppercase">
                  {bankInfo.accountName}
                </span>
              </div>

              {/* NỘI DUNG CHUYỂN KHOẢN (Quan trọng nhất: payCode) */}
              <div className="p-3 rounded-xl bg-amber-50/90 border-2 border-amber-300/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-800 font-bold uppercase block">
                    Nội dung chuyển khoản (bắt buộc)
                  </span>
                  <span className="font-mono font-black text-amber-950 text-base tracking-wider">
                    {payCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(payCode, 'payCode')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  {copiedField === 'payCode' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Khối Trạng thái Lắng nghe PayOS & Mô phỏng Test */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/60 border border-blue-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
              </span>
              <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-blue-600" />
                PayOS Webhook Listener
              </span>
            </div>
            <span className="text-[11px] font-medium text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full border border-blue-200">
              Tự động kiểm tra (mỗi 4s)
            </span>
          </div>

          <p className="text-xs text-blue-800 leading-relaxed">
            Khi sinh viên chuyển khoản quét mã VietQR mang nội dung <strong className="font-mono text-blue-900 bg-white px-1.5 py-0.5 rounded border border-blue-200">{payCode}</strong>, PayOS sẽ gửi Webhook tới Backend. Hệ thống tự động bóc tách mã và mở bản quyền <strong>Active (+30 ngày)</strong> ngay lập tức mà không cần F5!
          </p>

          {/* Nút mô phỏng PayOS Webhook */}
          {onSimulatePayOS && (
            <div className="pt-2 border-t border-blue-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="text-[11px] text-blue-700">
                💡 Thử nghiệm nhanh mà không cần chuyển tiền thật:
              </div>
              <button
                type="button"
                onClick={onSimulatePayOS}
                disabled={isSimulatingPayOS}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-sm shadow-blue-600/20 disabled:opacity-60 cursor-pointer"
              >
                {isSimulatingPayOS ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang gửi Webhook PayOS...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Mô phỏng PayOS Webhook (Mở License)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Hướng dẫn từng bước */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2.5">
            <Smartphone className="w-4 h-4 text-orange-600" />
            3 bước thanh toán kích hoạt tự động qua PayOS:
          </h5>
          <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside pl-1 leading-relaxed">
            <li>Mở ứng dụng ngân hàng hoặc MoMo trên điện thoại</li>
            <li>
              Chọn <strong>Quét mã QR</strong> và quét mã VietQR ở trên (Hệ thống tự điền số tiền 10.000đ và nội dung{' '}
              <strong className="font-mono text-orange-600">{payCode}</strong>)
            </li>
            <li>
              Xác nhận chuyển khoản. PayOS sẽ tự động gửi Webhook và kích hoạt bản quyền <strong>Active</strong> ngay lập tức!
            </li>
          </ol>
        </div>
      </div>

      {/* Footer lưu ý */}
      <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          PayOS Webhook Endpoint: /api/v1/webhook/payos
        </span>
        <button
          onClick={onRefresh}
          className="text-orange-600 hover:text-orange-700 font-semibold"
        >
          Kiểm tra ngay →
        </button>
      </div>
    </div>
  );
};
