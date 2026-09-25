/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Zap,
  Radio,
  ShieldCheck,
  Clock,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Activity,
  Code2,
  Key,
  Lock,
  Layers,
  Building2,
  Save,
} from 'lucide-react';

interface PayOSWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
  currentPayCode?: string;
  onWebhookSuccess?: () => void;
}

export const PayOSWebhookModal: React.FC<PayOSWebhookModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail = 'buidangkhoi28@gmail.com',
  currentPayCode = 'GH1000',
  onWebhookSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'keys' | 'test'>('info');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulateAmount, setSimulateAmount] = useState<number>(10000);
  const [simulateResult, setSimulateResult] = useState<string | null>(null);

  // Cấu hình PayOS Keys
  const [clientId, setClientId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [checksumKey, setChecksumKey] = useState('');
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [saveKeysSuccess, setSaveKeysSuccess] = useState(false);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
  const webhookUrl = `${originUrl}/api/payos/webhook`;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const fetchPayOSConfig = async () => {
    try {
      const res = await fetch('/api/payos/config');
      if (res.ok) {
        const data = await res.json();
        if (data.clientId) setClientId(data.clientId);
      }
    } catch (e) {
      console.warn('Lỗi lấy config PayOS:', e);
    }
  };

  const fetchTransactions = async () => {
    setIsLoadingTx(true);
    try {
      const res = await fetch('/api/payos/transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.warn('Lỗi lấy log giao dịch:', e);
    } finally {
      setIsLoadingTx(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPayOSConfig();
      fetchTransactions();
    }
  }, [isOpen]);

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingKeys(true);
    try {
      const res = await fetch('/api/payos/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          apiKey,
          checksumKey,
          webhookUrl,
        }),
      });

      if (res.ok) {
        setSaveKeysSuccess(true);
        setTimeout(() => setSaveKeysSuccess(false), 2500);
      }
    } catch (err: any) {
      console.error('Lỗi lưu keys:', err);
    } finally {
      setIsSavingKeys(false);
    }
  };

  const handleSimulateWebhook = async () => {
    setIsSimulating(true);
    setSimulateResult(null);
    try {
      const res = await fetch('/api/payos/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUserEmail,
          amount: simulateAmount,
          payCode: currentPayCode,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSimulateResult(
          `✅ Kích hoạt thành công! Đã chuyển ${data.license?.email} sang trạng thái ACTIVE (+${
            simulateAmount >= 80000 ? '365' : '30'
          } ngày).`
        );
        fetchTransactions();
        if (onWebhookSuccess) {
          onWebhookSuccess();
        }
      } else {
        setSimulateResult(`❌ Lỗi: ${data.error || 'Không thể mô phỏng'}`);
      }
    } catch (err: any) {
      setSimulateResult(`❌ Lỗi kết nối: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200/90 z-10 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header với thương hiệu FPT LMS SUPPORT */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-orange-50 via-amber-50 to-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-600/20 font-black text-sm">
              FPT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Kênh Thanh Toán: FPT LMS SUPPORT
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Đang hoạt động
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tự động bắt chuyển khoản MBBank 0825 5664 55 & Cấp License Active
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thanh chuyển Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'info'
                ? 'border-orange-600 text-orange-700 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>1. Kết nối Webhook URL</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('keys')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'keys'
                ? 'border-orange-600 text-orange-700 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>2. Cấu hình Khóa PayOS (Keys)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('test')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'test'
                ? 'border-orange-600 text-orange-700 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>3. Kiểm thử & Log Giao Dịch ({transactions.length})</span>
          </button>
        </div>

        {/* Thân Modal */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 flex-1">
          {/* TAB 1: KẾT NỐI WEBHOOK URL */}
          {activeTab === 'info' && (
            <div className="space-y-5">
              {/* Thẻ Ngân hàng MB & VietQR Pro matching với Dashboard PayOS */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white border border-blue-200 flex items-center justify-center p-2 shadow-xs">
                    <span className="font-black text-rose-600 text-sm">MB</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">NGÂN HÀNG QUÂN ĐỘI (MB)</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                        Đã liên kết
                      </span>
                    </div>
                    <div className="text-slate-600 mt-0.5">
                      Chủ tài khoản: <strong>BUI DANG KHOI</strong> • STK: <strong className="font-mono text-blue-900">0825 5664 55</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-800 shadow-2xs">
                    VIETQR PRO
                  </span>
                </div>
              </div>

              {/* Webhook URL Endpoint */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Server className="w-4 h-4 text-orange-600" />
                    Đường Link Webhook URL Của Bạn:
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Endpoint Sẵn Sàng (HTTP 200)
                  </span>
                </div>

                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Sao chép đường link này và dán vào ô <strong>"Webhook url"</strong> trên kênh <strong>FPT LMS SUPPORT</strong> tại trang PayOS của bạn:
                </p>

                <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-orange-200 shadow-xs">
                  <code className="flex-1 font-mono text-xs text-orange-950 font-bold truncate select-all">
                    {webhookUrl}
                  </code>
                  <button
                    type="button"
                    onClick={copyWebhookUrl}
                    className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95 flex-shrink-0"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 4 Bước hoạt động tự động */}
              <div className="space-y-3">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                  Cơ chế hoạt động khi sinh viên thanh toán:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-xs">
                    <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center">
                      1
                    </span>
                    <span className="font-bold text-slate-900 block text-xs">Quét VietQR</span>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Sinh viên quét mã QR MBBank kèm mã riêng <code className="font-bold text-orange-600">{currentPayCode}</code>.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-xs">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                      2
                    </span>
                    <span className="font-bold text-slate-900 block text-xs">MBBank Báo Tiền Vào</span>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      MBBank 0825566455 nhận biến động số dư qua VietQR Pro.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-xs">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center">
                      3
                    </span>
                    <span className="font-bold text-slate-900 block text-xs">PayOS Bắn Webhook</span>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      PayOS gọi POST Webhook URL chứa thông tin giao dịch.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-xs">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center">
                      4
                    </span>
                    <span className="font-bold text-slate-900 block text-xs">Cấp License Active</span>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Hệ thống tự động kích hoạt <strong>Active (+30/365 ngày)</strong> tức thì sau 1-2s!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CẤU HÌNH KHÓA PAYOS (KEYS) */}
          {activeTab === 'keys' && (
            <form onSubmit={handleSaveKeys} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs leading-relaxed">
                <strong>Lưu ý bảo mật:</strong> Các thông tin <strong>Client ID</strong>, <strong>Api Key</strong>, và <strong>Checksum Key</strong> được hiển thị trên ảnh chụp màn hình PayOS của bạn. Bạn có thể sao chép và dán vào đây để hệ thống tự động xác thực chữ ký Webhook HMAC SHA256 an toàn tuyệt đối.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Client ID
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 3e839e55-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Api Key
                </label>
                <input
                  type="password"
                  placeholder="Nhập Api Key từ PayOS"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Checksum Key
                </label>
                <input
                  type="password"
                  placeholder="Nhập Checksum Key từ PayOS để xác thực chữ ký webhook"
                  value={checksumKey}
                  onChange={(e) => setChecksumKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-slate-400">
                  Kênh: <strong>FPT LMS SUPPORT</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSavingKeys}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    {isSavingKeys ? (
                      <span>Đang lưu...</span>
                    ) : saveKeysSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Đã lưu!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 text-slate-600" />
                        <span>1. Lưu khóa</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!clientId || !apiKey || !checksumKey) {
                        alert('Vui lòng điền đủ Client ID, Api Key và Checksum Key trước khi kích hoạt tự động!');
                        return;
                      }
                      setIsSavingKeys(true);
                      try {
                        const res = await fetch('/api/payos/confirm-webhook', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ clientId, apiKey, checksumKey, webhookUrl }),
                        });
                        const data = await res.json();
                        if (res.ok) {
                          alert('🎉 Thành công! PayOS SDK đã tự động đăng ký Webhook URL lên PayOS cho kênh FPT LMS SUPPORT!');
                          setSaveKeysSuccess(true);
                        } else {
                          alert(`⚠️ Lỗi từ PayOS: ${data.error || 'Không thể đăng ký tự động'}`);
                        }
                      } catch (err: any) {
                        alert(`Lỗi kết nối: ${err.message}`);
                      } finally {
                        setIsSavingKeys(false);
                      }
                    }}
                    disabled={isSavingKeys}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-xs shadow-md shadow-orange-600/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    <span>2. ⚡ Tự động đăng ký Webhook lên PayOS</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: KIỂM THỬ WEBHOOK & LOG GIAO DỊCH */}
          {activeTab === 'test' && (
            <div className="space-y-5">
              {/* Kiểm thử trực tiếp */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                    <Activity className="w-4 h-4 text-orange-600" />
                    Bắn thử nghiệm Webhook MBBank (STK 0825566455)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Tài khoản: <strong>{currentUserEmail}</strong> (Mã: <strong>{currentPayCode}</strong>)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-amber-300">
                    <input
                      type="radio"
                      name="simulateAmount"
                      checked={simulateAmount === 10000}
                      onChange={() => setSimulateAmount(10000)}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span className="font-bold text-slate-800">10.000đ (Gói Tháng +30 ngày)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-amber-300">
                    <input
                      type="radio"
                      name="simulateAmount"
                      checked={simulateAmount === 90000}
                      onChange={() => setSimulateAmount(90000)}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span className="font-bold text-slate-800">90.000đ (Gói Năm +365 ngày)</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleSimulateWebhook}
                    disabled={isSimulating}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-xs shadow-md shadow-orange-600/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isSimulating ? 'Đang gửi...' : '⚡ Bắn Webhook Kích Hoạt Ngay'}</span>
                  </button>
                </div>

                {simulateResult && (
                  <div className="p-3 rounded-xl bg-white border border-amber-300 font-mono text-xs font-semibold text-emerald-800">
                    {simulateResult}
                  </div>
                )}
              </div>

              {/* Lịch sử giao dịch */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Lịch sử Webhook nhận từ PayOS ({transactions.length} giao dịch gần nhất):
                  </span>
                  <button
                    type="button"
                    onClick={fetchTransactions}
                    className="text-[11px] text-orange-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingTx ? 'animate-spin' : ''}`} />
                    <span>Làm mới</span>
                  </button>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                  {transactions.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      Chưa có giao dịch webhook nào được ghi nhận. Hãy thử bấm nút "Bắn Webhook Kích Hoạt Ngay" ở trên để kiểm tra!
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 max-h-48 overflow-y-auto font-mono text-[11px]">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="p-2.5 flex items-center justify-between hover:bg-slate-100 transition-colors">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{tx.orderCode}</span>
                              <span className="text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded text-[10px]">
                                +{tx.amount.toLocaleString('vi-VN')} VNĐ
                              </span>
                              <span className="text-slate-500 text-[10px]">{tx.receivedAt}</span>
                            </div>
                            <div className="text-slate-600 truncate max-w-md">
                              Nội dung: <span className="text-orange-700 font-bold">"{tx.description}"</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {tx.userEmailMatched ? `Kích hoạt: ${tx.userEmailMatched}` : tx.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Mã hóa bảo mật 256-bit chuẩn PayOS & MBBank Open Banking</span>
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
