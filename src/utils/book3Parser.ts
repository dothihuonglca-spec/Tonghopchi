/**
 * Đọc 2 file nguồn của BHXH để ra số liệu Book3.
 *
 *   File 1 - D11A     : BẢNG CHI TIẾT TRÍCH THÙ LAO (18 cột, có số biên lai)
 *   File 2 - D11A_HT  : BẢNG CHI TIẾT SỐ TIỀN THÙ LAO ĐÃ CHI PHẢI THU HỒI (15 cột)
 *
 * Khác với `fileParser.ts` cũ, ở đây mỗi file có bộ cột riêng và cột được dò
 * **theo tên tiêu đề** (không dùng vị trí cố định), nên chịu được việc BHXH
 * đổi thứ tự cột hoặc thêm cột.
 */

import * as XLSX from 'xlsx';
import {
  D11aHtRow, D11aRowLite, HtKind, RATE_NEW, RATE_REG
} from '../types/book3.ts';

// ---------------------------------------------------------------------------
// Chuẩn hoá chuỗi / số
// ---------------------------------------------------------------------------

/** Bỏ dấu tiếng Việt, gộp khoảng trắng, lowercase. */
export const norm = (s: unknown): string =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, d => (d === 'đ' ? 'd' : 'D'))
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** "2,340,000" -> 2340000 ; "4.2%" -> 4.2 ; 956340 -> 956340 */
export const toNumber = (v: unknown): number => {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const cleaned = String(v).replace(/[,\s₫đVND"']/gi, '').trim();
  const m = cleaned.match(/-?\d+(\.\d+)?([eE][-+]?\d+)?/);
  return m ? parseFloat(m[0]) : 0;
};

/** "4.2%" -> 0.042 ; 4.2 -> 0.042 ; 0.042 -> 0.042 */
export const toRate = (v: unknown): number => {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v > 1 ? v / 100 : v;
  const n = toNumber(String(v).replace(/[%,\s"']/g, ''));
  return n > 1 ? n / 100 : n;
};

/** "04/09/2026" | "2026-09-04" | serial Excel -> {day, month, year} */
export const toDateParts = (v: unknown): { day: number; month: number; year: number } | null => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number' && v > 30000 && v < 60000) {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return { day: d.getUTCDate(), month: d.getUTCMonth() + 1, year: d.getUTCFullYear() };
  }
  const s = String(v).trim();
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmy) return { day: +dmy[1], month: +dmy[2], year: +dmy[3] };
  const ymd = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymd) return { day: +ymd[3], month: +ymd[2], year: +ymd[1] };
  return null;
};

// ---------------------------------------------------------------------------
// Dò cấu trúc bảng
// ---------------------------------------------------------------------------

type LayoutKind = 'D11A' | 'D11A_HT';

interface Layout {
  kind: LayoutKind;
  headerRow: number;   // 0-based
  dataStart: number;   // 0-based
}

/**
 * Tìm dòng tiêu đề thật: phải có >= 2 trong 3 "cột neo" và phải phân biệt được
 * D11A (có số biên lai) với D11A_HT (có mức đóng / số tháng giảm).
 * Dòng tiêu đề lớn ("BẢNG CHI TIẾT TRÍCH THÙ LAO...") sẽ bị loại vì không có
 * đủ các cột neo.
 */
export const detectLayout = (rows: unknown[][]): Layout => {
  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const cells = (rows[i] || []).map(norm);
    const has = (k: string) => cells.some(c => c.includes(k));
    const anchors = ['ma diem thu', 'ho va ten nguoi tham gia', 'ma so bhxh'].filter(has).length;
    if (anchors < 2) continue;

    const kind: LayoutKind =
      has('muc dong') || has('so thang giam') || has('hoan tra') ? 'D11A_HT'
        : has('so bien lai') || has('ngay bien lai') ? 'D11A'
          : (has('thu lao') ? 'D11A_HT' : 'D11A');

    return { kind, headerRow: i, dataStart: findDataStart(rows, i) };
  }
  return { kind: 'D11A', headerRow: -1, dataStart: 0 };
};

/**
 * Sau dòng tiêu đề thường có 1 dòng mã cột (A, B, C... 1, 2, 3...).
 * Bỏ qua dòng đó để không đọc nó thành dữ liệu.
 */
const findDataStart = (rows: unknown[][], headerRow: number): number => {
  for (let i = headerRow + 1; i <= Math.min(rows.length - 1, headerRow + 4); i++) {
    const cells = (rows[i] || []).map(c => String(c ?? '').trim());
    const codeLike = cells.filter(c => /^[A-Z]{1,2}$/.test(c) || /^\d{1,2}(=\S+)?$/.test(c)).length;
    if (codeLike >= 5) return i + 1;
  }
  return headerRow + 1;
};

