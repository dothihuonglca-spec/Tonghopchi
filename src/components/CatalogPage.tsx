/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef, useState } from 'react';
import { CatalogEntry, shortName } from '../data/catalog.ts';
import { Building2, Search, Upload, Download, Plus, Trash2, RotateCcw, FileJson } from 'lucide-react';

interface CatalogPageProps {
  catalog: CatalogEntry[];
  /** Mã điểm thu có trong dữ liệu nhưng chưa liên kết với đơn vị nào. */
  unmatchedCodes: string[];
  /** Số biên lai theo Mã điểm thu trong dữ liệu đang nạp. */
  recordCountByPoint: Record<string, number>;
  notice: { ok: boolean; text: string } | null;
  onChange: (entries: CatalogEntry[]) => void;
  onImportExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportJson: () => void;
  onReset: () => void;
}

type Filter = 'all' | 'linked' | 'unlinked' | 'used';

const INPUT =
  'w-full px-2 py-1 text-xs border border-sky-200 rounded-md bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-300';
const BTN =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors';

export const CatalogPage: React.FC<CatalogPageProps> = ({
  catalog,
  unmatchedCodes,
  recordCountByPoint,
  notice,
  onChange,
  onImportExcel,
  onImportJson,
  onExportJson,
  onReset,
}) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const excelRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);

  const usedCount = (e: CatalogEntry) => (e.pointCode ? recordCountByPoint[e.pointCode] ?? 0 : 0);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog
      .map((e, index) => ({ e, index }))
      .filter(({ e }) => {
        if (filter === 'linked' && !e.pointCode) return false;
        if (filter === 'unlinked' && e.pointCode) return false;
        if (filter === 'used' && !(e.pointCode && (recordCountByPoint[e.pointCode] ?? 0) > 0)) return false;
        if (!q) return true;
        return [e.code, e.name, e.address, e.pointCode, e.manager, e.phone, e.taxCode]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(q));
      });
  }, [catalog, query, filter, recordCountByPoint]);

  const linked = catalog.filter(e => e.pointCode).length;
  const used = catalog.filter(e => usedCount(e) > 0).length;

  const update = (index: number, patch: Partial<CatalogEntry>) =>
    onChange(catalog.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  const remove = (index: number) => {
    const e = catalog[index];
    if (confirm(`Xóa đơn vị "${shortName(e.name) || e.code}" khỏi danh mục?`)) {
      onChange(catalog.filter((_, i) => i !== index));
    }
  };

  const add = () => {
    const code = prompt('Nhập Mã ĐV của đơn vị mới:')?.trim();
    if (!code) return;
    if (catalog.some(e => e.code.toUpperCase() === code.toUpperCase())) {
      alert('Mã ĐV này đã có trong danh mục. Hãy sửa trực tiếp dòng đó.');
      return;
    }
    onChange([...catalog, { code, name: '' }]);
    setFilter('all');
    setQuery(code);
  };

  const Stat: React.FC<{ label: string; value: number | string; tone?: string; onClick?: () => void; active?: boolean }> = ({
    label, value, tone = 'text-slate-900', onClick, active,
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-3 rounded-xl border bg-white transition-all cursor-pointer ${
        active ? 'border-sky-500 ring-2 ring-sky-200' : 'border-sky-200 hover:border-sky-400'
      }`}
    >
      <div className="text-2xs font-semibold text-slate-600">{label}</div>
      <div className={`text-xl font-black ${tone}`}>{value}</div>
    </button>
  );

  const HEAD = ['STT', 'Mã ĐV', 'Tên đơn vị', 'Địa chỉ', 'Tài khoản', 'Điện thoại', 'Chuyên quản', 'Mã điểm thu', 'Trạng thái', 'Biên lai', ''];

  return (
    <div className="bg-sky-50 rounded-2xl border border-sky-200 shadow-sm overflow-hidden">
      {/* Tiêu đề trang */}
      <div className="px-5 py-3 bg-[#0c567a] text-white flex items-center gap-2.5">
        <div className="p-2 bg-sky-500 rounded-xl">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold">Danh mục đơn vị</h2>
          <p className="text-2xs text-sky-100">Mã ĐV — Tên đơn vị — liên kết với Mã điểm thu trong Book1/Book2</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Thống kê (bấm để lọc) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <Stat label="Tổng số đơn vị" value={catalog.length} active={filter === 'all'} onClick={() => setFilter('all')} />
          <Stat label="Đã liên kết Mã điểm thu" value={linked} tone="text-emerald-700" active={filter === 'linked'} onClick={() => setFilter('linked')} />
          <Stat label="Chưa liên kết" value={catalog.length - linked} tone="text-amber-700" active={filter === 'unlinked'} onClick={() => setFilter('unlinked')} />
          <Stat label="Có phát sinh trong dữ liệu đang nạp" value={used} tone="text-sky-700" active={filter === 'used'} onClick={() => setFilter('used')} />
        </div>

        {/* Thanh công cụ */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Tìm theo Mã ĐV, tên, địa chỉ, mã điểm thu, chuyên quản..."
              className="w-full pl-8 pr-2 py-1.5 text-xs border border-sky-300 rounded-lg bg-white"
            />
          </div>
          <button onClick={() => excelRef.current?.click()} className={`${BTN} bg-sky-600 text-white hover:bg-sky-700 border-sky-600`}>
            <Upload className="w-3.5 h-3.5" /> Nạp danh mục (Excel)
          </button>
          <button onClick={add} className={`${BTN} bg-white text-slate-700 hover:bg-sky-100 border-sky-300`}>
            <Plus className="w-3.5 h-3.5" /> Thêm đơn vị
          </button>
          <button onClick={onExportJson} className={`${BTN} bg-white text-slate-700 hover:bg-sky-100 border-sky-300`}>
            <Download className="w-3.5 h-3.5" /> Sao lưu (JSON)
          </button>
          <button onClick={() => jsonRef.current?.click()} className={`${BTN} bg-white text-slate-700 hover:bg-sky-100 border-sky-300`}>
            <FileJson className="w-3.5 h-3.5" /> Khôi phục (JSON)
          </button>
          <button
            onClick={() => {
              if (confirm('Bỏ mọi chỉnh sửa và quay về danh mục đóng gói sẵn trong code?')) onReset();
            }}
            className={`${BTN} bg-white text-rose-700 hover:bg-rose-50 border-rose-200`}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Về danh mục gốc
          </button>
          <input ref={excelRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onImportExcel} />
          <input ref={jsonRef} type="file" accept=".json" className="hidden" onChange={onImportJson} />
        </div>

        {notice && (
          <div className={`text-xs font-semibold ${notice.ok ? 'text-emerald-700' : 'text-rose-600'}`}>{notice.text}</div>
        )}
        <div className="text-2xs text-slate-600">
          Nạp file mới: mã chưa có thì nối thêm, mã đã có thì lấy dữ liệu file mới đè lên. Sửa tên, địa chỉ, Mã điểm thu ngay trên bảng — tự lưu.
        </div>

        {unmatchedCodes.length > 0 && (
          <div className="text-xs text-amber-900 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2">
            <b>{unmatchedCodes.length} Mã điểm thu trong dữ liệu chưa có tên:</b>{' '}
            {unmatchedCodes.map(c => (
              <span key={c} className="inline-block font-mono bg-white border border-amber-300 rounded px-1.5 mx-0.5">{c}</span>
            ))}
            — nhập mã đó vào cột "Mã điểm thu" của đơn vị tương ứng.
          </div>
        )}

        {/* Bảng danh mục */}
        <div className="overflow-auto max-h-[68vh] rounded-xl border border-sky-200 bg-white">
          <datalist id="unmatched-codes">
            {unmatchedCodes.map(c => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-sky-200 text-slate-900">
              <tr>
                {HEAD.map((h, i) => (
                  <th key={i} className="px-2 py-2 border border-sky-300 font-bold text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ e, index }, i) => {
                const n = usedCount(e);
                return (
                  <tr key={e.code} className={i % 2 ? 'bg-sky-50' : 'bg-white'}>
                    <td className="px-2 py-1 border border-sky-100 text-center w-12">{e.seq ?? index + 1}</td>
                    <td className="px-2 py-1 border border-sky-100 font-mono text-2xs whitespace-nowrap">{e.code}</td>
                    <td className="px-1 py-1 border border-sky-100 min-w-72">
                      <input className={INPUT} value={e.name} onChange={ev => update(index, { name: ev.target.value })} />
                    </td>
                    <td className="px-1 py-1 border border-sky-100 min-w-48">
                      <input className={INPUT} value={e.address ?? ''} onChange={ev => update(index, { address: ev.target.value })} />
                    </td>
                    <td className="px-2 py-1 border border-sky-100 text-2xs text-slate-600 whitespace-nowrap">{e.account ?? ''}</td>
                    <td className="px-2 py-1 border border-sky-100 text-2xs text-slate-600 whitespace-nowrap">{e.phone ?? ''}</td>
                    <td className="px-2 py-1 border border-sky-100 text-2xs text-slate-600">{e.manager ?? ''}</td>
                    <td className="px-1 py-1 border border-sky-100 w-36">
                      <input
                        className={`${INPUT} font-mono ${e.pointCode ? 'bg-emerald-50' : ''}`}
                        list="unmatched-codes"
                        placeholder="VD: BI0121C"
                        value={e.pointCode ?? ''}
                        onChange={ev => update(index, { pointCode: ev.target.value.trim().toUpperCase() || undefined })}
                      />
                    </td>
                    <td className="px-2 py-1 border border-sky-100 whitespace-nowrap">
                      {e.pointCode ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-2xs">Đã liên kết</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-2xs">Chưa liên kết</span>
                      )}
                    </td>
                    <td className="px-2 py-1 border border-sky-100 text-right font-semibold">{n > 0 ? n : '—'}</td>
                    <td className="px-1 py-1 border border-sky-100 w-10 text-center">
                      <button onClick={() => remove(index)} className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer" title="Xóa">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={HEAD.length} className="px-3 py-8 text-center text-slate-500">Không có đơn vị nào khớp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="text-2xs text-slate-600">
          Hiển thị {rows.length}/{catalog.length} đơn vị · Mọi chỉnh sửa tự lưu vào trình duyệt và có trong file sao lưu JSON.
        </div>
      </div>
    </div>
  );
};
