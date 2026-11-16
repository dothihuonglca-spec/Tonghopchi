/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef, useState } from 'react';
import { CatalogEntry, shortName } from '../data/catalog.ts';
import { X, Building2, Search, Upload, Download, Plus, Trash2, RotateCcw, FileJson } from 'lucide-react';

interface CatalogModalProps {
  isOpen: boolean;
  catalog: CatalogEntry[];
  /** Mã điểm thu có trong dữ liệu nhưng chưa liên kết với đơn vị nào. */
  unmatchedCodes: string[];
  notice: { ok: boolean; text: string } | null;
  onClose: () => void;
  onChange: (entries: CatalogEntry[]) => void;
  onImportExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportJson: () => void;
  onReset: () => void;
}

const INPUT =
  'w-full px-2 py-1 text-xs border border-sky-200 rounded-md bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-300';

export const CatalogModal: React.FC<CatalogModalProps> = ({
  isOpen,
  catalog,
  unmatchedCodes,
  notice,
  onClose,
  onChange,
  onImportExcel,
  onImportJson,
  onExportJson,
  onReset,
}) => {
  const [query, setQuery] = useState('');
  const [onlyLinked, setOnlyLinked] = useState(false);
  const excelRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog
      .map((e, index) => ({ e, index }))
      .filter(({ e }) => {
        if (onlyLinked && !e.pointCode) return false;
        if (!q) return true;
        return [e.code, e.name, e.address, e.pointCode, e.manager]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(q));
      });
  }, [catalog, query, onlyLinked]);

  if (!isOpen) return null;

  const update = (index: number, patch: Partial<CatalogEntry>) =>
    onChange(catalog.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  const remove = (index: number) => {
    const e = catalog[index];
    if (confirm(`Xóa đơn vị "${shortName(e.name)}" khỏi danh mục?`)) {
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
    setQuery(code);
  };

  const linked = catalog.filter(e => e.pointCode).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-sky-50 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl border border-sky-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 bg-[#0c567a] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Danh mục đơn vị</h2>
              <p className="text-2xs text-sky-100">
                {catalog.length} đơn vị · {linked} đã liên kết Mã điểm thu
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-sky-200 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-sky-200 bg-sky-100/70 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Tìm theo Mã ĐV, tên, địa chỉ, mã điểm thu..."
                className="w-full pl-8 pr-2 py-1.5 text-xs border border-sky-300 rounded-lg bg-white"
              />
            </div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" checked={onlyLinked} onChange={e => setOnlyLinked(e.target.checked)} />
              Chỉ đơn vị đã liên kết
            </label>
            <button onClick={() => excelRef.current?.click()} className="btn-cat bg-sky-600 text-white hover:bg-sky-700 border-sky-600">
              <Upload className="w-3.5 h-3.5" /> Nạp danh mục (Excel)
            </button>
            <button onClick={add} className="btn-cat bg-white text-slate-700 hover:bg-sky-100 border-sky-300">
              <Plus className="w-3.5 h-3.5" /> Thêm đơn vị
            </button>
            <button onClick={onExportJson} className="btn-cat bg-white text-slate-700 hover:bg-sky-100 border-sky-300">
              <Download className="w-3.5 h-3.5" /> Sao lưu danh mục (JSON)
            </button>
            <button onClick={() => jsonRef.current?.click()} className="btn-cat bg-white text-slate-700 hover:bg-sky-100 border-sky-300">
              <FileJson className="w-3.5 h-3.5" /> Khôi phục (JSON)
            </button>
            <button
              onClick={() => {
                if (confirm('Bỏ mọi chỉnh sửa và quay về danh mục đóng gói sẵn trong code?')) onReset();
              }}
              className="btn-cat bg-white text-rose-700 hover:bg-rose-50 border-rose-200"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Về danh mục gốc
            </button>
            <input ref={excelRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onImportExcel} />
            <input ref={jsonRef} type="file" accept=".json" className="hidden" onChange={onImportJson} />
          </div>

          {notice && (
            <div className={`text-xs font-semibold ${notice.ok ? 'text-emerald-700' : 'text-rose-600'}`}>
              {notice.text}
            </div>
          )}
          <div className="text-2xs text-slate-600">
            Nạp file mới: mã chưa có thì nối thêm, mã đã có thì lấy dữ liệu file mới đè lên.
          </div>
          {unmatchedCodes.length > 0 && (
            <div className="text-2xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
              <b>{unmatchedCodes.length} Mã điểm thu trong dữ liệu chưa có tên:</b>{' '}
              {unmatchedCodes.join(', ')}. Nhập mã đó vào cột "Mã điểm thu" của đơn vị tương ứng bên dưới.
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <datalist id="unmatched-codes">
            {unmatchedCodes.map(c => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-sky-200 text-slate-900">
              <tr>
                {['STT', 'Mã ĐV', 'Tên đơn vị', 'Địa chỉ', 'Chuyên quản', 'Mã điểm thu', ''].map(h => (
                  <th key={h} className="px-2 py-2 border border-sky-300 font-bold text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ e, index }, i) => (
                <tr key={e.code} className={i % 2 ? 'bg-sky-50' : 'bg-white'}>
                  <td className="px-2 py-1 border border-sky-100 text-center w-12">{e.seq ?? index + 1}</td>
                  <td className="px-2 py-1 border border-sky-100 font-mono text-2xs whitespace-nowrap">{e.code}</td>
                  <td className="px-1 py-1 border border-sky-100 min-w-72">
                    <input className={INPUT} value={e.name} onChange={ev => update(index, { name: ev.target.value })} />
                  </td>
                  <td className="px-1 py-1 border border-sky-100 min-w-48">
                    <input className={INPUT} value={e.address ?? ''} onChange={ev => update(index, { address: ev.target.value })} />
                  </td>
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
                  <td className="px-1 py-1 border border-sky-100 w-10 text-center">
                    <button onClick={() => remove(index)} className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer" title="Xóa">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                    Không có đơn vị nào khớp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-2.5 bg-sky-100/70 border-t border-sky-200 flex items-center justify-between">
          <span className="text-2xs text-slate-600">Mọi chỉnh sửa tự lưu vào trình duyệt và có trong file sao lưu JSON.</span>
          <button onClick={onClose} className="btn-cat bg-white text-slate-700 hover:bg-sky-100 border-sky-300">
            Đóng
          </button>
        </div>
      </div>
      <style>{`.btn-cat{display:inline-flex;align-items:center;gap:.375rem;padding:.375rem .75rem;border-radius:.5rem;border-width:1px;font-size:.75rem;font-weight:700;cursor:pointer;transition:background .15s}`}</style>
    </div>
  );
};
