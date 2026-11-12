/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StaffSummaryRow, PointSummaryRow } from '../types/index.ts';
import { formatCurrency } from '../utils/excelExport.ts';
import { Layers, ArrowRight, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

interface ComparisonViewProps {
  staffSummaries: StaffSummaryRow[];
  pointSummaries: PointSummaryRow[];
  totals: {
    d11aRevenue: number;
    d11aCommission: number;
    d11aHtRevenue: number;
    d11aHtCommission: number;
    d11aHtRefund: number;
    totalRevenue: number;
    totalCommission: number;
  };
  /** Tổng "Số phải chi" của Book3 (làm tròn theo từng điểm thu) — khớp file Excel. */
  book3Total: number;
  periodTitle: string;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  staffSummaries,
  pointSummaries,
  totals,
  book3Total,
  periodTitle
}) => {
  const d11aComRatio = totals.d11aRevenue > 0
    ? ((totals.d11aCommission / totals.d11aRevenue) * 100).toFixed(1)
    : '0';

  const d11aHtComRatio = totals.d11aHtRefund > 0
    ? ((totals.d11aHtCommission / totals.d11aHtRefund) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: D11A */}
        <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              Sheet D11A — trích thù lao phát sinh
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {d11aComRatio}% Thù lao
            </span>
          </div>

          <div className="space-y-2 mt-4">
            <div>
              <div className="text-3xs text-slate-500 uppercase font-medium">Doanh thu NTG đóng</div>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {formatCurrency(totals.d11aRevenue)} VNĐ
              </div>
            </div>
            <div>
              <div className="text-3xs text-slate-500 uppercase font-medium">Thù lao được chi trả</div>
              <div className="text-xl font-black text-blue-700 font-mono">
                {formatCurrency(totals.d11aCommission)} VNĐ
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: D11A_HT */}
        <div className="bg-white rounded-2xl p-5 border border-purple-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              Sheet D11A_HT — thù lao đã chi phải thu hồi
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              {d11aHtComRatio}% Thù lao
            </span>
          </div>

          <div className="space-y-2 mt-4">
            <div>
              <div className="text-3xs text-slate-500 uppercase font-medium">Số tiền hoàn trả NTG</div>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {formatCurrency(totals.d11aHtRefund)} VNĐ
              </div>
            </div>
            <div>
              <div className="text-3xs text-slate-500 uppercase font-medium">Thù lao phải thu hồi</div>
              <div className="text-xl font-black text-purple-700 font-mono">
                {formatCurrency(totals.d11aHtCommission)} VNĐ
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Combined Summary */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Tổng Hợp Gộp (D11A + D11A_HT)
            </span>
            <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
              100%
            </span>
          </div>

          <div className="space-y-2 mt-4">
            <div>
              <div className="text-3xs text-slate-400 uppercase font-medium">Tổng số thu của người tham gia</div>
              <div className="text-xl font-bold text-white font-mono">
                {formatCurrency(totals.totalRevenue)} VNĐ
              </div>
            </div>
            <div>
              <div className="text-3xs text-slate-400 uppercase font-medium">Tổng số Thù lao chi đại lý thu</div>
              <div className="text-2xl font-black text-amber-300 font-mono">
                {formatCurrency(book3Total)} VNĐ
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table by Staff */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 uppercase">
            Bảng Đối Chiếu Thù Lao Giữa D11A và D11A_HT Theo Nhân Viên
          </h3>
          <p className="text-xs text-slate-500">
            Xem cơ cấu thù lao đóng góp từ kênh thu trực tiếp (D11A) so với hệ thống hỗ trợ (D11A_HT)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-3xs uppercase tracking-wider text-center">
                <th rowSpan={2} className="px-2 py-2 border-r border-slate-300 w-10">STT</th>
                <th rowSpan={2} className="px-3 py-2 border-r border-slate-300 text-left">Nhân viên thu</th>
                <th rowSpan={2} className="px-2 py-2 border-r border-slate-300">Mã điểm</th>
                <th colSpan={2} className="px-3 py-1.5 border-r border-slate-300 bg-blue-50 text-blue-900">
                  Sheet D11A (Trực tiếp)
                </th>
                <th colSpan={2} className="px-3 py-1.5 border-r border-slate-300 bg-purple-50 text-purple-900">
                  Sheet D11A_HT (Hệ thống)
                </th>
                <th colSpan={2} className="px-3 py-1.5 bg-slate-200 text-slate-900 font-black">
                  Tổng hợp chung
                </th>
              </tr>
              <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-300 text-3xs text-center">
                <th className="px-2 py-1.5 border-r border-slate-300 bg-blue-50/50">Doanh thu</th>
                <th className="px-2 py-1.5 border-r border-slate-300 bg-blue-50/50">Thù lao</th>
                <th className="px-2 py-1.5 border-r border-slate-300 bg-purple-50/50">Doanh thu</th>
                <th className="px-2 py-1.5 border-r border-slate-300 bg-purple-50/50">Thù lao</th>
                <th className="px-2 py-1.5 border-r border-slate-300 bg-slate-200">Tổng doanh thu</th>
                <th className="px-2 py-1.5 bg-slate-200">Tổng thù lao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {staffSummaries.map((s, idx) => (
                <tr key={s.staffId} className="hover:bg-slate-50">
                  <td className="px-2 py-2 text-center border-r border-slate-200 font-mono text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2 border-r border-slate-200 font-semibold text-slate-900">
                    {s.staffName}
                  </td>
                  <td className="px-2 py-2 text-center border-r border-slate-200 font-mono text-slate-600">
                    {s.pointCode}
                  </td>
                  {/* D11A */}
                  <td className="px-2 py-2 text-right border-r border-slate-200 font-mono text-slate-700">
                    {formatCurrency(s.d11aRevenue)}
                  </td>
                  <td className="px-2 py-2 text-right border-r border-slate-200 font-mono font-bold text-blue-700 bg-blue-50/20">
                    {formatCurrency(s.d11aCommission)}
                  </td>
                  {/* D11A_HT */}
                  <td className="px-2 py-2 text-right border-r border-slate-200 font-mono text-slate-700">
                    {s.d11aHtCommission > 0 ? `−${formatCurrency(s.d11aHtCommission)}` : '-'}
                  </td>
                  <td className="px-2 py-2 text-right border-r border-slate-200 font-mono font-bold text-purple-700 bg-purple-50/20">
                    {s.d11aHtCommission > 0 ? formatCurrency(s.d11aHtCommission) : '-'}
                  </td>
                  {/* Total */}
                  <td className="px-2 py-2 text-right border-r border-slate-200 font-mono font-bold text-slate-900 bg-slate-50">
                    {formatCurrency(s.totalRevenue)}
                  </td>
                  <td className="px-2 py-2 text-right font-mono font-black text-emerald-800 bg-emerald-50/40">
                    {formatCurrency(s.totalCommission)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-200 font-black text-slate-950 border-t-2 border-slate-400 text-2xs uppercase">
                <td colSpan={3} className="px-3 py-2 text-center border-r border-slate-300">
                  Cộng tổng:
                </td>
                <td className="px-2 py-2 text-right border-r border-slate-300 font-mono">
                  {formatCurrency(totals.d11aRevenue)}
                </td>
                <td className="px-2 py-2 text-right border-r border-slate-300 font-mono text-blue-900">
                  {formatCurrency(totals.d11aCommission)}
                </td>
                <td className="px-2 py-2 text-right border-r border-slate-300 font-mono">
                  {totals.d11aHtCommission > 0 ? `−${formatCurrency(totals.d11aHtCommission)}` : '-'}
                </td>
                <td className="px-2 py-2 text-right border-r border-slate-300 font-mono text-purple-900">
                  {formatCurrency(totals.d11aHtCommission)}
                </td>
                <td className="px-2 py-2 text-right border-r border-slate-300 font-mono">
                  {formatCurrency(totals.totalRevenue)}
                </td>
                <td className="px-2 py-2 text-right font-mono text-emerald-950 bg-emerald-100">
                  {formatCurrency(totals.totalCommission)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
