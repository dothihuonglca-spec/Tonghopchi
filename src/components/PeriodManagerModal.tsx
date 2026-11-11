/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { D11aRow } from '../types/index.ts';
import { formatCurrency } from '../utils/excelExport.ts';
import { 
  Calendar, 
  X, 
  Trash2, 
  Eye, 
  Layers, 
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

interface PeriodGroup {
  month: number;
  year: number;
  quarter: number;
  title: string;
  d11aCount: number;
  d11aHtCount: number;
  totalCount: number;
  totalRevenue: number;
  totalCommission: number;
}

interface PeriodManagerModalProps {
  isOpen: boolean;
  records: D11aRow[];
  activePeriodTitle: string;
  onClose: () => void;
  onSelectPeriod: (month: number, year: number) => void;
  onDeletePeriod: (month: number, year: number) => void;
}

export const PeriodManagerModal: React.FC<PeriodManagerModalProps> = ({
  isOpen,
  records,
  activePeriodTitle,
  onClose,
  onSelectPeriod,
  onDeletePeriod
}) => {
  if (!isOpen) return null;

  // Group records by Month & Year
  const periodGroups: PeriodGroup[] = React.useMemo(() => {
    const map = new Map<string, PeriodGroup>();

    records.forEach(r => {
      const key = `${r.month}_${r.year}`;
      let g = map.get(key);
      if (!g) {
        g = {
          month: r.month,
          year: r.year,
          quarter: r.quarter,
          title: `Tháng ${r.month < 10 ? `0${r.month}` : r.month}/${r.year}`,
          d11aCount: 0,
          d11aHtCount: 0,
          totalCount: 0,
          totalRevenue: 0,
          totalCommission: 0
        };
        map.set(key, g);
      }

      g.totalCount++;
      g.totalRevenue += r.totalRevenue;
      g.totalCommission += r.totalCommission;

      if (r.source === 'D11A') g.d11aCount++;
      else g.d11aHtCount++;
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [records]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Quản Lý Dữ Liệu Các Tháng Trong Hệ Thống
              </h2>
              <p className="text-xs text-slate-500">
                Toàn bộ các tháng nạp vào đều được lưu trữ song song và độc lập trong LocalStorage
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body list */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="text-xs text-slate-600 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
            <strong>Ghi chú:</strong> Khi bạn nạp thêm Tháng 10 hoặc các tháng tiếp theo, hệ thống sẽ lưu tiếp vào cơ sở dữ liệu trình duyệt mà không làm mất các tháng trước. Bạn có thể chọn xem hoặc xóa riêng từng tháng tại đây.
          </div>

          {periodGroups.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs italic">
              Hiện chưa có dữ liệu tháng nào trong hệ thống.
            </div>
          ) : (
            <div className="space-y-3">
              {periodGroups.map(p => (
                <div
                  key={`${p.month}_${p.year}`}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slate-900">
                        {p.title}
                      </span>
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                        Quý {p.quarter}/{p.year}
                      </span>
                      <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {p.totalCount} biên lai
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-2xs text-slate-500">
                      <span>Sheet D11A: <strong>{p.d11aCount}</strong> dòng</span>
                      <span>•</span>
                      <span>Sheet D11A_HT: <strong>{p.d11aHtCount}</strong> dòng</span>
                    </div>

                    <div className="flex items-center space-x-4 text-xs font-mono pt-1">
                      <span className="text-slate-600">
                        Thu: <strong>{formatCurrency(p.totalRevenue)}</strong> đ
                      </span>
                      <span className="text-blue-700 font-bold">
                        Thù lao: <strong>{formatCurrency(p.totalCommission)}</strong> đ
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <button
                      onClick={() => {
                        onSelectPeriod(p.month, p.year);
                        onClose();
                      }}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem tháng này</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Bạn có chắc chắn muốn xóa toàn bộ dữ liệu của ${p.title} (${p.totalCount} biên lai) không? Dữ liệu các tháng khác sẽ được giữ nguyên.`)) {
                          onDeletePeriod(p.month, p.year);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title={`Xóa dữ liệu ${p.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Tổng số {periodGroups.length} kỳ tháng đang được lưu trữ</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
