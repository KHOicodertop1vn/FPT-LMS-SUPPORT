/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Settings, LogOut, GraduationCap, RefreshCw, Code2, Zap } from 'lucide-react';
import { UserProfile, LicenseStatus } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  status?: LicenseStatus;
  backendUrl?: string;
  onLogout: () => void;
  onOpenConfig: () => void;
  onOpenBackendCode: () => void;
  onOpenPayOSWebhook?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  status,
  backendUrl,
  onLogout,
  onOpenConfig,
  onOpenBackendCode,
  onOpenPayOSWebhook,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                FPT <span className="text-orange-600">License Portal</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                Edu Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Hệ thống xác thực bản quyền & thanh toán VietQR
            </p>
          </div>
        </div>

        {/* Right action items */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Badge trạng thái Backend URL */}
          <button
            onClick={onOpenConfig}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded-lg border transition-all ${
              backendUrl?.includes('8080')
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Nhấn để đổi địa chỉ Backend API"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendUrl?.includes('8080') ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            ></span>
            <span>{backendUrl?.includes('8080') ? 'Spring Boot :8080' : 'Cloud Server'}</span>
          </button>

          {/* Nút cài đặt Webhook PayOS (MBBank) */}
          {onOpenPayOSWebhook && (
            <button
              onClick={onOpenPayOSWebhook}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 transition-colors shadow-xs cursor-pointer"
              title="Cài đặt và kiểm tra bắt chuyển khoản Webhook PayOS MBBank"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Webhook MBBank</span>
              <span className="sm:hidden">PayOS</span>
            </button>
          )}

          {/* Backend Spring Boot Code viewer */}
          <button
            onClick={onOpenBackendCode}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
            title="Xem toàn bộ mã nguồn Java Spring Boot 3.x & SQL Server"
          >
            <Code2 className="w-4 h-4 text-orange-600" />
            <span className="hidden sm:inline">Code Spring Boot</span>
          </button>

          {/* Quick config button */}
          <button
            onClick={onOpenConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
            title="Cấu hình tài khoản ngân hàng VietQR & API Backend"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Cấu hình Ngân hàng</span>
          </button>

          {user && (
            <>
              {/* Nút Refresh nhanh */}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
                  title="Tải lại trạng thái bản quyền"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
                  <span className="hidden md:inline">Làm mới</span>
                </button>
              )}

              {/* Thông tin user vắn tắt */}
              <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[130px]">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate max-w-[130px]">
                    {user.email}
                  </div>
                </div>
              </div>

              {/* Nút Đăng xuất */}
              <button
                onClick={onLogout}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                title="Đăng xuất khỏi hệ thống"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
