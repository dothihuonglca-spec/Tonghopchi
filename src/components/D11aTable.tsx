/**
 * Bảng dữ liệu FILE 1 (D11A) — hiển thị ĐÚNG biểu mẫu gốc:
 *   18 cột, tiêu đề 2 tầng, dòng mã cột A..R, dòng "Từ ngày … đến ngày …".
 * Không tự đặt lại tên cột.
 */

import React, { useMemo, useState } from 'react';
import { Search, Trash2, FileSpreadsheet } from 'lucide-react';
import { D11aRow } from '../types/index.ts';
import { formatCurrency } from '../utils/excelExport.ts';
import { D11A, d11aPeriodLine } from '../data/templateNames.ts';

export type D11aFilterKind = 'ALL' | 'NEW' | 'REG';

interface D11aTableProps {
  records: D11aRow[];
  month: number;
  year: number;
  agencyName?: string;
  filterKind?: D11aFilterKind;
  onDeleteRecord?: (id: string) => void;
}

const pct = (r?: number) => (r && r > 0 ? `${(r * 100).toFixed(1)}%` : '');

export const D11aTable: React.FC<D11aTableProps> = ({
  records,
  month,
  year,
  agencyName,
  filterKind = 'ALL',
  onDeleteRecord
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    let list = records;
    if (filterKind === 'NEW') list = list.filter(r => r.newRevenue > 0 || r.newCommission > 0);
    if (filterKind === 'REG') list = list.filter(r => r.regRevenue > 0 || r.regCommission > 0);
    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter(r =>
      r.participantName.toLowerCase().includes(q) ||
      r.bhxhCode.toLowerCase().includes(q) ||
      r.staffName.toLowerCase().includes(q) ||
      r.staffId.toLowerCase().includes(q) ||
      r.pointCode.toLowerCase().includes(q) ||
      r.receiptNumber.toLowerCase().includes(q)
    );
  }, [records, filterKind, searchTerm]);

  const totals = useMemo(() => filtered.reduce(
    (a, r) => {
      a.newRev += r.newRevenue;
      a.newCom += r.newCommission;
      a.regRev += r.regRevenue;
      a.regCom += r.regCommission;
      a.totRev += r.totalRevenue;
      a.totCom += r.totalCommission;
      return a;
    },
    { newRev: 0, newCom: 0, regRev: 0, regCom: 0, totRev: 0, totCom: 0 }
  ), [filtered]);

  /** Tiêu đề tầng 1: các ô bị gộp 3 cột (J-L, M-O) thì để trống chỗ tầng 2. */
  const grouped = new Set(['Đối tượng khai thác thu mới', 'Đối tượng khai thác thu thường kỳ']);

  const cellVal = (r: D11aRow, idx: number): React.ReactNode => {
    switch (idx) {
      case 0: return r.stt;
      case 1: return r.pointCode;
      case 2: return r.staffName;
      case 3: return <span className="font-mono">{r.staffId}</span>;
      case 4: return r.participantName;
      case 5: return <span className="font-mono">{r.bhxhCode}</span>;
      case 6: return <span className="font-mono">{r.receiptNumber}</span>;
      case 7: return r.receiptDate;
      case 8: return r.paymentMethod;
      case 9: return r.newRevenue ? formatCurrency(r.newRevenue) : '';
      case 10: return pct(r.newRate);
      case 11: return r.newCommission ? formatCurrency(r.newCommission) : '';
      case 12: return r.regRevenue ? formatCurrency(r.regRevenue) : '';
      case 13: return pct(r.regRate);
      case 14: return r.regCommission ? formatCurrency(r.regCommission) : '';
      case 15: return formatCurrency(r.totalRevenue);
      case 16: return formatCurrency(r.totalCommission);
      case 17: return r.notes;
      default: return '';
    }
  };

  const rightAlign = new Set([9, 10, 11, 12, 13, 14, 15, 16]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Khối tiêu đề đúng biểu mẫu */}
      <div className="px-3 pt-2.5 pb-1.5 border-b border-slate-200 bg-slate-50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-2xs font-bold uppercase text-slate-700 truncate">{agencyName || ''}</div>
            <div className="text-xs font-black uppercase text-slate-900">{D11A.title}</div>
            <div className="text-2xs text-slate-600">{d11aPeriodLine(month, year)}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 text-3xs font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
              <FileSpreadsheet className="w-3 h-3" /> Sheet {D11A.sheet}
            </span>
            <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {filtered.length} dòng
            </span>
          </div>
        </div>
        <div className="relative mt-2 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, mã BHXH, số biên lai, điểm thu…"
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          />
        </div>
      </div>

      <div className="overflow-x-auto max-h-[560px]">
        <table className="w-full text-2xs border-collapse whitespace-nowrap">
          <thead className="sticky top-0 z-10 bg-slate-100">
            {/* tầng 1 */}
            <tr className="text-slate-900 font-bold">
              {D11A.header1.map((h, i) => {
                if (grouped.has(h)) {
                  return (
                    <th key={i} colSpan={3}
                      className="px-2 py-1 border border-slate-300 text-center bg-amber-50">
                      {h}
                    </th>
                  );
                }
                // bỏ qua 2 ô '' liền sau mỗi nhóm (đã gộp)
                if (h === '') return null;
                return (
                  <th key={i} rowSpan={2}
                    className={`px-2 py-1 border border-slate-300 text-center ${rightAlign.has(i) ? 'text-right' : ''}`}>
                    {h}
                  </th>
                );
              })}
            </tr>
            {/* tầng 2 */}
            <tr className="text-slate-700 font-semibold">
              {D11A.header2.map((h, i) => (
                h ? <th key={i} className="px-2 py-1 border border-slate-300 text-center bg-amber-50/50">{h}</th> : null
              ))}
            </tr>
            {/* dòng mã cột */}
            <tr className="bg-slate-200 text-slate-700 font-mono text-3xs">
              {D11A.codes.map((c, i) => (
                <th key={i} className="px-1 py-0.5 border border-slate-300 text-center">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={18} className="px-3 py-6 text-center text-slate-500">
                  Không có dòng dữ liệu trong kỳ này.
                </td>
              </tr>
            )}
            {filtered.map((r, idx) => (
              <tr key={r.id} className={idx % 2 ? 'bg-slate-50/60' : 'bg-white'}>
                {Array.from({ length: 18 }, (_, i) => (
                  <td key={i}
                    className={`px-1.5 py-0.5 border border-slate-200 ${rightAlign.has(i) ? 'text-right' : ''}`}>
                    {cellVal(r, i)}
                  </td>
                ))}
                <td className="px-1 py-0.5 border border-slate-200 text-center">
                  {onDeleteRecord && (
                    <button onClick={() => onDeleteRecord(r.id)} title="Xoá dòng này"
                      className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-200 font-black text-slate-900 text-2xs">
              <td colSpan={9} className="px-2 py-1.5 border border-slate-300 text-center uppercase">
                Cộng tổng ({filtered.length} dòng)
              </td>
              <td className="px-1.5 py-1.5 border border-slate-300 text-right">{formatCurrency(totals.newRev)}</td>
              <td className="border border-slate-300" />
              <td className="px-1.5 py-1.5 border border-slate-300 text-right">{formatCurrency(totals.newCom)}</td>
              <td className="px-1.5 py-1.5 border border-slate-300 text-right">{formatCurrency(totals.regRev)}</td>
              <td className="border border-slate-300" />
              <td className="px-1.5 py-1.5 border border-slate-300 text-right">{formatCurrency(totals.regCom)}</td>
              <td className="px-1.5 py-1.5 border border-slate-300 text-right">{formatCurrency(totals.totRev)}</td>
              <td className="px-1.5 py-1.5 border border-slate-300 text-right">{formatCurrency(totals.totCom)}</td>
              <td className="border border-slate-300" />
              <td className="border border-slate-300" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