/** Dòng tổng nhóm "I | BHYT Hộ gia đình" — không phải dữ liệu. */
const isGroupHeaderRow = (row: unknown[]): boolean => {
  const a = String(row?.[0] ?? '').trim();
  const b = String(row?.[1] ?? '').trim();
  const e = String(row?.[4] ?? '').trim();
  return /^(I|II|III|IV|V|VI)$/i.test(a) && b.length > 0 && e === '';
};

/** Mã điểm thu thật: >= 5 ký tự chữ/số (loại "BI", "B", "...", rỗng). */
const isRealPointCode = (code: string): boolean => /^[A-Za-z0-9]{5,}$/.test(code);

/** Tên đài / mã điểm thu nằm ở cột nào (dò theo tiêu đề). */
const findCol = (header: unknown[], ...keys: string[]): number => {
  const cells = header.map(norm);
  for (const k of keys) {
    const i = cells.findIndex(c => c.includes(k));
    if (i >= 0) return i;
  }
  return -1;
};

// ---------------------------------------------------------------------------
// File 1: D11A
// ---------------------------------------------------------------------------

export interface D11aParseResult {
  rows: D11aRowLite[];
  skipped: number;
  periods: { month: number; year: number; count: number }[];
}

export const parseD11aSheet = (rows: unknown[][]): D11aParseResult => {
  const layout = detectLayout(rows);
  if (layout.headerRow < 0) return { rows: [], skipped: 0, periods: [] };

  const header = rows[layout.headerRow];
  const cPoint = findCol(header, 'ma diem thu');
  const cStaffName = findCol(header, 'ho va ten nhan vien thu', 'nhan vien thu');
  const cStaffId = findCol(header, 'ma so nhan vien thu', 'ma nhan vien');
  const cParticipant = findCol(header, 'ho va ten nguoi tham gia', 'nguoi tham gia');
  const cBhxh = findCol(header, 'ma so bhxh', 'bhxh');
  const cReceipt = findCol(header, 'so bien lai');
  const cReceiptDate = findCol(header, 'ngay bien lai');
  const cNew = findCol(header, 'thu moi');
  const cReg = findCol(header, 'thuong ky');
  const cTotal = findCol(header, 'tong so thu');
  const cComm = findCol(header, 'thu lao to chuc', 'thu lao');

  const out: D11aRowLite[] = [];
  let skipped = 0;
  const periodMap = new Map<string, { month: number; year: number; count: number }>();

  for (let i = layout.dataStart; i < rows.length; i++) {
    const row = rows[i] || [];
    if (!row.length || isGroupHeaderRow(row)) continue;

    const pointCode = String(row[cPoint] ?? '').trim();
    if (!isRealPointCode(pointCode)) { if (pointCode || row[cParticipant]) skipped++; continue; }

    const date = toDateParts(row[cReceiptDate]);
    const newRevenue = toNumber(row[cNew]);
    const newRateRaw = toRate(row[cNew + 1]);
    const regRevenue = toNumber(row[cReg]);
    const regRateRaw = toRate(row[cReg + 1]);

    const rec: D11aRowLite = {
      stt: toNumber(row[0]) || out.length + 1,
      pointCode,
      staffName: String(row[cStaffName] ?? '').trim(),
      staffId: String(row[cStaffId] ?? '').trim(),
      participantName: String(row[cParticipant] ?? '').trim(),
      bhxhCode: String(row[cBhxh] ?? '').trim(),
      newRevenue,
      newRate: newRateRaw || (newRevenue > 0 ? RATE_NEW : 0),
      regRevenue,
      regRate: regRateRaw || (regRevenue > 0 ? RATE_REG : 0),
      totalRevenue: toNumber(row[cTotal]) || newRevenue + regRevenue,
      totalCommission: toNumber(row[cComm]),
      month: date?.month ?? 0,
      year: date?.year ?? 0,
    };
    out.push(rec);

    if (date) {
      const key = `${date.month}_${date.year}`;
      const p = periodMap.get(key) || { month: date.month, year: date.year, count: 0 };
      p.count++;
      periodMap.set(key, p);
    }
  }

  return { rows: out, skipped, periods: Array.from(periodMap.values()) };
};

// ---------------------------------------------------------------------------
// File 2: D11A_HT
// ---------------------------------------------------------------------------

export interface HtParseResult {
  rows: D11aHtRow[];
  skipped: number;
  period: { month: number; year: number } | null;
}

