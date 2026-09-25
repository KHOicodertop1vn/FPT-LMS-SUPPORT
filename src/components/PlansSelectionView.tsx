/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sparkles,
  Zap,
  Star,
  Check,
  ShieldCheck,
  Clock,
  ArrowRight,
  Flame,
  CheckCircle2,
  Gift,
} from 'lucide-react';
import { LicenseStatus } from '../types';

export type PlanType = 'trial' | 'monthly' | 'yearly';

export interface PlanConfig {
  id: PlanType;
  name: string;
  price: number;
  periodLabel: string;
  description: string;
  subNotice?: string;
  badge?: string;
  popular?: boolean;
  featuresHeader: string;
  features: { text: string; highlight?: boolean }[];
  buttonText: string;
  days: number;
}

export const PLANS: PlanConfig[] = [
  {
    id: 'trial',
    name: 'Miễn phí (Trial)',
    price: 0,
    periodLabel: '7 ngày miễn phí',
    description: 'Dành cho sinh viên muốn trải nghiệm toàn bộ tính năng và học tập thử nghiệm',
    subNotice: 'Không cần tài khoản ngân hàng hay thẻ tín dụng',
    featuresHeader: 'BAO GỒM',
    features: [
      { text: 'Hỗ trợ giải bài tập & tự động điểm danh LMS' },
      { text: 'Tạo mã bản quyền sinh viên tự động' },
      { text: '7 ngày trải nghiệm không giới hạn' },
      { text: 'Kích hoạt ngay không cần chờ phê duyệt' },
    ],
    buttonText: 'Bắt đầu dùng thử 7 ngày',
    days: 7,
  },
  {
    id: 'monthly',
    name: 'Gói tháng',
    price: 10000,
    periodLabel: '/ tháng',
    description: 'Dành cho sinh viên có nhu cầu sử dụng định kỳ theo từng tháng học',
    subNotice: 'Chi phí chỉ bằng 1 ly trà đá (10.000 VNĐ) · Kích hoạt tức thì',
    featuresHeader: 'TOÀN BỘ GÓI MIỄN PHÍ, CỘNG THÊM',
    features: [
      { text: '30 ngày sử dụng không giới hạn', highlight: true },
      { text: 'Tự động tối ưu bài tập & nhắc lịch học LMS FPT' },
      { text: 'Kích hoạt bản quyền tức thì qua PayOS Webhook' },
      { text: 'Hỗ trợ kỹ thuật qua Zalo / Discord 24/7' },
      { text: 'Cập nhật phiên bản mới nhất suốt 30 ngày' },
    ],
    buttonText: 'Đăng ký gói tháng',
    days: 30,
  },
  {
    id: 'yearly',
    name: 'Gói năm',
    price: 90000,
    periodLabel: '/ năm',
    description: 'Quyền lợi trọn vẹn cả năm học, giá tốt nhất cho toàn bộ 3 học kỳ tại FPT',
    subNotice: '90.000đ/năm • Tiết kiệm 30.000đ (25%) so với gói tháng',
    badge: '★ Tiết kiệm nhất',
    popular: true,
    featuresHeader: 'TOÀN BỘ GÓI THÁNG, BAO GỒM',
    features: [
      { text: '365 ngày (1 năm học) sử dụng không giới hạn', highlight: true },
      { text: 'Bao trọn vẹn cả 3 kỳ học FPT (Spring, Summer, Fall)' },
      { text: 'Ưu tiên độc quyền, cập nhật tính năng mới nhất trước' },
      { text: 'Hỗ trợ riêng 1-1 khi LMS FPT cập nhật cấu trúc' },
      { text: 'Đảm bảo kết nối ổn định không gián đoạn kỳ thi' },
      { text: 'Cam kết hoàn tiền 100% nếu có sự cố hệ thống' },
    ],
    buttonText: 'Đăng ký gói năm',
    days: 365,
  },
];

interface PlansSelectionViewProps {
  currentStatus: LicenseStatus;
  selectedPlan: PlanType;
  onSelectPlan: (plan: PlanType) => void;
  onViewDashboard?: () => void;
  userEmail?: string;
}

