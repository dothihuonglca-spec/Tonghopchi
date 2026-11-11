/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  StaffSummaryRow, 
  AgencySettings 
} from '../types/index.ts';
import { formatCurrency } from '../utils/excelExport.ts';
import { RATE_NEW, RATE_REG } from '../constants.ts';
import { 
  Download, 
  Printer, 
  Eye, 
  Building2, 
  Layers, 
  FileSpreadsheet
} from 'lucide-react';

interface HoaHongSummaryTableProps {
  summaryRows: StaffSummaryRow[];
  periodTitle: string;
  settings: AgencySettings;
  totals: {
    totalRevenue: number;
    totalCommission: number;
    totalReceipts: number;
    newRevenue: number;
    newCommission: number;
    regRevenue: number;
    regCommission: number;
    d11aRevenue?: number;
    d11aCommission?: number;
    d11aHtRevenue?: number;
    d11aHtCommission?: number;
    totalTax: number;
    totalNetCommission: number;
    activeStaffCount: number;
    activePointCount: number;
  };
  onExportExcel: () => void;
  onPrint: () => void;
  onSelectStaff: (staff: StaffSummaryRow) => void;
}

export const HoaHongSummaryTable: React.FC<HoaHongSummaryTableProps> = ({
  summaryRows,
  periodTitle,
  settings,
  totals,
  onExportExcel,
  onPrint,
  onSelectStaff
}) => {
  // Always show source split columns (File 1 and File 2) by default so all columns are visible
  const [showSourceSplit, setShowSourceSplit] = useState(true);
  const [groupByPoint, setGroupByPoint] = useState(false);

  // Group summaryRows by PointCode if groupByPoint is enabled
  const groupedByPoint = React.useMemo(() => {
    const map = new Map<string, { pointCode: string; pointName: string; rows: StaffSummaryRow[] }>();
    summaryRows.forEach(r => {
      let g = map.get(r.pointCode);
      if (!g) {
        g = { pointCode: r.pointCode, pointName: r.pointName, rows: [] };
        map.set(r.pointCode, g);
      }
      g.rows.push(r);
    });
    return Array.from(map.values());
  }, [summaryRows]);

  const today = new Date();
  const dayStr = String(today.getDate()).padStart(2, '0');
  const monthStr = String(today.getMonth() + 1).padStart(2, '0');
  const yearStr = today.getFullYear();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Action Header above the document */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
              Biểu mẫu Tổng hợp Thù lao (TH HOA HONG {periodTitle.toUpperCase()})
            </h2>
            <p className="text-xs text-slate-500">
              Mẫu biểu chuẩn chi trả thù lao cho đại lý và nhân viên thu theo QĐ 490/QĐ-BHXH
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle breakdown D11A vs D11A_HT */}
          <button
            onClick={() => setShowSourceSplit(!showSourceSplit)}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              showSourceSplit
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cột File 1 & File 2 {showSourceSplit ? '(Đang bật)' : '(Đang tắt)'}</span>
          </button>

          {/* Toggle group by point */}
          <button
            onClick={() => setGroupByPoint(!groupByPoint)}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              groupByPoint
                ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Gom nhóm theo Điểm thu</span>
          </button>

          {/* Print button */}
          <button
            onClick={onPrint}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>In biểu mẫu</span>
          </button>

          {/* Export Excel button */}
          <button
            onClick={onExportExcel}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel Biểu Mẫu</span>
          </button>
        </div>
      </div>

      {/* Printable Financial Document Container */}
      <div className="p-4 sm:p-6 lg:p-8 print:p-2" id="printable-hoahong-doc">
        {/* Republic & Agency Header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs text-slate-700 border-b border-slate-200 pb-5">
          <div>
            <div className="font-bold text-slate-900 uppercase tracking-tight text-sm">
              {settings.agencyName}
            </div>
            <div className="text-slate-500">Mã đơn vị: <span className="font-semibold text-slate-700">{settings.agencyCode}</span></div>
            <div className="text-slate-500">Địa chỉ: {settings.address}</div>
            <div className="text-slate-500">Điện thoại: {settings.phone}</div>
          </div>

          <div className="text-left sm:text-right">
            <div className="font-bold uppercase tracking-wider text-slate-900">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </div>
            <div className="font-medium italic text-slate-700 underline decoration-slate-400 underline-offset-4">
              Độc lập - Tự do - Hạnh phúc
            </div>
            <div className="text-slate-400 text-3xs mt-2 italic">
              Ban hành kèm theo Quyết định số 490/QĐ-BHXH ngày 28/3/2023 của BHXH Việt Nam
            </div>
          </div>
        </div>

        {/* Main Document Title */}
        <div className="text-center my-6 space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
            BẢNG TỔNG HỢP CHI TRẢ THÙ LAO (HOA HỒNG) CHO NHÂN VIÊN THU
          </h1>
          <div className="text-sm font-bold text-blue-700 uppercase tracking-wider">
            KỲ BÁO CÁO: {periodTitle.toUpperCase()}
          </div>
        </div>

        {/* The Two-Tier Data Table with horizontal scroll so all columns are fully visible */}
        <div className="overflow-x-auto border border-slate-300 rounded-lg shadow-2xs">
          <table className="min-w-[1360px] w-full text-left border-collapse text-xs">
            <thead>
              {/* Header Tier 1 */}
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-center text-2xs uppercase tracking-wider">
                <th rowSpan={2} className="px-2 py-2.5 border-r border-slate-300 w-10">STT</th>
                <th rowSpan={2} className="px-3 py-2.5 border-r border-slate-300 min-w-[90px]">Mã điểm thu</th>
                <th rowSpan={2} className="px-3 py-2.5 border-r border-slate-300 text-left min-w-[150px]">Tên điểm thu</th>
                <th rowSpan={2} className="px-3 py-2.5 border-r border-slate-300 min-w-[90px]">Mã số NV thu</th>
                <th rowSpan={2} className="px-3 py-2.5 border-r border-slate-300 text-left min-w-[170px]">Họ và tên nhân viên thu</th>
                <th rowSpan={2} className="px-2 py-2.5 border-r border-slate-300 w-16">Số BL</th>
                
                {/* Thu mới group */}
                <th colSpan={2} className="px-3 py-1.5 border-r border-slate-300 bg-amber-50/80 text-amber-900 font-black">
                  Đối tượng khai thác thu mới
                </th>

                {/* Thu thường kỳ group */}
                <th colSpan={2} className="px-3 py-1.5 border-r border-slate-300 bg-blue-50/80 text-blue-900 font-black">
                  Đối tượng khai thác thu thường kỳ
                </th>

                {/* Source split columns if toggled */}
                {showSourceSplit && (
                  <th colSpan={2} className="px-3 py-1.5 border-r border-slate-300 bg-purple-50/80 text-purple-900 font-black">
                    Đối chiếu 2 File nguồn
                  </th>
                )}

                <th rowSpan={2} className="px-3 py-2.5 border-r border-slate-300 bg-slate-100 text-slate-900 font-extrabold min-w-[125px]">
                  Tổng số thu NTG đóng (VNĐ)
                </th>
                <th rowSpan={2} className="px-3 py-2.5 border-r border-slate-300 bg-blue-100/80 text-blue-950 font-black min-w-[125px]">
                  Tổng thù lao thực lĩnh (VNĐ)
                </th>

                {settings.applyTax && (
                  <th rowSpan={2} className="px-3 py-2.5 border-r border-slate-300 bg-red-50 text-red-900 font-bold min-w-[105px]">
                    Thuế TNCN (10%)
                  </th>
                )}

                {settings.applyTax && (
                  <th rowSpan={2} className="px-3 py-2.5 border-r border-slate-300 bg-emerald-50 text-emerald-950 font-black min-w-[125px]">
                    Thực lĩnh (VNĐ)
                  </th>
                )}

                <th rowSpan={2} className="px-3 py-2.5 text-center min-w-[80px] print:hidden">
                  Chi tiết
                </th>
              </tr>

              {/* Header Tier 2 */}
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 text-center text-3xs uppercase tracking-tight">
                <th className="px-2 py-1.5 border-r border-slate-300 bg-amber-50/40 min-w-[105px]">Doanh thu (VNĐ)</th>
                <th className="px-2 py-1.5 border-r border-slate-300 bg-amber-50/40 min-w-[100px]">Thù lao ({(RATE_NEW * 100).toFixed(1)}%)</th>
                <th className="px-2 py-1.5 border-r border-slate-300 bg-blue-50/40 min-w-[105px]">Doanh thu (VNĐ)</th>
                <th className="px-2 py-1.5 border-r border-slate-300 bg-blue-50/40 min-w-[100px]">Thù lao ({(RATE_REG * 100).toFixed(1)}%)</th>
                {showSourceSplit && (
                  <>
                    <th className="px-2 py-1.5 border-r border-slate-300 bg-emerald-50/60 text-emerald-900 min-w-[105px]">File 1: Phát sinh</th>
                    <th className="px-2 py-1.5 border-r border-slate-300 bg-red-50/60 text-red-900 min-w-[105px]">File 2: Thu hồi</th>
                  </>
                )}
              </tr>

              {/* Codes row (A, B, C, D, E, 1, 2, 3...) */}
              <tr className="bg-slate-50 text-slate-500 text-3xs italic text-center border-b border-slate-300">
                <td className="border-r border-slate-300 py-1 font-mono">A</td>
                <td className="border-r border-slate-300 py-1 font-mono">B</td>
                <td className="border-r border-slate-300 py-1 font-mono">C</td>
                <td className="border-r border-slate-300 py-1 font-mono">D</td>
                <td className="border-r border-slate-300 py-1 font-mono">E</td>
                <td className="border-r border-slate-300 py-1 font-mono">1</td>
                <td className="border-r border-slate-300 py-1 font-mono">2</td>
                <td className="border-r border-slate-300 py-1 font-mono">3</td>
                <td className="border-r border-slate-300 py-1 font-mono">4</td>
                <td className="border-r border-slate-300 py-1 font-mono">5</td>
                {showSourceSplit && (
                  <>
                    <td className="border-r border-slate-300 py-1 font-mono text-emerald-800">F1</td>
                    <td className="border-r border-slate-300 py-1 font-mono text-red-800">F2</td>
                  </>
                )}
                <td className="border-r border-slate-300 py-1 font-mono font-bold">6=2+4</td>
                <td className="border-r border-slate-300 py-1 font-mono font-bold">7=F1-F2</td>
                {settings.applyTax && (
                  <td className="border-r border-slate-300 py-1 font-mono">8=7*10%</td>
                )}
                {settings.applyTax && (
                  <td className="border-r border-slate-300 py-1 font-mono font-bold">9=7-8</td>
                )}
                <td className="py-1 print:hidden font-mono">10</td>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {summaryRows.length === 0 ? (
                <tr>
                  <td colSpan={showSourceSplit ? 17 : 15} className="text-center py-12 text-slate-400 italic">
                    Không có dữ liệu thù lao phù hợp với bộ lọc đã chọn.
                  </td>
                </tr>
              ) : groupByPoint ? (
                // Grouped by Point Mode
                groupedByPoint.map(group => {
                  const gReceipts = group.rows.reduce((acc, r) => acc + r.totalReceipts, 0);
                  const gNewRev = group.rows.reduce((acc, r) => acc + r.newRevenue, 0);
                  const gNewCom = group.rows.reduce((acc, r) => acc + r.newCommission, 0);
                  const gRegRev = group.rows.reduce((acc, r) => acc + r.regRevenue, 0);
                  const gRegCom = group.rows.reduce((acc, r) => acc + r.regCommission, 0);
                  const gD11aCom = group.rows.reduce((acc, r) => acc + r.d11aCommission, 0);
                  const gD11aHtCom = group.rows.reduce((acc, r) => acc + r.d11aHtCommission, 0);
                  const gTotRev = group.rows.reduce((acc, r) => acc + r.totalRevenue, 0);
                  const gTotCom = group.rows.reduce((acc, r) => acc + r.totalCommission, 0);
                  const gTax = group.rows.reduce((acc, r) => acc + r.taxDeduction, 0);
                  const gNetCom = group.rows.reduce((acc, r) => acc + r.netCommission, 0);

                  return (
                    <React.Fragment key={group.pointCode}>
                      {/* Point Header Bar */}
                      <tr className="bg-slate-200/80 font-bold text-slate-800 text-2xs">
                        <td colSpan={showSourceSplit ? 17 : 15} className="px-3 py-1.5">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded bg-blue-700 text-white font-mono text-xs">
                              {group.pointCode}
                            </span>
                            <span>{group.pointName}</span>
                            <span className="text-slate-500 font-normal">
                              ({group.rows.length} nhân viên thu - {gReceipts} biên lai)
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Staff rows */}
                      {group.rows.map((row, idx) => (
                        <tr 
                          key={row.staffId} 
                          className="hover:bg-blue-50/50 transition-colors"
                        >
                          <td className="px-2 py-2 text-center border-r border-slate-200 text-slate-500 font-mono">
                            {idx + 1}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-slate-200 font-mono text-slate-600">
                            {row.pointCode}
                          </td>
                          <td className="px-3 py-2 border-r border-slate-200 text-slate-600 truncate max-w-[150px]" title={row.pointName}>
                            {row.pointName}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-slate-200 font-mono text-slate-600">
                            {row.staffId}
                          </td>
                          <td className="px-3 py-2 border-r border-slate-200 font-semibold text-slate-900">
                            <button
                              onClick={() => onSelectStaff(row)}
                              className="text-left hover:text-blue-600 hover:underline flex items-center space-x-1 cursor-pointer"
                            >
                              <span>{row.staffName}</span>
                            </button>
                          </td>
                          <td className="px-2 py-2 text-center border-r border-slate-200 font-medium text-slate-700">
                            {row.totalReceipts}
                          </td>
                          <td className="px-2 py-2 text-right border-r border-slate-200 text-slate-700 font-mono">
                            {row.newRevenue > 0 ? formatCurrency(row.newRevenue) : '-'}
                          </td>
                          <td className="px-2 py-2 text-right border-r border-slate-200 text-amber-700 font-mono font-medium">
                            {row.newCommission > 0 ? formatCurrency(row.newCommission) : '-'}
                          </td>
                          <td className="px-2 py-2 text-right border-r border-slate-200 text-slate-700 font-mono">
                            {row.regRevenue > 0 ? formatCurrency(row.regRevenue) : '-'}
                          </td>
                          <td className="px-2 py-2 text-right border-r border-slate-200 text-blue-700 font-mono font-medium">
                            {row.regCommission > 0 ? formatCurrency(row.regCommission) : '-'}
                          </td>
                          {showSourceSplit && (
                            <>
                              <td className="px-2 py-2 text-right border-r border-slate-200 text-emerald-800 font-mono font-medium bg-emerald-50/20">
                                {formatCurrency(row.d11aCommission)}
                              </td>
                              <td className="px-2 py-2 text-right border-r border-slate-200 text-purple-700 font-mono font-medium bg-purple-50/20">
                                {row.d11aHtCommission > 0 ? `-${formatCurrency(row.d11aHtCommission)}` : '0'}
                              </td>
                            </>
                          )}
                          <td className="px-2 py-2 text-right border-r border-slate-200 font-bold text-slate-900 font-mono bg-slate-50/50">
                            {formatCurrency(row.totalRevenue)}
                          </td>
                          <td className="px-2 py-2 text-right border-r border-slate-200 font-black text-blue-900 font-mono bg-blue-50/40">
                            {formatCurrency(row.totalCommission)}
                          </td>
                          {settings.applyTax && (
                            <td className="px-2 py-2 text-right border-r border-slate-200 text-red-600 font-mono">
                              {row.taxDeduction > 0 ? `-${formatCurrency(row.taxDeduction)}` : '0'}
                            </td>
                          )}
                          {settings.applyTax && (
                            <td className="px-2 py-2 text-right border-r border-slate-200 font-black text-emerald-800 font-mono bg-emerald-50/40">
                              {formatCurrency(row.netCommission)}
                            </td>
                          )}
                          <td className="px-2 py-2 text-center print:hidden">
                            <button
                              onClick={() => onSelectStaff(row)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Xem danh sách người tham gia"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {/* Point Subtotal row */}
                      <tr className="bg-slate-100 font-bold text-slate-900 border-b-2 border-slate-300 text-2xs">
                        <td colSpan={5} className="px-3 py-1.5 border-r border-slate-300 text-right uppercase">
                          Cộng điểm {group.pointCode}:
                        </td>
                        <td className="px-2 py-1.5 text-center border-r border-slate-300">{gReceipts}</td>
                        <td className="px-2 py-1.5 text-right border-r border-slate-300 font-mono">{formatCurrency(gNewRev)}</td>
                        <td className="px-2 py-1.5 text-right border-r border-slate-300 font-mono text-amber-800">{formatCurrency(gNewCom)}</td>
                        <td className="px-2 py-1.5 text-right border-r border-slate-300 font-mono">{formatCurrency(gRegRev)}</td>
                        <td className="px-2 py-1.5 text-right border-r border-slate-300 font-mono text-blue-800">{formatCurrency(gRegCom)}</td>
                        {showSourceSplit && (
                          <>
                            <td className="px-2 py-1.5 text-right border-r border-slate-300 font-mono text-emerald-900">{formatCurrency(gD11aCom)}</td>
                            <td className="px-2 py-1.5 text-right border-r border-slate-300 font-mono text-purple-900">{gD11aHtCom > 0 ? `-${formatCurrency(gD11aHtCom)}` : '0'}</td>
                          </>
                        )}
                        <td className="px-2 py-1.5 text-right border-r border-slate-300 font-mono bg-slate-200/50">{formatCurrency(gTotRev)}</td>
                        <td className="px-2 py-1.5 text-right border-r border-slate-300 font-mono text-blue-900 bg-blue-100/50">{formatCurrency(gTotCom)}</td>
                        {settings.applyTax && (
                          <td className="px-2 py-1.5 text-right border-r border-slate-300 text-red-700 font-mono">
                            {formatCurrency(gTax)}
                          </td>
                        )}
                        {settings.applyTax && (
                          <td className="px-2 py-1.5 text-right border-r border-slate-300 text-emerald-900 font-mono bg-emerald-100/40">
                            {formatCurrency(gNetCom)}
                          </td>
                        )}
                        <td className="print:hidden"></td>
                      </tr>
                    </React.Fragment>
                  );
                })
              ) : (
                // Flat Table Mode (Ranked by Total Commission)
                summaryRows.map((row, idx) => (
                  <tr 
                    key={`${row.pointCode}_${row.staffId}_${idx}`} 
                    className="hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="px-2 py-2.5 text-center border-r border-slate-200 text-slate-500 font-mono font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-2 py-2.5 text-center border-r border-slate-200 font-mono text-slate-600 font-medium">
                      {row.pointCode}
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-200 text-slate-600 truncate max-w-[150px]" title={row.pointName}>
                      {row.pointName}
                    </td>
                    <td className="px-2 py-2.5 text-center border-r border-slate-200 font-mono text-slate-600">
                      {row.staffId}
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-200 font-semibold text-slate-900">
                      <button
                        onClick={() => onSelectStaff(row)}
                        className="text-left hover:text-blue-600 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <span>{row.staffName}</span>
                      </button>
                    </td>
                    <td className="px-2 py-2.5 text-center border-r border-slate-200 font-semibold text-slate-800">
                      {row.totalReceipts}
                    </td>
                    <td className="px-2 py-2.5 text-right border-r border-slate-200 text-slate-700 font-mono">
                      {row.newRevenue > 0 ? formatCurrency(row.newRevenue) : '-'}
                    </td>
                    <td className="px-2 py-2.5 text-right border-r border-slate-200 text-amber-700 font-mono font-semibold">
                      {row.newCommission > 0 ? formatCurrency(row.newCommission) : '-'}
                    </td>
                    <td className="px-2 py-2.5 text-right border-r border-slate-200 text-slate-700 font-mono">
                      {row.regRevenue > 0 ? formatCurrency(row.regRevenue) : '-'}
                    </td>
                    <td className="px-2 py-2.5 text-right border-r border-slate-200 text-blue-700 font-mono font-semibold">
                      {row.regCommission > 0 ? formatCurrency(row.regCommission) : '-'}
                    </td>
                    {showSourceSplit && (
                      <>
                        <td className="px-2 py-2.5 text-right border-r border-slate-200 text-emerald-800 font-mono font-semibold bg-emerald-50/20">
                          {formatCurrency(row.d11aCommission)}
                        </td>
                        <td className="px-2 py-2.5 text-right border-r border-slate-200 text-purple-700 font-mono font-semibold bg-purple-50/20">
                          {row.d11aHtCommission > 0 ? `-${formatCurrency(row.d11aHtCommission)}` : '0'}
                        </td>
                      </>
                    )}
                    <td className="px-2 py-2.5 text-right border-r border-slate-200 font-bold text-slate-900 font-mono bg-slate-50/60">
                      {formatCurrency(row.totalRevenue)}
                    </td>
                    <td className="px-2 py-2.5 text-right border-r border-slate-200 font-black text-blue-900 font-mono bg-blue-50/50">
                      {formatCurrency(row.totalCommission)}
                    </td>
                    {settings.applyTax && (
                      <td className="px-2 py-2.5 text-right border-r border-slate-200 text-red-600 font-mono">
                        {row.taxDeduction > 0 ? `-${formatCurrency(row.taxDeduction)}` : '0'}
                      </td>
                    )}
                    {settings.applyTax && (
                      <td className="px-2 py-2.5 text-right border-r border-slate-200 font-black text-emerald-800 font-mono bg-emerald-50/50">
                        {formatCurrency(row.netCommission)}
                      </td>
                    )}
                    <td className="px-2 py-2.5 text-center print:hidden">
                      <button
                        onClick={() => onSelectStaff(row)}
                        className="inline-flex items-center space-x-1 px-2 py-1 text-3xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Xem ({row.totalReceipts})</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Official Grand Total Row */}
            <tfoot>
              <tr className="bg-slate-200/90 text-slate-950 font-black border-t-2 border-slate-400 text-xs uppercase tracking-tight">
                <td colSpan={5} className="px-3 py-3 border-r border-slate-300 text-center tracking-wider text-sm">
                  CỘNG TỔNG TOÀN ĐƠN VỊ
                </td>
                <td className="px-2 py-3 text-center border-r border-slate-300 font-black text-blue-900 text-sm">
                  {totals.totalReceipts}
                </td>
                <td className="px-2 py-3 text-right border-r border-slate-300 font-mono">
                  {formatCurrency(totals.newRevenue)}
                </td>
                <td className="px-2 py-3 text-right border-r border-slate-300 font-mono text-amber-800">
                  {formatCurrency(totals.newCommission)}
                </td>
                <td className="px-2 py-3 text-right border-r border-slate-300 font-mono">
                  {formatCurrency(totals.regRevenue)}
                </td>
                <td className="px-2 py-3 text-right border-r border-slate-300 font-mono text-blue-800">
                  {formatCurrency(totals.regCommission)}
                </td>
                {showSourceSplit && (
                  <>
                    <td className="px-2 py-3 text-right border-r border-slate-300 font-mono text-emerald-950 font-bold bg-emerald-100/50">
                      {formatCurrency(totals.d11aCommission || 0)}
                    </td>
                    <td className="px-2 py-3 text-right border-r border-slate-300 font-mono text-purple-950 font-bold bg-purple-100/50">
                      {totals.d11aHtCommission && totals.d11aHtCommission > 0 ? `-${formatCurrency(totals.d11aHtCommission)}` : '0'}
                    </td>
                  </>
                )}
                <td className="px-2 py-3 text-right border-r border-slate-300 font-mono text-sm bg-slate-300/60">
                  {formatCurrency(totals.totalRevenue)}
                </td>
                <td className="px-2 py-3 text-right border-r border-slate-300 font-mono text-sm text-blue-950 bg-blue-100">
                  {formatCurrency(totals.totalCommission)}
                </td>
                {settings.applyTax && (
                  <td className="px-2 py-3 text-right border-r border-slate-300 text-red-700 font-mono">
                    {formatCurrency(totals.totalTax)}
                  </td>
                )}
                {settings.applyTax && (
                  <td className="px-2 py-3 text-right border-r border-slate-300 font-mono text-sm text-emerald-950 bg-emerald-100">
                    {formatCurrency(totals.totalNetCommission)}
                  </td>
                )}
                <td className="print:hidden"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Sign-off Section */}
        <div className="mt-12 pt-6 grid grid-cols-3 gap-6 text-center text-xs">
          <div>
            <div className="font-bold text-slate-800 uppercase tracking-wider">NGƯỜI LẬP BIỂU</div>
            <div className="text-3xs text-slate-500 italic mb-16">(Ký, ghi rõ họ tên)</div>
            <div className="font-semibold text-slate-900 text-sm">{settings.preparerName}</div>
          </div>

          <div>
            <div className="font-bold text-slate-800 uppercase tracking-wider">KẾ TOÁN TRƯỞNG</div>
            <div className="text-3xs text-slate-500 italic mb-16">(Ký, ghi rõ họ tên)</div>
            <div className="font-semibold text-slate-900 text-sm">{settings.accountantName}</div>
          </div>

          <div>
            <div className="text-3xs text-slate-500 italic mb-1">
              Ngày {dayStr} tháng {monthStr} năm {yearStr}
            </div>
            <div className="font-bold text-slate-800 uppercase tracking-wider">THỦ TRƯỞNG ĐƠN VỊ</div>
            <div className="text-3xs text-slate-500 italic mb-16">(Ký, đóng dấu, ghi rõ họ tên)</div>
            <div className="font-bold text-slate-900 text-sm">{settings.representativeName}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
