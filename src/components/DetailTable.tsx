/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { D11aRow } from '../types/index.ts';
import { formatCurrency } from '../utils/excelExport.ts';
import { 
  Search, 
  Trash2, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ArrowUpDown,
  Filter,
  Sparkles,
  Repeat,
  TrendingUp,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface DetailTableProps {
  records: D11aRow[];
  activeSheet: 'D11A' | 'D11A_HT' | 'ALL';
  customFilter?: 'ALL' | 'NEW_ONLY' | 'REG_ONLY';
  titleBanner?: string;
  highlightCategory?: 'new' | 'reg' | 'revenue' | 'all';
  onDeleteRecord: (id: string) => void;
  onAddRecord: () => void;
}

export const DetailTable: React.FC<DetailTableProps> = ({
  records,
  activeSheet,
  customFilter = 'ALL',
  titleBanner,
  highlightCategory = 'all',
  onDeleteRecord,
  onAddRecord
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<keyof D11aRow>('stt');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Filter records by source and customFilter (e.g. Thu mới / Thu thường kỳ)
  const filtered = useMemo(() => {
    let list = records;
    if (activeSheet !== 'ALL') {
      list = list.filter(r => r.source === activeSheet);
    }
    if (customFilter === 'NEW_ONLY') {
      list = list.filter(r => r.newRevenue > 0 || r.newCommission > 0);
    } else if (customFilter === 'REG_ONLY') {
      list = list.filter(r => r.regRevenue > 0 || r.regCommission > 0);
    }

    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(r =>
      r.participantName.toLowerCase().includes(q) ||
      r.bhxhCode.toLowerCase().includes(q) ||
      r.staffName.toLowerCase().includes(q) ||
      r.staffId.toLowerCase().includes(q) ||
      r.pointCode.toLowerCase().includes(q) ||
      r.receiptNumber.toLowerCase().includes(q) ||
      (r.notes && r.notes.toLowerCase().includes(q))
    );
  }, [records, activeSheet, customFilter, searchTerm]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA || '');
      const strB = String(valB || '');
      return sortAsc ? strA.localeCompare(strB, 'vi') : strB.localeCompare(strA, 'vi');
    });
  }, [filtered, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const pagedRecords = useMemo(() => {
    if (pageSize >= 1000) return sorted;
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  const handleSort = (field: keyof D11aRow) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Totals for the current filtered list
  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => {
        acc.newRev += r.newRevenue;
        acc.newCom += r.newCommission;
        acc.regRev += r.regRevenue;
        acc.regCom += r.regCommission;
        acc.totRev += r.totalRevenue;
        acc.totCom += r.totalCommission;
        return acc;
      },
      { newRev: 0, newCom: 0, regRev: 0, regCom: 0, totRev: 0, totCom: 0 }
    );
  }, [filtered]);

  // Quick export for current table
  const handleQuickExport = () => {
    const exportData = filtered.map((r, idx) => ({
      'STT': idx + 1,
      'Nguồn': r.source,
      'Mã điểm': r.pointCode,
      'Nhân viên thu': r.staffName,
      'Mã số NV': r.staffId,
      'Người tham gia': r.participantName,
      'Mã số BHXH': r.bhxhCode,
      'Số biên lai': r.receiptNumber,
      'Ngày BL': r.receiptDate,
      'PT đóng': r.paymentMethod,
      'Tiền thu mới (VNĐ)': r.newRevenue,
      'Tỷ lệ mới': `${(r.newRate * 100).toFixed(1)}%`,
      'Thù lao mới (VNĐ)': r.newCommission,
      'Tiền thu thường kỳ (VNĐ)': r.regRevenue,
      'Tỷ lệ TK': `${(r.regRate * 100).toFixed(1)}%`,
      'Thù lao TK (VNĐ)': r.regCommission,
      'Tổng tiền thu (VNĐ)': r.totalRevenue,
      'Tổng thù lao (VNĐ)': r.totalCommission,
      'Ghi chú': r.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!pageSetup'] = { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
    ws['!margins'] = { left: 0.35, right: 0.35, top: 0.45, bottom: 0.45, header: 0.2, footer: 0.2 };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Du_Lieu_Chi_Tiet');
    XLSX.writeFile(wb, `Chi_Tiet_${Date.now()}.xlsx`);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Optional Title Banner */}
      {titleBanner && (
        <div className="px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white flex flex-wrap items-center justify-between gap-2 border-b border-slate-700">
          <div className="flex items-center gap-2">
            {customFilter === 'NEW_ONLY' && <Sparkles className="w-4 h-4 text-amber-400" />}
            {customFilter === 'REG_ONLY' && <Repeat className="w-4 h-4 text-blue-400" />}
            {customFilter === 'ALL' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
            <h3 className="text-xs font-bold uppercase tracking-wider">{titleBanner}</h3>
          </div>
          <div className="flex items-center gap-2 text-2xs text-slate-300">
            <span>Tổng cộng: <strong className="text-white">{filtered.length}</strong> biên lai</span>
            <span>•</span>
            <span>Tổng thù lao: <strong className="text-amber-300">{formatCurrency(totals.totCom)} VNĐ</strong></span>
          </div>
        </div>
      )}

      {/* Table Toolbar */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm tên NTG, mã BHXH, số BL, nhân viên..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 w-60 sm:w-72 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
          <span className="text-xs text-slate-500">
            Hiển thị <strong>{filtered.length}</strong> / {records.length} dòng
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick export button */}
          <button
            onClick={handleQuickExport}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Xuất bảng này ra file Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          {/* Add row button */}
          <button
            onClick={onAddRecord}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm biên lai</span>
          </button>

          {/* Page size select */}
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(parseInt(e.target.value, 10));
              setCurrentPage(1);
            }}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500"
          >
            <option value={25}>25 dòng/trang</option>
            <option value={50}>50 dòng/trang</option>
            <option value={100}>100 dòng/trang</option>
            <option value={99999}>Tất cả ({filtered.length})</option>
          </select>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto max-h-[600px] relative">
        <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
          <thead className="sticky top-0 z-10 bg-slate-100 shadow-2xs">
            <tr className="border-b border-slate-300 text-slate-800 text-3xs font-bold uppercase tracking-wider text-center">
              <th className="px-2 py-2 border-r border-slate-300 w-10">STT</th>
              <th className="px-2 py-2 border-r border-slate-300 w-16">Nguồn</th>
              <th className="px-2 py-2 border-r border-slate-300 cursor-pointer" onClick={() => handleSort('pointCode')}>
                <div className="flex items-center justify-center space-x-1">
                  <span>Mã điểm</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="px-3 py-2 border-r border-slate-300 text-left cursor-pointer" onClick={() => handleSort('staffName')}>
                <div className="flex items-center space-x-1">
                  <span>Họ tên nhân viên thu</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="px-2 py-2 border-r border-slate-300 font-mono">Mã số NV</th>
              <th className="px-3 py-2 border-r border-slate-300 text-left cursor-pointer" onClick={() => handleSort('participantName')}>
                <div className="flex items-center space-x-1">
                  <span>Họ tên người tham gia</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="px-3 py-2 border-r border-slate-300 font-mono">Mã số BHXH</th>
              <th className="px-2 py-2 border-r border-slate-300 font-mono cursor-pointer" onClick={() => handleSort('receiptNumber')}>
                Số biên lai
              </th>
              <th className="px-2 py-2 border-r border-slate-300 cursor-pointer" onClick={() => handleSort('receiptDate')}>
                Ngày BL
              </th>
              <th className="px-2 py-2 border-r border-slate-300 w-12">PT</th>
              
              {/* Thu Mới */}
              <th className={`px-2 py-2 border-r border-slate-300 text-right ${
                highlightCategory === 'new' ? 'bg-amber-100 text-amber-950 font-black' : 'bg-amber-50 text-amber-900'
              }`}>
                NTG đóng mới
              </th>
              <th className={`px-2 py-2 border-r border-slate-300 text-center w-14 ${
                highlightCategory === 'new' ? 'bg-amber-100 text-amber-950 font-black' : 'bg-amber-50 text-amber-900'
              }`}>
                Tỷ lệ
              </th>
              <th className={`px-2 py-2 border-r border-slate-300 text-right ${
                highlightCategory === 'new' ? 'bg-amber-100 text-amber-950 font-black' : 'bg-amber-50 text-amber-900'
              }`}>
                Thù lao mới
              </th>
              
              {/* Thu Thường Kỳ */}
              <th className={`px-2 py-2 border-r border-slate-300 text-right ${
                highlightCategory === 'reg' ? 'bg-blue-100 text-blue-950 font-black' : 'bg-blue-50 text-blue-900'
              }`}>
                NTG đóng TK
              </th>
              <th className={`px-2 py-2 border-r border-slate-300 text-center w-14 ${
                highlightCategory === 'reg' ? 'bg-blue-100 text-blue-950 font-black' : 'bg-blue-50 text-blue-900'
              }`}>
                Tỷ lệ
              </th>
              <th className={`px-2 py-2 border-r border-slate-300 text-right ${
                highlightCategory === 'reg' ? 'bg-blue-100 text-blue-950 font-black' : 'bg-blue-50 text-blue-900'
              }`}>
                Thù lao TK
              </th>
              
              {/* Tổng Doanh Thu */}
              <th className={`px-3 py-2 border-r border-slate-300 text-right cursor-pointer ${
                highlightCategory === 'revenue' ? 'bg-emerald-100 text-emerald-950 font-black' : 'bg-slate-200 text-slate-900 font-extrabold'
              }`} onClick={() => handleSort('totalRevenue')}>
                Tổng số thu
              </th>
              <th className="px-3 py-2 border-r border-slate-300 bg-blue-100 text-blue-950 font-black text-right cursor-pointer" onClick={() => handleSort('totalCommission')}>
                Thù lao được hưởng
              </th>
              <th className="px-3 py-2 border-r border-slate-300 text-left">Ghi chú</th>
              <th className="px-2 py-2 text-center w-10">Xóa</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {pagedRecords.length === 0 ? (
              <tr>
                <td colSpan={20} className="text-center py-10 text-slate-400 italic">
                  Không tìm thấy hồ sơ nào khớp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              pagedRecords.map((r, idx) => (
                <tr key={r.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-2 py-1.5 text-center border-r border-slate-200 text-slate-500 font-mono text-2xs">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </td>
                  <td className="px-2 py-1.5 text-center border-r border-slate-200">
                    <span className={`px-1.5 py-0.5 rounded text-3xs font-black ${
                      r.source === 'D11A' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {r.source}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-center border-r border-slate-200 font-medium text-slate-700 font-mono">
                    {r.pointCode}
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-200 font-semibold text-slate-900">
                    {r.staffName}
                  </td>
                  <td className="px-2 py-1.5 border-r border-slate-200 text-slate-500 font-mono text-2xs">
                    {r.staffId}
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-200 font-medium text-slate-900">
                    {r.participantName}
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-200 font-mono text-slate-700">
                    {r.bhxhCode}
                  </td>
                  <td className="px-2 py-1.5 border-r border-slate-200 font-mono text-slate-800 text-center font-bold">
                    {r.receiptNumber}
                  </td>
                  <td className="px-2 py-1.5 border-r border-slate-200 text-slate-600 text-center">
                    {r.receiptDate}
                  </td>
                  <td className="px-2 py-1.5 border-r border-slate-200 text-center font-mono">
                    {r.paymentMethod}
                  </td>
                  
                  {/* Thu mới */}
                  <td className={`px-2 py-1.5 border-r border-slate-200 text-right ${
                    r.newRevenue > 0 ? 'text-amber-800 font-bold bg-amber-50/40' : 'text-slate-300'
                  }`}>
                    {r.newRevenue > 0 ? formatCurrency(r.newRevenue) : '-'}
                  </td>
                  <td className="px-2 py-1.5 border-r border-slate-200 text-center text-slate-600 text-2xs">
                    {r.newRevenue > 0 ? `${(r.newRate * 100).toFixed(1)}%` : '-'}
                  </td>
                  <td className={`px-2 py-1.5 border-r border-slate-200 text-right ${
                    r.newCommission > 0 ? 'text-amber-900 font-extrabold bg-amber-50/60' : 'text-slate-300'
                  }`}>
                    {r.newCommission > 0 ? formatCurrency(r.newCommission) : '-'}
                  </td>
                  
                  {/* Thu thường kỳ */}
                  <td className={`px-2 py-1.5 border-r border-slate-200 text-right ${
                    r.regRevenue > 0 ? 'text-blue-800 font-bold bg-blue-50/40' : 'text-slate-300'
                  }`}>
                    {r.regRevenue > 0 ? formatCurrency(r.regRevenue) : '-'}
                  </td>
                  <td className="px-2 py-1.5 border-r border-slate-200 text-center text-slate-600 text-2xs">
                    {r.regRevenue > 0 ? `${(r.regRate * 100).toFixed(1)}%` : '-'}
                  </td>
                  <td className={`px-2 py-1.5 border-r border-slate-200 text-right ${
                    r.regCommission > 0 ? 'text-blue-900 font-extrabold bg-blue-50/60' : 'text-slate-300'
                  }`}>
                    {r.regCommission > 0 ? formatCurrency(r.regCommission) : '-'}
                  </td>
                  
                  {/* Tổng */}
                  <td className="px-3 py-1.5 border-r border-slate-200 text-right font-black text-slate-900 bg-slate-50/80">
                    {formatCurrency(r.totalRevenue)}
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-right font-black text-blue-700 bg-blue-50/50">
                    {formatCurrency(r.totalCommission)}
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-slate-500 text-2xs truncate max-w-[120px]">
                    {r.notes || '-'}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <button
                      onClick={() => onDeleteRecord(r.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Xóa biên lai này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Table Footer Totals */}
          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
            <tr>
              <td colSpan={10} className="px-4 py-2.5 text-right uppercase tracking-wider text-xs border-r border-slate-300">
                Tổng cộng toàn bộ ({filtered.length} biên lai):
              </td>
              <td className="px-2 py-2.5 text-right font-black text-amber-900 bg-amber-100 border-r border-slate-300">
                {formatCurrency(totals.newRev)}
              </td>
              <td className="px-2 py-2.5 text-center bg-amber-100 border-r border-slate-300 text-2xs">-</td>
              <td className="px-2 py-2.5 text-right font-black text-amber-900 bg-amber-200 border-r border-slate-300">
                {formatCurrency(totals.newCom)}
              </td>
              <td className="px-2 py-2.5 text-right font-black text-blue-900 bg-blue-100 border-r border-slate-300">
                {formatCurrency(totals.regRev)}
              </td>
              <td className="px-2 py-2.5 text-center bg-blue-100 border-r border-slate-300 text-2xs">-</td>
              <td className="px-2 py-2.5 text-right font-black text-blue-900 bg-blue-200 border-r border-slate-300">
                {formatCurrency(totals.regCom)}
              </td>
              <td className="px-3 py-2.5 text-right font-black text-slate-900 bg-slate-200 border-r border-slate-300">
                {formatCurrency(totals.totRev)}
              </td>
              <td className="px-3 py-2.5 text-right font-black text-blue-900 bg-blue-300 border-r border-slate-300">
                {formatCurrency(totals.totCom)}
              </td>
              <td colSpan={2} className="px-3 py-2.5"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center space-x-1">
          <span>Trang <strong>{currentPage}</strong> / {totalPages}</span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-2 font-semibold">Trang {currentPage}</span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
