/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Building2, CreditCard, User, DollarSign, Check, Code2, ExternalLink } from 'lucide-react';
import { BankInfo } from '../types';
import { POPULAR_BANKS } from '../config/paymentConfig';

interface BankConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankInfo: BankInfo;
  onSave: (info: BankInfo) => void;
  apiEndpoint: string;
  onSaveApiEndpoint: (url: string) => void;
}

export const BankConfigModal: React.FC<BankConfigModalProps> = ({
  isOpen,
  onClose,
  bankInfo,
  onSave,
  apiEndpoint,
  onSaveApiEndpoint,
}) => {
  const [formData, setFormData] = useState<BankInfo>(bankInfo);
  const [apiUrl, setApiUrl] = useState<string>(apiEndpoint);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onSaveApiEndpoint(apiUrl);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-600" />
              Cấu hình Ngân hàng & Backend API
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Thiết lập thông tin tài khoản nhận tiền cho mã VietQR và địa chỉ API Backend
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Note hướng dẫn mã nguồn */}
          <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200/80 text-xs text-orange-950 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-orange-800 text-sm">
              <Code2 className="w-4 h-4 text-orange-600" />
              Vị trí điền Mã Ngân Hàng & Số Tài Khoản trong mã nguồn:
            </div>
            <p className="leading-relaxed">
              Bạn có thể sửa trực tiếp trong file:
              <code className="mx-1 px-1.5 py-0.5 rounded bg-orange-100/80 font-mono text-[11px] font-semibold text-orange-900">
                src/config/paymentConfig.ts
              </code>
              tại object <code className="font-mono font-semibold">VIETQR_CONFIG</code>.
            </p>
          </div>

          {/* Chọn ngân hàng */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mã Ngân hàng (Bank ID)
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <select
                value={formData.bankId}
                onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
              >
                {POPULAR_BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Hoặc tự gõ mã (vd: MB, VCB...)"
                value={formData.bankId}
                onChange={(e) => setFormData({ ...formData, bankId: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Số tài khoản */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Số tài khoản ngân hàng thực tế
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={formData.accountNo}
                onChange={(e) => setFormData({ ...formData, accountNo: e.target.value })}
                placeholder="Ví dụ: 0388888888"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Tên chủ tài khoản */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên chủ tài khoản (Viết HOA không dấu)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value.toUpperCase() })}
                placeholder="Ví dụ: NGUYEN VAN A"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Số tiền thanh toán */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Số tiền thanh toán (VNĐ)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="number"
                min="1000"
                step="1000"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Đề bài yêu cầu cố định 10.000 VNĐ cho sinh viên gia hạn</p>
          </div>

          {/* Backend API Endpoint */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Địa chỉ Backend API (Yêu cầu 2)
            </label>
            <input
              type="text"
              required
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8080/api/v1/license"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Hệ thống sẽ gọi <code className="font-mono text-slate-700 font-semibold">{apiUrl}?email=...</code> khi sinh viên đăng nhập.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm transition-colors"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" /> Đã lưu thành công
                </>
              ) : (
                'Lưu cấu hình'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
