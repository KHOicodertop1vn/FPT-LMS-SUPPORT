/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
}

interface AlertToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const AlertToast: React.FC<AlertToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
          error: <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
          info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />,
        };

        const bgStyles = {
          success: 'bg-white border-emerald-200 text-slate-800 shadow-emerald-500/10',
          warning: 'bg-white border-amber-200 text-slate-800 shadow-amber-500/10',
          error: 'bg-white border-rose-200 text-slate-800 shadow-rose-500/10',
          info: 'bg-white border-blue-200 text-slate-800 shadow-blue-500/10',
        };

        const barStyles = {
          success: 'bg-emerald-500',
          warning: 'bg-amber-500',
          error: 'bg-rose-500',
          info: 'bg-blue-500',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative overflow-hidden rounded-xl border p-4 shadow-xl transition-all duration-300 animate-in slide-in-from-top-4 ${bgStyles[toast.type]}`}
          >
            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${barStyles[toast.type]}`} />
            <div className="flex items-start gap-3 pl-2">
              {icons[toast.type]}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-slate-900">{toast.title}</h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">{toast.message}</p>
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