export const PlansSelectionView: React.FC<PlansSelectionViewProps> = ({
  currentStatus,
  selectedPlan,
  onSelectPlan,
  onViewDashboard,
  userEmail,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Tiêu đề trang & Giới thiệu đồng bộ tone Cam FPT */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          <span>Bản quyền sinh viên FPT LMS Support</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
          Gói thành viên & Bản quyền
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Lựa chọn gói dịch vụ phù hợp nhất với kế hoạch học tập của bạn. Thanh toán tiện lợi qua mã{' '}
          <strong className="text-orange-600 font-bold">VietQR (MoMo & Mọi Ngân Hàng)</strong>{' '}
          và kích hoạt tự động tức thì.
        </p>
      </div>

      {/* Grid 3 thẻ gói dịch vụ (Miễn phí 0đ - Gói tháng 10.000đ - Gói năm 90.000đ) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch pt-3">
        {/* ========================================================================= */}
        {/* GÓI 1: MIỄN PHÍ / TRIAL 0 Đ (7 NGÀY) */}
        {/* ========================================================================= */}
        <div
          className={`relative bg-white rounded-3xl border transition-all duration-200 flex flex-col justify-between p-6 sm:p-7 shadow-xs hover:shadow-md ${
            selectedPlan === 'trial'
              ? 'border-emerald-400 ring-2 ring-emerald-400/20'
              : 'border-slate-200/90'
          }`}
        >
          <div className="space-y-5">
            {/* Header gói */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Miễn phí</h3>
                <p className="text-xs text-slate-500 font-medium">Bản dùng thử sinh viên</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
              Dành cho sinh viên muốn trải nghiệm học tập và tính năng cơ bản của FPT LMS Support.
            </p>

            {/* Mức giá */}
            <div className="pt-2 pb-1 border-b border-slate-100">
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-slate-500">$</span>
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  0
                </span>
                <span className="text-xs text-slate-500 font-semibold">/ 7 ngày miễn phí</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Không bao gồm dịch vụ VIP và hỗ trợ riêng 1-1</p>
            </div>

            {/* Nút hành động */}
            {currentStatus === 'Trial' ? (
              <button
                type="button"
                onClick={() => onSelectPlan('trial')}
                className="w-full py-3 px-4 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 cursor-default"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Gói hiện tại (Đang dùng)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSelectPlan('trial')}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <span>Dùng thử 7 ngày miễn phí</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Danh sách tính năng */}
            <div className="space-y-3 pt-2">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                BAO GỒM
              </div>
              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Hỗ trợ giải bài tập & tự động điểm danh LMS</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Tạo bản quyền sinh viên tự động qua Google</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>7 ngày trải nghiệm không giới hạn</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Không yêu cầu số tài khoản hay thẻ ngân hàng</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* GÓI 2: GÓI THÁNG 10.000 Đ/THÁNG (Tông Cam FPT) */}
        {/* ========================================================================= */}
        <div
          className={`relative bg-white rounded-3xl border transition-all duration-200 flex flex-col justify-between p-6 sm:p-7 shadow-xs hover:shadow-md ${
            selectedPlan === 'monthly'
              ? 'border-orange-400 ring-2 ring-orange-400/20'
              : 'border-slate-200/90'
          }`}
        >
          <div className="space-y-5">
            {/* Header gói */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 flex-shrink-0">
                <Zap className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Gói tháng</h3>
                <p className="text-xs text-orange-700 font-semibold">Linh hoạt theo tháng học</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
              Dành cho sinh viên có nhu cầu sử dụng định kỳ theo từng tháng học với chi phí tiết kiệm.
            </p>

            {/* Mức giá */}
            <div className="pt-2 pb-1 border-b border-slate-100">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  10.000
                </span>
                <span className="text-xs font-bold text-slate-600">VNĐ</span>
                <span className="text-xs text-slate-500 font-semibold">/ tháng</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Trả phí hàng tháng · Kích hoạt tức thì qua VietQR
              </p>
            </div>

            {/* Nút hành động tông cam */}
            <button
              type="button"
              onClick={() => onSelectPlan('monthly')}
              className="w-full py-3 px-4 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-800 font-bold text-xs border border-orange-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <span>Đăng ký gói tháng (10.000đ)</span>
              <ArrowRight className="w-4 h-4 text-orange-700" />
            </button>

            {/* Danh sách tính năng */}
            <div className="space-y-3 pt-2">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                TOÀN BỘ GÓI MIỄN PHÍ, CỘNG THÊM
              </div>
              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-900">30 ngày</strong> sử dụng không giới hạn
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Tự động tối ưu phụ đề & bài tập theo lịch sử LMS</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Kích hoạt bản quyền tức thì qua PayOS Webhook</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Hỗ trợ kỹ thuật qua Zalo / Discord 24/7</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Dùng cho mọi môn học và bài thi thử LMS FPT</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* GÓI 3: GÓI NĂM 90.000 Đ/NĂM (TIẾT KIỆM NHẤT - CAM / AMBER FPT NỔI BẬT) */}
        {/* ========================================================================= */}
        <div
          className={`relative bg-white rounded-3xl border-2 transition-all duration-200 flex flex-col justify-between p-6 sm:p-7 shadow-lg shadow-orange-600/10 ${
            selectedPlan === 'yearly'
              ? 'border-orange-600 ring-4 ring-orange-500/20'
              : 'border-orange-500'
          }`}
        >
          {/* Badge "Tiết kiệm nhất" tông Cam nổi trên đầu thẻ */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="px-3.5 py-1 rounded-full text-[11px] font-black tracking-wide text-white bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 shadow-md shadow-orange-600/30 flex items-center gap-1 uppercase">
              <Star className="w-3 h-3 fill-amber-200 text-amber-200" />
              <span>Tiết kiệm nhất</span>
            </span>
          </div>

          <div className="space-y-5">
            {/* Header gói */}
            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-500 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-orange-600/20">
                <Star className="w-5 h-5 fill-white text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Gói năm</h3>
                <p className="text-xs text-orange-700 font-semibold">Trọn vẹn 3 kỳ học FPT</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
              Quyền lợi như nhau, giá tốt hơn khi dùng lâu dài cho toàn bộ các học kỳ tại FPT.
            </p>

            {/* Mức giá */}
            <div className="pt-2 pb-1 border-b border-slate-100">
              <div className="flex items-baseline gap-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-orange-600 tracking-tight">
                    90.000
                  </span>
                  <span className="text-xs font-bold text-orange-900">VNĐ</span>
                  <span className="text-xs text-slate-500 font-semibold">/ năm</span>
                </div>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-600">
                  Chỉ 7.500đ / tháng
                </span>
                <span className="text-[11px] text-orange-800 font-medium bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  Tiết kiệm 30.000đ (25%)
                </span>
              </div>
            </div>

            {/* Nút hành động nổi bật Gradient Cam / Amber FPT */}
            <button
              type="button"
              onClick={() => onSelectPlan('yearly')}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-600/25 active:scale-[0.99]"
            >
              <span>Đăng ký gói năm (90.000đ)</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>

            {/* Danh sách tính năng */}
            <div className="space-y-3 pt-2">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                TOÀN BỘ GÓI THÁNG, BAO GỒM
              </div>
              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-900">365 ngày (1 năm)</strong> sử dụng không giới hạn
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Bao trọn cả 3 kỳ học: Spring, Summer và Fall</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Phụ đề & tài nguyên tối ưu độc quyền, ưu tiên cập nhật trước</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Giữ kết nối ổn định liên tục, không lo hết hạn giữa kỳ thi</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Hỗ trợ kỹ thuật 1-1 chuyên sâu qua Zalo / Discord</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Cam kết hoàn tiền 100% nếu có sự cố hệ thống</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer ghi chú bảo mật & hỗ trợ */}
      <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/60 border border-orange-200 text-slate-700 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>
            Thanh toán qua chuẩn <strong>VietQR</strong> được bảo chứng bởi các Ngân hàng Việt Nam & MoMo. 
            Xác nhận thanh toán tự động qua <strong>PayOS Webhook</strong> trong 3 - 5 giây.
          </span>
        </div>

        {onViewDashboard && (
          <button
            type="button"
            onClick={onViewDashboard}
            className="text-xs text-orange-700 hover:text-orange-800 font-bold underline whitespace-nowrap cursor-pointer"
          >
            Xem thông tin tài khoản &rarr;
          </button>
        )}
      </div>
    </div>
  );
};