/** "Tháng 09 năm 2026" (dòng 4 của file HT) -> {month: 9, year: 2026} */
const parseSheetPeriod = (rows: unknown[][]): { month: number; year: number } | null => {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const text = norm(rows[i]?.[0]);
    const m = text.match(/thang\s*(\d{1,2})\s*nam\s*(\d{4})/);
    if (m) return { month: +m[1], year: +m[2] };
  }
  return null;
};

export const parseHtSheet = (rows: unknown[][]): HtParseResult => {
  const layout = detectLayout(rows);
  if (layout.headerRow < 0) return { rows: [], skipped: 0, period: parseSheetPeriod(rows) };

  const header = rows[layout.headerRow];
  const cPoint = findCol(header, 'ma diem thu');
  const cStaffName = findCol(header, 'ho va ten nhan vien thu', 'nhan vien thu');
  const cStaffId = findCol(header, 'ma so nhan vien thu', 'ma nhan vien');
  const cParticipant = findCol(header, 'ho va ten nguoi tham gia', 'nguoi tham gia');
  const cBhxh = findCol(header, 'ma so bhxh', 'bhxh');
  const cMucDong = findCol(header, 'muc dong');
  const cThangGiam = findCol(header, 'so thang giam');
  const cHoanTra = findCol(header, 'hoan tra');
  const cTyLe = findCol(header, 'ty le');
  const cThuHoi = findCol(header, 'thu lao phai thu hoi', 'thu hoi');
  const cGhiChu = findCol(header, 'ghi chu');
  const cDotGiam = findCol(header, 'dot phat sinh giam');
  const cDot = findCol(header, 'dot phat sinh');
  const cDaHoan = findCol(header, 'da hoan tra');

  const period = parseSheetPeriod(rows);
  const out: D11aHtRow[] = [];
  let skipped = 0;

  for (let i = layout.dataStart; i < rows.length; i++) {
    const row = rows[i] || [];
    if (!row.length || isGroupHeaderRow(row)) continue;

    const pointCode = String(row[cPoint] ?? '').trim();
    if (!isRealPointCode(pointCode)) { if (pointCode || row[cParticipant]) skipped++; continue; }

    const tyLe = toRate(row[cTyLe]);
    const kind: HtKind = Math.abs(tyLe - RATE_NEW) < 1e-6 ? 'new' : 'reg';

    out.push({
      stt: toNumber(row[0]) || out.length + 1,
      pointCode,
      staffName: String(row[cStaffName] ?? '').trim(),
      staffId: String(row[cStaffId] ?? '').trim(),
      participantName: String(row[cParticipant] ?? '').trim(),
      bhxhCode: String(row[cBhxh] ?? '').trim(),
      mucDong: toNumber(row[cMucDong]),
      soThangGiam: toNumber(row[cThangGiam]),
      hoanTraNTG: toNumber(row[cHoanTra]),
      tyLeThuHoi: tyLe || (kind === 'new' ? RATE_NEW : RATE_REG),
      thuLaoThuHoi: toNumber(row[cThuHoi]),
      ghiChu: String(row[cGhiChu] ?? '').trim(),
      dotPhatSinh: String(row[cDot] ?? '').trim(),
      dotPhatSinhGiam: String(row[cDotGiam] ?? '').trim(),
      daHoanTra: String(row[cDaHoan] ?? '').trim(),
      kind,
      month: period?.month ?? 0,
      year: period?.year ?? 0,
    });
  }

  return { rows: out, skipped, period };
};

// ---------------------------------------------------------------------------
// Đọc file / workbook
// ---------------------------------------------------------------------------

export interface SheetData { name: string; rows: unknown[][]; }

export const workbookToSheets = (buffer: ArrayBuffer): SheetData[] => {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false, raw: true });
  return wb.SheetNames.map(name => ({
    name,
    rows: XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, defval: '' }),
  }));
};

export const readFileToSheets = async (file: File): Promise<SheetData[]> =>
  workbookToSheets(await file.arrayBuffer());

/** Chọn sheet phù hợp: ưu tiên tên chứa "HT" cho file 2, còn lại lấy sheet đầu có dữ liệu. */
export const pickSheet = (sheets: SheetData[], prefer: 'D11A' | 'D11A_HT'): SheetData | null => {
  const wantHt = prefer === 'D11A_HT';
  const byName = sheets.find(s => {
    const n = norm(s.name).replace(/[^a-z0-9]/g, '');
    return wantHt ? n.includes('ht') : !n.includes('ht');
  });
  if (byName) return byName;
  // fallback: dò theo nội dung
  for (const s of sheets) {
    if (detectLayout(s.rows).kind === prefer) return s;
  }
  return sheets[0] ?? null;
};
