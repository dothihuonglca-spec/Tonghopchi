/**
 * Hộp thoại SỬA một dòng của bảng D11A hoặc D11A_HT.
 * Tên ô nhập lấy đúng tên cột trong `templateNames.ts`. Khi lưu, các cột tiền
 * thù lao được tính lại từ số tiền và tỷ lệ.
 */
import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { D11aRow } from '../types/index.ts';
import { D11A, D11A_HT } from '../data/templateNames.ts';
import { RATE_NEW, RATE_REG } from '../constants.ts';
import { parseDateInfo } from '../utils/fileParser.ts';

interface Props {
  record: D11aRow | null;
  onClose: () => void;
  onSave: (r: D11aRow) => void;
}

const INPUT = 'w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-300';

export const RecordEditModal: React.FC<Props> = ({ record, onClose, onSave }) => {
  const [f, setF] = useState<D11aRow | null>(record);
  if (!record || !f) return null;
  const isHt = f.source === 'D11A_HT';
  const set = <K extends keyof D11aRow>(k: K, v: D11aRow[K]) => setF(prev => (prev ? { ...prev, [k]: v } : prev));
  const num = (v: string) => Number(v.replace(/[^\d-]/g, '')) || 0;

  const field = (label: string, el: React.ReactNode) => (
    <div>
      <label className="block font-medium text-slate-700 mb-1">{label}</label>
      {el}
    </div>
  );
  const text = (label: string, k: keyof D11aRow) =>
    field(label, <input className={INPUT} value={String(f[k] ?? '')} onChange={e => set(k, e.target.value as never)} />);
  const money = (label: string, k: keyof D11aRow) =>
    field(label, <input className={`${INPUT} text-right`} inputMode="numeric" value={Number(f[k] ?? 0).toLocaleString('vi-VN')} onChange={e => set(k, num(e.target.value) as never)} />);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    let out: D11aRow = { ...f };
    if (isHt) {
      const rate = f.tyLeThuHoi || RATE_REG;
      const com = Math.round((f.hoanTraNTG ?? 0) * rate);
      out = { ...out, tyLeThuHoi: rate, totalCommission: com };
    } else {
      const d = parseDateInfo(f.receiptDate);
      const nr = f.newRevenue > 0 ? f.newRate || RATE_NEW : f.newRate;
      const rr = f.regRevenue > 0 ? f.regRate || RATE_REG : f.regRate;
      const nc = Math.round(f.newRevenue * nr);
      const rc = Math.round(f.regRevenue * rr);
      out = {
        ...out,
        newRate: nr, regRate: rr, newCommission: nc, regCommission: rc,
        totalRevenue: f.newRevenue + f.regRevenue, totalCommission: nc + rc,
        ...(d.month ? { month: d.month, year: d.year, quarter: d.quarter } : {}),
      };
    }
    onSave(out);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-auto shadow-2xl border border-sky-200">
        <div className="px-5 py-3 bg-sky-100 border-b border-sky-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Sửa dòng — sheet {isHt ? D11A_HT.sheet : D11A.sheet}</h3>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            {text('Mã điểm thu', 'pointCode')}
            {text('Họ và tên nhân viên thu', 'staffName')}
            {text('Mã số nhân viên thu', 'staffId')}
            {text('Họ và tên người tham gia', 'participantName')}
            {text('Mã số BHXH', 'bhxhCode')}
            {isHt ? (
              <>
                {money('Mức đóng', 'mucDong')}
                {text('Số tháng giảm', 'soThangGiam')}
                {money('Số tiền hoàn trả NTG', 'hoanTraNTG')}
                {field('Tỷ lệ % thù lao phải thu hồi',
                  <select className={INPUT} value={f.tyLeThuHoi ?? RATE_REG} onChange={e => set('tyLeThuHoi', Number(e.target.value))}>
                    <option value={RATE_NEW}>9,8% (tăng mới)</option>
                    <option value={RATE_REG}>4,2% (tái tục)</option>
                  </select>)}
                {text('Đợt phát sinh', 'dotPhatSinh')}
                {text('Đợt phát sinh giảm', 'dotPhatSinhGiam')}
                {text('Đã hoàn trả', 'daHoanTra')}
              </>
            ) : (
              <>
                {text('Số biên lai', 'receiptNumber')}
                {text('Ngày biên lai', 'receiptDate')}
                {text('Phương thức đóng', 'paymentMethod')}
                {money('Đối tượng khai thác thu mới — Số tiền NTG đóng', 'newRevenue')}
                {money('Đối tượng khai thác thu thường kỳ — Số tiền NTG đóng', 'regRevenue')}
              </>
            )}
          </div>
          {text('Ghi chú', 'notes')}
          <p className="text-2xs text-slate-500">
            Các cột tiền thù lao được tính lại tự động khi lưu (tỷ lệ 9,8% tăng mới, 4,2% thường kỳ/tái tục).
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-700 cursor-pointer">Hủy</button>
            <button type="submit" className="px-3 py-1.5 rounded-lg bg-sky-600 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"><Save className="w-3.5 h-3.5" /> Lưu</button>
          </div>
        </form>
      </div>
    </div>
  );
};
