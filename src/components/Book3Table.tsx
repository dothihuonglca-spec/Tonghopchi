/**
 * Bảng Book3 — hiển thị ĐÚNG biểu mẫu gốc:
 *   tiêu đề 4 tầng (dòng 6-9) + dòng mã cột (dòng 10), 16 cột A..P.
 * Tên cột lấy nguyên văn từ `templateNames.ts` (chép từ file Excel của đơn vị).
 */

import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Book3Row } from '../types/book3.ts';
import { formatCurrency } from '../utils/excelExport.ts';
import { BOOK3 } from '../data/templateNames.ts';

interface Book3TableProps {
  rows: Book3Row[];
  totals: Book3Row;
  month: number;
  year: number;
  agencyName?: string;
  departmentName?: string;
}

const TH = 'px-1.5 py-1 border border-slate-400 text-center align-middle font-bold';
const TD = 'px-1.5 py-1 border border-slate-300';

export const Book3Table: React.FC<Book3TableProps> = ({
  rows,
  totals,
  month,
  year,
  agencyName,
  departmentName
}) => {
  const cell = (v: number | string, money = false) => (
    <td className={`${TD} ${money ? 'text-right' : 'text-center'}`}>
      {money ? formatCurrency(Number(v)) : v}
    </td>
  );

  return (
    <div className="bg-sky-50 rounded-xl border border-sky-200 overflow-hidden">
      {/* Khối tiêu đề đúng biểu mẫu */}
      <div className="px-3 pt-2.5 pb-2 border-b border-sky-200 bg-sky-100/70">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-2xs font-bold uppercase text-slate-700">{agencyName || ''}</div>
            <div className="text-2xs text-slate-600">{departmentName || ''}</div>
            <div className="text-xs font-black uppercase text-slate-900 mt-0.5">
              {BOOK3.title(month, year)}
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-3xs font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white shrink-0">
            <FileSpreadsheet className="w-3 h-3" /> Sheet {BOOK3.sheetName(month, year)}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-2xs border-collapse">
          <thead className="bg-sky-100 text-slate-900">
            {/* dòng 6 — tầng 1 */}
            <tr>
              <th className={TH} rowSpan={4}>STT</th>
              <th className={TH} rowSpan={4}>Mã đơn vị</th>
              <th className={TH} rowSpan={4}>Đại lý thu xã</th>
              <th className={TH} colSpan={3}>Người tham gia</th>
              <th className={TH} colSpan={3}>Số thu</th>
              <th className={TH} colSpan={4}>Số thoái thu</th>
              <th className={TH} colSpan={3}>
                Số phải chi Thù lao chi cho tổ chức làm đại lý thu
              </th>
            </tr>
            {/* dòng 7 — tầng 2 */}
            <tr>
              <th className={TH} rowSpan={3}>Tổng số</th>
              <th className={TH} rowSpan={3}>Tăng mới</th>
              <th className={TH} rowSpan={3}>Tái tục</th>
              <th className={TH} rowSpan={3}>Tổng số</th>
              <th className={TH} colSpan={2}>Trong đó</th>
              <th className={TH} colSpan={4}>{BOOK3.thangLabel(month, year)}</th>
              <th className={TH} rowSpan={3}>Tổng số</th>
              <th className={TH} colSpan={2}>Trong đó</th>
            </tr>
            {/* dòng 8 — tầng 3 */}
            <tr>
              <th className={TH} rowSpan={2}>Tăng mới</th>
              <th className={TH} rowSpan={2}>Tái tục</th>
              <th className={TH} colSpan={2}>Tăng mới</th>
              <th className={TH} colSpan={2}>Tái tục</th>
              <th className={TH} rowSpan={2}>Tăng mới</th>
              <th className={TH} rowSpan={2}>Tái tục</th>
            </tr>
            {/* dòng 9 — tầng 4 */}
            <tr>
              <th className={TH}>Người</th>
              <th className={TH}>Tiền</th>
              <th className={TH}>Người</th>
              <th className={TH}>Tiền</th>
            </tr>
            {/* dòng 10 — mã cột */}
            <tr className="bg-sky-200 font-mono text-3xs">
              {BOOK3.codes.map((c, i) => (
                <th key={i} className="px-1 py-0.5 border border-slate-400">{c}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={16} className="px-3 py-6 text-center text-slate-500">
                  Không có dữ liệu trong kỳ này.
                </td>
              </tr>
            )}
            {rows.map((r, idx) => (
              <tr key={r.pointCode} className={idx % 2 ? 'bg-sky-50' : 'bg-white'}>
                {cell(r.stt)}
                {cell(r.pointCode)}
                <td className={`${TD} text-left`}>{r.daiLyThu}</td>
                {cell(r.tongNguoi)}
                {cell(r.tangMoiNguoi)}
                {cell(r.taiTucNguoi)}
                {cell(r.tongThu, true)}
                {cell(r.tangMoiThu, true)}
                {cell(r.taiTucThu, true)}
                {cell(r.thoaiTangMoiNguoi)}
                {cell(r.thoaiTangMoiTien, true)}
                {cell(r.thoaiTaiTucNguoi)}
                {cell(r.thoaiTaiTucTien, true)}
                {cell(r.tongPhaiChi, true)}
                {cell(r.phaiChiTangMoi, true)}
                {cell(r.phaiChiTaiTuc, true)}
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="bg-sky-200 font-black text-slate-900">
              <td className={`${TD} text-center uppercase`} colSpan={3}>TỔNG</td>
              {cell(totals.tongNguoi)}
              {cell(totals.tangMoiNguoi)}
              {cell(totals.taiTucNguoi)}
              {cell(totals.tongThu, true)}
              {cell(totals.tangMoiThu, true)}
              {cell(totals.taiTucThu, true)}
              {cell(totals.thoaiTangMoiNguoi)}
              {cell(totals.thoaiTangMoiTien, true)}
              {cell(totals.thoaiTaiTucNguoi)}
              {cell(totals.thoaiTaiTucTien, true)}
              {cell(totals.tongPhaiChi, true)}
              {cell(totals.phaiChiTangMoi, true)}
              {cell(totals.phaiChiTaiTuc, true)}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
