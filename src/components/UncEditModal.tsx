/** Hộp thoại THÊM MỚI / SỬA một dòng UNC — ô nhập đúng tên cột của mẫu UNC. */
import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { UncRow } from '../types/unc.ts';
import { withPeriod } from '../utils/unc.ts';
import { parseDateInfo } from '../utils/fileParser.ts';

interface Props {
  /** null = đóng; có `id` rỗng = thêm mới. */
  row: UncRow | null;
  onClose: () => void;
  onSave: (r: UncRow) => void;
}

const INPUT = 'w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-300';

export const UncEditModal: React.FC<Props> = ({ row, onClose, onSave }) => {
  const [f, setF] = useState<UncRow | null>(row);
  if (!row || !f) return null;
  const isNew = !row.id;
  const set = <K extends keyof UncRow>(k: K, v: UncRow[K]) => setF(p => (p ? { ...p, [k]: v } : p));
  const t = (label: string, k: keyof UncRow, ph?: string) => (
    <div>
      <label className="block font-medium text-slate-700 mb-1">{label}</label>
      <input className={INPUT} placeholder={ph} value={String(f[k] ?? '')} onChange={e => set(k, e.target.value as never)} />
    </div>
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.pointCode.trim()) return alert('Vui lòng nhập Mã đơn vị.');
    if (!f.amount) return alert('Vui lòng nhập Tiền VND.');
    const date = parseDateInfo(f.date).dateStr || f.date;
    const voucherDate = parseDateInfo(f.voucherDate).dateStr || f.voucherDate;
    if (!parseDateInfo(voucherDate || date).month) return alert('Ngày phiếu (hoặc Ngày) phải có dạng dd/mm/yyyy.');
    onSave(withPeriod({ ...f, id: f.id || `unc_${Date.now()}`, date, voucherDate, pointCode: f.pointCode.trim().toUpperCase() }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-auto shadow-2xl border border-sky-200">
        <div className="px-5 py-3 bg-sky-100 border-b border-sky-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">{isNew ? 'Thêm mới dòng UNC' : 'Sửa dòng UNC'}</h3>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            {t('Ngày', 'date', 'dd/mm/yyyy')}
            {t('Ngày phiếu', 'voucherDate', 'dd/mm/yyyy')}
            {t('Số phiếu', 'voucherNo')}
            {t('Mã NC', 'ncCode')}
            {t('Quý', 'quarter')}
            {t('Mã đơn vị', 'pointCode', 'VD: BI0167D')}
          </div>
          {t('Tên đơn vị', 'unitName')}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Tiền VND</label>
            <input className={`${INPUT} text-right`} inputMode="numeric" value={f.amount ? f.amount.toLocaleString('vi-VN') : ''}
              onChange={e => set('amount', Number(e.target.value.replace(/[^\d-]/g, '')) || 0)} />
          </div>
          {t('Nội dung', 'content')}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-700 cursor-pointer">Hủy</button>
            <button type="submit" className="px-3 py-1.5 rounded-lg bg-sky-600 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"><Save className="w-3.5 h-3.5" /> Lưu</button>
          </div>
        </form>
      </div>
    </div>
  );
};
