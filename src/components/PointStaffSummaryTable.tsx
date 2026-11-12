/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { PointSummaryRow, StaffSummaryRow } from '../types/index.ts';
import { formatCurrency } from '../utils/excelExport.ts';
import { RATE_NEW, RATE_REG } from '../constants.ts';
import { Building2, Users, Download, Receipt, ArrowRight } from 'lucide-react';
import * as XLSX from 'xlsx';

interface PointStaffSummaryTableProps {
  pointSummaries: PointSummaryRow[];
  staffSummaries: StaffSummaryRow[];
  periodTitle: string;
  onSelectStaff: (staff: StaffSummaryRow) => void;
  onFilterByPoint?: (pointCode: string) => void;
}

export const PointStaffSummaryTable: React.FC<PointStaffSummaryTableProps> = ({
  pointSummaries,
  staffSummaries,
  periodTitle,
  onSelectStaff,
  onFilterByPoint
}) => {
  // Calculate grand totals across all points
  const totals = useMemo(() => {
    return pointSummaries.reduce(
      (acc, p) => {
        acc.receipts += p.totalReceipts;
        acc.newRev += p.newRevenue;
        acc.newCom += p.newCommission;
        acc.regRev += p.regRevenue;
        acc.regCom += p.regCommission;
        acc.totRev += p.totalRevenue;
        acc.totCom += p.totalCommission;
        return acc;
      },
      { receipts: 0, newRev: 0, newCom: 0, regRev: 0, regCom: 0, totRev: 0, totCom: 0 }
    );
  }, [pointSummaries]);

  // Export this summary to Excel
  const handleExportPointsExcel = () => {
    const data = pointSummaries.map((p, idx) => ({
      'STT': idx + 1,
      'Mã điểm thu': p.pointCode,
      'Tên điểm thu': p.pointName,
      'Số nhân viên': p.staffCount,
      'Tổng biên lai': p.totalReceipts,
      'Doanh thu mới (VNĐ)': p.newRevenue,
      'Thù lao mới (VNĐ)': p.newCommission,
      'Doanh thu thường kỳ (VNĐ)': p.regRevenue,
      'Thù lao thường kỳ (VNĐ)': p.regCommission,
      'Tổng doanh thu (VNĐ)': p.totalRevenue,
      'Tổng thù lao (VNĐ)': p.totalCommission
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!pageSetup'] = { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tong_Hop_Diem_Thu');
    XLSX.writeFile(wb, `Tong_Hop_Diem_Thu_${periodTitle.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  return (
    <div className="bg-sky-50 rounded-xl border border-sky-200 shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-blue-500/20 text-blue-300 rounded-lg">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Bảng Tổng Hợp Hoạt Động Theo Điểm Thu & Đội Ngũ Nhân Viên ({periodTitle})
            </h3>
            <p className="text-3xs text-slate-400">
              Phân tích cơ cấu và hiệu quả khai thác của {pointSummaries.length} điểm thu và {staffSummaries.length} nhân viên
            </p>
          </div>
        </div>

        <button
          onClick={handleExportPointsExcel}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600" />
          <span>Xuất Excel Điểm Thu</span>
        </button>
      </div>

      {/* Main Points Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
          <thead className="bg-sky-100 border-b border-sky-300 text-slate-800 text-3xs font-bold uppercase tracking-wider text-center">
            <tr>
              <th className="px-2 py-2.5 border-r border-slate-300 w-10">STT</th>
              <th className="px-3 py-2.5 border-r border-slate-300 w-24">Mã điểm thu</th>
              <th className="px-4 py-2.5 border-r border-slate-300 text-left">Tên điểm thu</th>
              <th className="px-3 py-2.5 border-r border-slate-300 w-20">Số NV thu</th>
              <th className="px-3 py-2.5 border-r border-slate-300 w-24">Số hồ sơ / BL</th>
              <th className="px-3 py-2.5 border-r border-slate-300 bg-amber-50 text-amber-900 text-right">Doanh thu mới</th>
              <th className="px-3 py-2.5 border-r border-slate-300 bg-amber-50 text-amber-900 text-right">Thù lao mới ({(RATE_NEW * 100).toFixed(1)}%)</th>
              <th className="px-3 py-2.5 border-r border-slate-300 bg-blue-50 text-blue-900 text-right">Doanh thu thường kỳ</th>
              <th className="px-3 py-2.5 border-r border-slate-300 bg-blue-50 text-blue-900 text-right">Thù lao thường kỳ ({(RATE_REG * 100).toFixed(1)}%)</th>
              <th className="px-4 py-2.5 border-r border-slate-300 bg-slate-200 text-slate-950 font-black text-right">Tổng số thu NTG</th>
              <th className="px-4 py-2.5 border-r border-slate-300 bg-blue-100 text-blue-950 font-black text-right">Tổng thù lao</th>
              <th className="px-3 py-2.5 text-center w-24">Chi tiết NV</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {pointSummaries.map((p, idx) => {
              const staffInPoint = staffSummaries.filter(s => s.pointCode === p.pointCode);
              return (
                <tr key={p.pointCode} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-2 py-2 text-center border-r border-slate-200 font-mono text-2xs text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2 text-center border-r border-slate-200 font-bold font-mono text-blue-700">
                    {p.pointCode}
                  </td>
                  <td className="px-4 py-2 border-r border-slate-200 font-bold text-slate-900">
                    {p.pointName}
                  </td>
                  <td className="px-3 py-2 text-center border-r border-slate-200 font-semibold text-slate-700">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                      {p.staffCount} NV
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center border-r border-slate-200 font-bold text-slate-800">
                    {p.totalReceipts}
                  </td>
                  <td className="px-3 py-2 text-right border-r border-slate-200 text-amber-800 font-medium">
                    {formatCurrency(p.newRevenue)}
                  </td>
                  <td className="px-3 py-2 text-right border-r border-slate-200 text-amber-900 font-bold bg-amber-50/30">
                    {formatCurrency(p.newCommission)}
                  </td>
                  <td className="px-3 py-2 text-right border-r border-slate-200 text-blue-800 font-medium">
                    {formatCurrency(p.regRevenue)}
                  </td>
                  <td className="px-3 py-2 text-right border-r border-slate-200 text-blue-900 font-bold bg-blue-50/30">
                    {formatCurrency(p.regCommission)}
                  </td>
                  <td className="px-4 py-2 text-right border-r border-slate-200 font-black text-slate-900 bg-sky-50">
                    {formatCurrency(p.totalRevenue)}
                  </td>
                  <td className="px-4 py-2 text-right border-r border-slate-200 font-black text-blue-700 bg-blue-50/60">
                    {formatCurrency(p.totalCommission)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {onFilterByPoint && (
                      <button
                        onClick={() => onFilterByPoint(p.pointCode)}
                        className="text-2xs text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                      >
                        Lọc điểm &raquo;
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Grand Totals */}
          <tfoot className="bg-sky-200 font-bold border-t-2 border-sky-300 text-slate-900">
            <tr>
              <td colSpan={4} className="px-4 py-2.5 text-right uppercase tracking-wider text-xs border-r border-slate-300">
                CỘNG TỔNG TOÀN BỘ ({pointSummaries.length} ĐIỂM THU):
              </td>
              <td className="px-3 py-2.5 text-center font-black text-slate-900 border-r border-slate-300">
                {totals.receipts}
              </td>
              <td className="px-3 py-2.5 text-right font-black text-amber-900 bg-amber-100 border-r border-slate-300">
                {formatCurrency(totals.newRev)}
              </td>
              <td className="px-3 py-2.5 text-right font-black text-amber-900 bg-amber-200 border-r border-slate-300">
                {formatCurrency(totals.newCom)}
              </td>
              <td className="px-3 py-2.5 text-right font-black text-blue-900 bg-blue-100 border-r border-slate-300">
                {formatCurrency(totals.regRev)}
              </td>
              <td className="px-3 py-2.5 text-right font-black text-blue-900 bg-blue-200 border-r border-slate-300">
                {formatCurrency(totals.regCom)}
              </td>
              <td className="px-4 py-2.5 text-right font-black text-slate-950 bg-slate-200 border-r border-slate-300">
                {formatCurrency(totals.totRev)}
              </td>
              <td className="px-4 py-2.5 text-right font-black text-blue-950 bg-blue-300 border-r border-slate-300">
                {formatCurrency(totals.totCom)}
              </td>
              <td className="px-3 py-2.5"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
