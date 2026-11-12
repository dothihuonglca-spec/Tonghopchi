/**
 * Bảng FILE 2 (D11A_HT) — hiển thị ĐÚNG biểu mẫu gốc:
 *   15 cột, dòng mã cột A..F,1..9, dòng "Tháng MM năm YYYY".
 * Tên cột lấy nguyên văn từ file Excel, không tự đặt lại.
 */

import React, { useMemo, useState } from 'react';
import { Search, FileSpreadsheet } from 'lucide-react';
import { D11aRow } from '../types/index.ts';
import { formatCurrency } from '../utils/excelExport.ts';
import { D11A_HT, d11aHtPeriodLine } from '../data/templateNames.ts';

interface RefundTableProps {
  records: D11aRow[];
  month: number;
  year: number;
  agencyName?: string;
  onDeleteRecord?: (id: string) => void;
}

const TH = 'px-2 py-1.5 border border-slate-300 text-center font-bold whitespace-nowrap';
const TD = 'px-2 py-1 border border-slate-200';

export const RefundTable: React.FC<RefundTableProps> = ({
  records,
  month,
  year,
  agencyName,
  onDeleteRecord
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return records;
    return records.filter(r =>
      r.participantName.toLowerCase().includes(q) ||
      r.bhxhCode.toLowerCase().includes(q) ||
      r.staffName.toLowerCase().includes(q) ||
      r.pointCode.toLowerCase().includes(q) ||
      (r.dotPhatSinh || '').toLowerCase().includes(q) ||
      (r.dotPhatSinhGiam || '').toLowerCase().includes(q)
    );
  }, [records, searchTerm]);

  const totals = useMemo(() => filtered.reduce(
    (acc, r) => {
      acc.mucDong += r.mucDong ?? 0;
      acc.hoanTra += r.hoanTraNTG ?? 0;
      acc.thuLao += r.totalCommission ?? 0;
      return acc;
    },
    { mucDong: 0, hoanTra: 0, thuLao: 0 }
  ), [filtered]);

  const pct = (rate?: number) => (rate && rate > 0 ? `${(rate * 100).toFixed(1)}%` : '');

  const cells = (r: D11aRow, idx: number): React.ReactNode => {
    switch (idx) {
      case 0: return idx + 1;
      case 1: return <span className="font-mono">{r.pointCode}</span>;
      case 2: return r.staffName;
      case 3: return <span className="font-mono">{r.staffId}</span>;
      case 4: return r.participantName;
      case 5: return <span className="font-mono">{r.bhxhCode}</span>;
      case 6: return r.mucDong ? formatCurrency(r.mucDong) : '';
      case 7: return r.soThangGiam ?? '';
      case 8: return formatCurrency(r.hoanTraNTG ?? 0);
      case 9: return pct(r.tyLeThuHoi);
      case 10: return formatCurrency(r.totalCommission ?? 0);
      case 11: return r.notes;
      case 12: return r.dotPhatSinh || '';
      case 13: return r.dotPhatSinhGiam || '';
      case 14: return r.daHoanTra || '';
      default: return '';
    }
  };

  const rightAlign = new Set([6, 8, 10]);

  return (
    <div className="bg-sky-50 rounded-xl border border-sky-200 overflow-hidden">
      <div className="px-3 pt-2.5 pb-2 border-b border-sky-200 bg-sky-100/70">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-2xs font-bold uppercase text-slate-700 truncate">{agencyName || ''}</div>
            <div className="text-xs font-black uppercase text-slate-900">{D11A_HT.title}</div>
            <div className="text-2xs text-slate-600">{d11aHtPeriodLine(month, year)}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 text-3xs font-bold px-2 py-0.5 rounded-full bg-purple-700 text-white">
              <FileSpreadsheet className="w-3 h-3" /> Sheet {D11A_HT.sheet}
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
            placeholder="Tìm theo tên, mã BHXH, điểm thu, đợt phát sinh…"
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-2xs border-collapse whitespace-nowrap">
          <thead className="bg-sky-100 text-slate-900">
            <tr>
              {D11A_HT.header.map((h, i) => (
                <th key={i} className={TH}>{h}</th>
              ))}
              <th className={TH} />
            </tr>
            <tr className="bg-sky-200 font-mono text-3xs">
              {D11A_HT.codes.map((c, i) => (
                <th key={i} className="px-1 py-0.5 border border-slate-300">{c}</th>
              ))}
              <th className="border border-slate-300" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={16} className="px-3 py-6 text-center text-slate-500">
                  Không có dòng thu hồi nào trong kỳ này.
                </td>
              </tr>
            )}
            {filtered.map((r, idx) => (
              <tr key={r.id} className={idx % 2 ? 'bg-sky-50' : 'bg-white'}>
                {Array.from({ length: 15 }, (_, i) => (
                  <td key={i} className={`${TD} ${rightAlign.has(i) ? 'text-right' : ''}`}>
                    {cells(r, i)}
                  </td>
                ))}
                <td className={`${TD} text-center`}>
                  {onDeleteRecord && (
                    <button
                      onClick={() => onDeleteRecord(r.id)}
                      className="text-red-600 hover:text-red-800 font-semibold"
                      title="Xoá dòng này"
                    >
                      Xoá
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-sky-200 font-bold text-slate-900">
              <td colSpan={6} className={`${TD} text-center uppercase`}>
                Cộng tổng ({filtered.length} dòng)
              </td>
              <td className={`${TD} text-right`}>{formatCurrency(totals.mucDong)}</td>
              <td className={TD} />
              <td className={`${TD} text-right`}>{formatCurrency(totals.hoanTra)}</td>
              <td className={TD} />
              <td className={`${TD} text-right`}>{formatCurrency(totals.thuLao)}</td>
              <td colSpan={5} className={TD} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
