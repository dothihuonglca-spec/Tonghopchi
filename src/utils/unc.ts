/**
 * Đọc / tạo file mẫu UNC, gộp dữ liệu, lọc theo kỳ và nhóm theo Mã đơn vị.
 */
import * as XLSX from 'xlsx';
import { UncRow } from '../types/unc.ts';
import { FilterState } from '../types/index.ts';
import { UNC } from '../data/templateNames.ts';
import { cleanText, parseDateInfo, parseNumber } from './fileParser.ts';

const norm = (v: unknown): string => String(v ?? '').trim();
const fold = (v: unknown): string =>
  norm(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ');

export const normPoint = (c: string): string => c.trim().toUpperCase();

/** Khóa nhận diện một dòng UNC: Số phiếu + Mã đơn vị + Ngày phiếu. */
export const uncKey = (r: Pick<UncRow, 'voucherNo' | 'pointCode' | 'voucherDate' | 'date'>): string =>
  `${r.voucherNo.trim()}|${normPoint(r.pointCode)}|${r.voucherDate || r.date}`;

/** Ngày phiếu → tháng/năm (nếu thiếu thì dùng cột Ngày). */
export const withPeriod = (r: Omit<UncRow, 'month' | 'year'>): UncRow => {
  const v = parseDateInfo(r.voucherDate);
  const d = v.month ? v : parseDateInfo(r.date);
  return { ...r, month: d.month, year: d.year };
};

/** Đọc file UNC theo đúng tên cột của mẫu. */
export const parseUncFile = async (file: File): Promise<UncRow[]> => {
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', raw: true });
  const ws = wb.Sheets[wb.SheetNames.find(n => fold(n) === 'unc') ?? wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' });

  const idx = (h: unknown[], name: string) => h.findIndex(c => fold(c) === fold(name));
  const headerIdx = rows.findIndex(
    (r: unknown[]) => idx(r, 'Mã đơn vị') >= 0 && idx(r, 'Tiền VND') >= 0
  );
  if (headerIdx < 0) {
    throw new Error('Không thấy dòng tiêu đề có cột "Mã đơn vị" và "Tiền VND". Hãy dùng file theo mẫu UNC.');
  }
  const h = rows[headerIdx];
  const c = {
    stt: idx(h, 'STT'), date: idx(h, 'Ngày'), vDate: idx(h, 'Ngày phiếu'), no: idx(h, 'Số phiếu'),
    nc: idx(h, 'Mã NC'), q: idx(h, 'Quý'), code: idx(h, 'Mã đơn vị'), name: idx(h, 'Tên đơn vị'),
    amt: idx(h, 'Tiền VND'), content: idx(h, 'Nội dung'),
  };
  const get = (r: unknown[], i: number) => (i >= 0 ? r[i] : '');

  const out: UncRow[] = [];
  rows.slice(headerIdx + 1).forEach((r: unknown[], n: number) => {
    const code = cleanText(get(r, c.code));
    const amount = parseNumber(get(r, c.amt));
    if (!code || !amount) return; // bỏ dòng trống / dòng cộng
    const date = parseDateInfo(get(r, c.date)).dateStr || cleanText(get(r, c.date));
    const voucherDate = parseDateInfo(get(r, c.vDate)).dateStr || cleanText(get(r, c.vDate));
    out.push(
      withPeriod({
        id: `unc_${Date.now()}_${n}`,
        stt: Number(get(r, c.stt)) || out.length + 1,
        date,
        voucherDate,
        voucherNo: cleanText(get(r, c.no)),
        ncCode: cleanText(get(r, c.nc)),
        quarter: cleanText(get(r, c.q)),
        pointCode: code,
        unitName: cleanText(get(r, c.name)),
        amount,
        content: cleanText(get(r, c.content)),
      })
    );
  });
  return out;
};

/** Gộp: dòng chưa có thì thêm, dòng đã có (cùng khóa) thì lấy dòng mới. */
export const mergeUnc = (base: UncRow[], incoming: UncRow[]) => {
  const map = new Map<string, UncRow>();
  base.forEach(r => map.set(uncKey(r), r));
  let added = 0;
  let updated = 0;
  incoming.forEach(r => {
    const k = uncKey(r);
    const old = map.get(k);
    if (old) {
      map.set(k, { ...r, id: old.id });
      updated++;
    } else {
      map.set(k, r);
      added++;
    }
  });
  return { merged: Array.from(map.values()), added, updated };
};

/** Một (tháng, năm) có nằm trong kỳ đang chọn ở bộ lọc không. */
export const inPeriod = (month: number, year: number, f: FilterState): boolean => {
  switch (f.periodType) {
    case 'month': return year === f.year && month === f.month;
    case 'quarter': return year === f.year && Math.ceil(month / 3) === f.quarter;
    case 'year': return year === f.year;
    default: return true;
  }
};

/** Lọc UNC theo đúng kỳ đang chọn ở bộ lọc (tháng / quý / năm / tất cả). */
export const filterUncByPeriod = (rows: UncRow[], f: FilterState): UncRow[] =>
  rows.filter(r => inPeriod(r.month, r.year, f));

export interface UncGroup {
  pointCode: string;
  unitName: string;
  count: number;
  total: number;
}

/** Tổng cột Tiền VND theo nhóm Mã đơn vị. */
export const groupUncByUnit = (rows: UncRow[]): UncGroup[] => {
  const map = new Map<string, UncGroup>();
  rows.forEach(r => {
    const k = normPoint(r.pointCode);
    const g = map.get(k) ?? { pointCode: k, unitName: r.unitName, count: 0, total: 0 };
    g.count += 1;
    g.total += r.amount;
    if (!g.unitName && r.unitName) g.unitName = r.unitName;
    map.set(k, g);
  });
  return Array.from(map.values()).sort((a, b) => a.pointCode.localeCompare(b.pointCode));
};

export const uncTotalsByCode = (rows: UncRow[]): Record<string, number> => {
  const out: Record<string, number> = {};
  groupUncByUnit(rows).forEach(g => { out[g.pointCode] = g.total; });
  return out;
};

/** Tải file mẫu UNC (chỉ có dòng tiêu đề đúng tên cột). */
export const downloadUncTemplate = () => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([[...UNC.header]]);
  ws['!cols'] = [6, 12, 12, 10, 8, 10, 14, 50, 16, 40].map(wch => ({ wch }));
  XLSX.utils.book_append_sheet(wb, ws, UNC.sheet);
  XLSX.writeFile(wb, 'Mau_UNC.xlsx');
};

/** Chênh lệch so sánh UNC của một dòng Book3: (Tổng số thu − thoái tăng mới − thoái tái tục) − UNC. */
export const uncCompare = (
  r: { tongThu: number; thoaiTangMoiTien: number; thoaiTaiTucTien: number },
  uncAmount: number
) => {
  const expected = r.tongThu - r.thoaiTangMoiTien - r.thoaiTaiTucTien;
  return { expected, unc: uncAmount, diff: expected - uncAmount };
};
