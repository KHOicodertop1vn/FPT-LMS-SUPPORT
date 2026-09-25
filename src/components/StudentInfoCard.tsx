/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  Clock,
  RefreshCw,
  AlertCircle,
  Calendar,
  Sparkles,
  CheckCircle,
  XCircle,
  Flame,
} from 'lucide-react';
import { UserProfile, LicenseResponse, LicenseStatus } from '../types';

interface StudentInfoCardProps {
  user: UserProfile;
  license: LicenseResponse;
  isLoading: boolean;
  onRefresh: () => void;
  onManualStatusChange?: (status: LicenseStatus, days: number) => void;
  onUpgradeClick?: () => void;
}

export const StudentInfoCard: React.FC<StudentInfoCardProps> = ({
  user,
  license,
  isLoading,
  onRefresh,
  onManualStatusChange,
  onUpgradeClick,
}) => {
  /**
   * Cấu hình hiển thị màu sắc và biểu tượng theo trạng thái bản quyền:
   * - Active: Xanh lá (Emerald / Green)
   * - Trial: Vàng / Cam (Amber / Yellow)
   * - Expired: Đỏ (Rose / Red)
   */
  const getStatusBadge = (status: LicenseStatus) => {
    switch (status) {
      case 'Active':
        return {
          label: 'Đang hoạt động (Active)',
          badgeClass:
            'bg-emerald-50 text-emerald-700 border-emerald-200 ring-4 ring-emerald-500/10',
          dotClass: 'bg-emerald-500 animate-pulse',
          icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
          desc: 'Bản quyền sinh viên đã kích hoạt đầy đủ tính năng.',
          textColor: 'text-emerald-700',
          cardBorder: 'border-emerald-200',
        };
      case 'Trial':
        return {
          label: 'Dùng thử (Trial)',
          badgeClass:
            'bg-amber-50 text-amber-700 border-amber-200 ring-4 ring-amber-500/10',
          dotClass: 'bg-amber-500 animate-pulse',
          icon: <Clock className="w-4 h-4 text-amber-600" />,
          desc: 'Đang trong thời gian trải nghiệm miễn phí.',
          textColor: 'text-amber-700',
          cardBorder: 'border-amber-200',
        };
      case 'Expired':
        return {
          label: 'Đã hết hạn (Expired)',
          badgeClass:
            'bg-rose-50 text-rose-700 border-rose-200 ring-4 ring-rose-500/10',
          dotClass: 'bg-rose-500 animate-pulse',
          icon: <XCircle className="w-4 h-4 text-rose-600" />,
          desc: 'Thời hạn bản quyền đã kết thúc. Vui lòng gia hạn để tiếp tục.',
          textColor: 'text-rose-700',
          cardBorder: 'border-rose-200',
        };
      default:
        return {
          label: status,
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
          dotClass: 'bg-slate-400',
          icon: <AlertCircle className="w-4 h-4 text-slate-500" />,
          desc: 'Không xác định',
          textColor: 'text-slate-700',
          cardBorder: 'border-slate-200',
        };
    }
  };

  const statusConfig = getStatusBadge(license.status);

  // Trích xuất mã số sinh viên từ email nếu có (ví dụ: khoibdse180000 -> SE180000)
  const extractMssv = (email: string) => {
    const match = email.match(/([a-zA-Z]{2}\d{5,6})/i);
    return match ? match[1].toUpperCase() : null;
  };

  const mssv = extractMssv(user.email);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow p-6 sm:p-7 flex flex-col justify-between h-full">
      <div className="space-y-6">
        {/* Phần 1: Tiêu đề thẻ & Badge trạng thái */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Thông tin sinh viên & Giấy phép
            </h3>
          </div>
          {mssv && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-orange-50 text-orange-700 border border-orange-200">
              MSSV: {mssv}
            </span>
          )}
        </div>

        {/* Phần 2: Avatar, Tên và Email */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-md ring-2 ring-orange-500/20"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-md shadow-orange-500/20">
                {user.name.charAt(0)}
              </div>
            )}
            {/* Chấm tròn trạng thái nổi bật góc avatar */}
            <span className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full shadow-sm">
              <span className={`block w-3.5 h-3.5 rounded-full ${statusConfig.dotClass}`} />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                {user.name}
              </h2>
              <span title="Xác thực FPT Education">
                <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 font-mono mt-1 break-all">
              <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {user.email.endsWith('@fpt.edu.vn') ? 'FPT University' : 'Google User'}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5">
                • Đã xác thực email
              </span>
            </div>
          </div>
        </div>

        {/* Phần 3: Trạng thái & Số ngày còn lại */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {/* Box Trạng thái */}
          <div
            className={`p-4 rounded-2xl border transition-all ${statusConfig.cardBorder} bg-gradient-to-br from-white to-slate-50/50`}
          >
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Trạng thái bản quyền
            </span>
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold shadow-sm ${statusConfig.badgeClass}`}
            >
              {statusConfig.icon}
              <span>{statusConfig.label}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              {statusConfig.desc}
            </p>
          </div>

          {/* Box Số ngày còn lại */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Thời hạn còn lại
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-3xl sm:text-4xl font-black tracking-tight ${
                  license.daysRemaining > 5
                    ? 'text-slate-900'
                    : license.daysRemaining > 0
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
              >
                {license.daysRemaining}
              </span>
              <span className="text-sm font-semibold text-slate-500">ngày</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  license.status === 'Active'
                    ? 'bg-emerald-500'
                    : license.status === 'Trial'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(0, (license.daysRemaining / 30) * 100))}%`,
                }}
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
              <span>0 ngày</span>
              <span>{license.status === 'Expired' ? 'Đã hết' : 'Chu kỳ 30 ngày'}</span>
            </div>
          </div>
        </div>

        {/* Thông tin gói & Ghi chú */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              Gói dịch vụ:
            </span>
            <span className="font-bold text-slate-800">
              {license.planName || 'FPT Student Developer Pro'}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Mã giao dịch (payCode):
            </span>
            <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
              {license.payCode}
            </span>
          </div>
          {license.updatedAt && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
              <span>Đồng bộ lần cuối:</span>
              <span>{license.updatedAt}</span>
            </div>
          )}
        </div>
      </div>

      {/* Phần 4: Nút "Tải lại trạng thái" (Refresh) & Bộ chuyển đổi kiểm thử */}
      <div className="pt-6 mt-6 border-t border-slate-100 space-y-3">
        {/* Nút Xem gói đăng ký / Nâng cấp */}
        {onUpgradeClick && (
          <button
            type="button"
            onClick={onUpgradeClick}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-700 hover:to-amber-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-orange-600/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Xem bảng giá & Đăng ký gói (10k / 90k)</span>
          </button>
        )}

        {/* ========================================================================= */}
        {/* Nút "Tải lại trạng thái" (Refresh) theo Yêu cầu 4 */}
        {/* ========================================================================= */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-xs shadow-sm transition-all disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw
            className={`w-4 h-4 text-orange-400 ${isLoading ? 'animate-spin' : ''}`}
          />
          <span>{isLoading ? 'Đang kiểm tra từ Backend...' : 'Tải lại trạng thái'}</span>
        </button>
        <p className="text-[11px] text-center text-slate-400 leading-tight">
          Sau khi chuyển khoản qua mã VietQR thành công, bấm nút trên để cập nhật bản quyền ngay.
        </p>

        {/* Bảng điều khiển thử nghiệm trạng thái (để tiện cho việc demo & test giao diện) */}
        {onManualStatusChange && (
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 text-center">
              Chuyển nhanh trạng thái (Demo / Test mode):
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => onManualStatusChange('Trial', 7)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  license.status === 'Trial'
                    ? 'bg-amber-100 border-amber-400 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-amber-50'
                }`}
              >
                Trial (7 ngày)
              </button>
              <button
                type="button"
                onClick={() => onManualStatusChange('Active', 30)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  license.status === 'Active'
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-emerald-50'
                }`}
              >
                Active (30 ngày)
              </button>
              <button
                type="button"
                onClick={() => onManualStatusChange('Expired', 0)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  license.status === 'Expired'
                    ? 'bg-rose-100 border-rose-400 text-rose-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-rose-50'
                }`}
              >
                Expired (0 ngày)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
