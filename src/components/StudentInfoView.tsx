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
  Zap,
  GraduationCap,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { UserProfile, LicenseResponse, LicenseStatus } from '../types';

interface StudentInfoViewProps {
  user: UserProfile;
  license: LicenseResponse;
  isLoading: boolean;
  onRefresh: () => void;
  onUpgradeClick: () => void;
  onManualStatusChange?: (status: LicenseStatus, days: number) => void;
}

export const StudentInfoView: React.FC<StudentInfoViewProps> = ({
  user,
  license,
  isLoading,
  onRefresh,
  onUpgradeClick,
  onManualStatusChange,
}) => {
  const getStatusBadge = (status: LicenseStatus) => {
    switch (status) {
      case 'Active':
        return {
          label: 'Đang hoạt động (Active)',
          badgeClass:
            'bg-emerald-50 text-emerald-700 border-emerald-200 ring-4 ring-emerald-500/10',
          dotClass: 'bg-emerald-500 animate-pulse',
          icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
          desc: 'Bản quyền sinh viên đã kích hoạt đầy đủ tính năng.',
          textColor: 'text-emerald-700',
          cardBorder: 'border-emerald-200',
          bgGradient: 'from-emerald-500/10 via-emerald-50/50 to-teal-50/30',
        };
      case 'Trial':
        return {
          label: 'Dùng thử (Trial)',
          badgeClass:
            'bg-amber-50 text-amber-700 border-amber-200 ring-4 ring-amber-500/10',
          dotClass: 'bg-amber-500 animate-pulse',
          icon: <Clock className="w-5 h-5 text-amber-600" />,
          desc: 'Tài khoản đang trong chu kỳ dùng thử 7 ngày miễn phí.',
          textColor: 'text-amber-700',
          cardBorder: 'border-amber-200',
          bgGradient: 'from-amber-500/10 via-amber-50/50 to-orange-50/30',
        };
      case 'Expired':
      default:
        return {
          label: 'Đã hết hạn (Expired)',
          badgeClass:
            'bg-rose-50 text-rose-700 border-rose-200 ring-4 ring-rose-500/10',
          dotClass: 'bg-rose-500',
          icon: <XCircle className="w-5 h-5 text-rose-600" />,
          desc: 'Giấy phép đã hết hạn. Hãy nâng cấp hoặc chuyển khoản gia hạn để tiếp tục sử dụng.',
          textColor: 'text-rose-700',
          cardBorder: 'border-rose-200',
          bgGradient: 'from-rose-500/10 via-rose-50/50 to-orange-50/30',
        };
    }
  };

  const statusConfig = getStatusBadge(license.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Tiêu đề trang */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Thông tin sinh viên & Giấy phép
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý tài khoản xác thực Google FPT và trạng thái kích hoạt dịch vụ LMS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-orange-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Đang đồng bộ...' : 'Đồng bộ Backend'}</span>
          </button>

          <button
            type="button"
            onClick={onUpgradeClick}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-all cursor-pointer active:scale-95"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Nâng cấp / Gia hạn</span>
          </button>
        </div>
      </div>

      {/* Grid 2 khối lớn: Thẻ Sinh viên & Thẻ Bản quyền */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Khối 1: Thông tin tài khoản sinh viên FPT (5 cột) */}
        <div className="md:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Hồ sơ Google FPT
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Đã xác thực
              </span>
            </div>

            {/* Avatar & Thông tin */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={
                    user.picture ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`
                  }
                  alt={user.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-200 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white">
                  <CheckCircle className="w-3 h-3" />
                </span>
              </div>
              <div className="overflow-hidden">
                <h3 className="text-base font-bold text-slate-900 truncate">{user.name}</h3>
                <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5 font-mono">
                  <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </p>
                {user.hd && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-800 border border-orange-200">
                    Trường: {user.hd}
                  </span>
                )}
              </div>
            </div>

            {/* Thông số tài khoản */}
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Loại tài khoản:</span>
                <span className="font-bold text-slate-800">Sinh viên Đại học FPT</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Gói đăng ký:</span>
                <span className="font-bold text-orange-700">
                  {license.planName || 'FPT LMS Support'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Mã thanh toán (payCode):</span>
                <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {license.payCode}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center">
            Đồng bộ lần cuối: {license.updatedAt || 'Vừa xong'}
          </div>
        </div>

        {/* Khối 2: Chi tiết Giấy phép & Trạng thái hoạt động (7 cột) */}
        <div className="md:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Chi tiết giấy phép (License)
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.badgeClass}`}
              >
                <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
                {statusConfig.label}
              </span>
            </div>

            {/* Banner trạng thái lớn */}
            <div
              className={`p-5 rounded-2xl bg-gradient-to-br ${statusConfig.bgGradient} border ${statusConfig.cardBorder} space-y-3`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500 block">
                    Thời hạn bản quyền còn lại:
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-3xl sm:text-4xl font-black ${statusConfig.textColor}`}>
                      {license.daysRemaining}
                    </span>
                    <span className="text-sm font-bold text-slate-600">ngày</span>
                  </div>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-white/90 border border-slate-200/60 shadow-sm flex items-center justify-center">
                  {statusConfig.icon}
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed border-t border-slate-200/50 pt-2.5">
                {statusConfig.desc}
              </p>
            </div>

            {/* Danh sách đặc quyền bản quyền */}
            <div className="space-y-2.5 pt-1">
              <span className="text-xs font-bold text-slate-600 block">
                Đặc quyền của sinh viên FPT:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <Sparkles className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                  <span>Hỗ trợ giải bài tập LMS FPT</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <Clock className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                  <span>Tự động điểm danh & nhắc lịch</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                  <span>Kích hoạt tự động qua VietQR</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <Zap className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                  <span>Hỗ trợ kỹ thuật 24/7 qua Zalo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={onUpgradeClick}
              className="w-full flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Nâng cấp hoặc Gia hạn bản quyền ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bộ điều khiển kiểm thử trạng thái dành cho Demo */}
      {onManualStatusChange && (
        <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200 text-slate-600 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-500">
              Công cụ kiểm thử trạng thái (Demo / Test mode):
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onManualStatusChange('Trial', 7)}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                license.status === 'Trial'
                  ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50'
              }`}
            >
              Trial (7 ngày dùng thử)
            </button>
            <button
              type="button"
              onClick={() => onManualStatusChange('Active', 30)}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                license.status === 'Active'
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-emerald-50'
              }`}
            >
              Active (30 ngày hoạt động)
            </button>
            <button
              type="button"
              onClick={() => onManualStatusChange('Expired', 0)}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                license.status === 'Expired'
                  ? 'bg-rose-100 border-rose-400 text-rose-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-rose-50'
              }`}
            >
              Expired (Đã hết hạn)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
