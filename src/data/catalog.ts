/**
 * DANH MỤC ĐƠN VỊ (đại lý thu xã).
 *
 * Nguồn: file Excel "DANH SÁCH ĐƠN VỊ" (cột Mã ĐV, Tên đơn vị, Địa chỉ...).
 * Cách lưu — 2 lớp, cộng dồn theo mã:
 *   1. `public/danh-muc.json`  : danh mục đóng gói sẵn trong code (nạp mặc định).
 *   2. LocalStorage            : các lần bấm "Nạp danh mục" trong ứng dụng.
 *
 * Quy tắc gộp khi nạp file mới (theo Mã ĐV, không phân biệt hoa/thường):
 *   - Mã CHƯA có  → thêm nối vào cuối danh mục.
 *   - Mã ĐÃ có    → ghi đè bằng dữ liệu của file mới (ô trống trong file mới
 *                   không xóa dữ liệu cũ).
 *
 * Liên kết với Book1/Book2: hai file này chỉ có "Mã điểm thu" (ví dụ BI0121C),
 * không có Mã ĐV dài. Vì vậy mỗi dòng danh mục có thêm trường `pointCode`
 * (cột "Mã điểm thu" nếu file có). Có pointCode thì tổng hợp mới ra được tên.
 */
import * as XLSX from 'xlsx';

export interface CatalogEntry {
  code: string;        // Mã ĐV (khóa)
  name: string;        // Tên đơn vị (đầy đủ)
  address?: string;
  account?: string;
  phone?: string;
  manager?: string;
  taxCode?: string;
  seq?: number;        // STT trong file danh mục
  pointCode?: string;  // Mã điểm thu trong Book1/Book2 (BI0121C...)
}

export interface MergeResult {
  merged: CatalogEntry[];
  added: number;
  updated: number;
}

const STORAGE_KEY = 'bhxh_catalog_v1';
const norm = (v: unknown): string => String(v ?? '').trim();
const key = (code: string): string => code.trim().toUpperCase();

/** Bỏ tên công ty mẹ: "Cty CPĐT... Phúc Thịnh -  BHYT hộ gia đình xã A" → "BHYT hộ gia đình xã A". */
export const shortName = (full: string): string => {
  const clean = full.replace(/\s+/g, ' ').trim();
  const m = clean.match(/^(?:Công ty|Cty)[^-]*\s-\s+(.+)$/i);
  return (m ? m[1] : clean).trim();
};

/** Gộp: mã mới thì nối thêm, mã đã có thì lấy dữ liệu mới. */
export const mergeCatalog = (base: CatalogEntry[], incoming: CatalogEntry[]): MergeResult => {
  const map = new Map<string, CatalogEntry>();
  base.forEach(e => map.set(key(e.code), e));
  let added = 0;
  let updated = 0;
  incoming.forEach(e => {
    const k = key(e.code);
    const old = map.get(k);
    if (!old) {
      map.set(k, e);
      added++;
      return;
    }
    const next: CatalogEntry = { ...old };
    (Object.keys(e) as (keyof CatalogEntry)[]).forEach(f => {
      const v = e[f];
      if (v !== undefined && v !== '') (next as unknown as Record<string, unknown>)[f] = v;
    });
    map.set(k, next); // giữ nguyên vị trí cũ trong danh sách
    updated++;
  });
  return { merged: Array.from(map.values()), added, updated };
};

const readStored = (): CatalogEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readSeed = async (): Promise<CatalogEntry[]> => {
  try {
    const res = await fetch('/danh-muc.json', { cache: 'no-cache' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

/** Danh mục hiện hành = bản đóng gói sẵn + bản đã nạp trong ứng dụng (bản nạp đè lên). */
export const loadCatalog = async (): Promise<CatalogEntry[]> =>
  mergeCatalog(await readSeed(), readStored()).merged;

export const saveStoredCatalog = (entries: CatalogEntry[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error('Không lưu được danh mục đơn vị:', err);
  }
};

/** Đọc file Excel danh mục, tự tìm dòng tiêu đề (Mã ĐV / Tên đơn vị). */
export const parseCatalogFile = async (file: File): Promise<CatalogEntry[]> => {
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', raw: true });
  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], {
    header: 1,
    defval: '',
  });
  const find = (h: unknown[], re: RegExp) => h.findIndex(c => re.test(norm(c)));
  const headerIdx = rows.findIndex(
    (r: unknown[]) => find(r, /^mã\s*(đv|đơn vị)$/i) >= 0 && find(r, /^tên\s*đơn vị$/i) >= 0
  );
  if (headerIdx < 0) {
    throw new Error('Không thấy dòng tiêu đề "Mã ĐV" và "Tên đơn vị" trong file danh mục.');
  }
  const h = rows[headerIdx];
  const col = {
    seq: find(h, /^stt$/i),
    code: find(h, /^mã\s*(đv|đơn vị)$/i),
    name: find(h, /^tên\s*đơn vị$/i),
    address: find(h, /^địa chỉ$/i),
    account: find(h, /^tài khoản$/i),
    phone: find(h, /điện thoại/i),
    manager: find(h, /^chuyên quản$/i),
    tax: find(h, /^mã số thuế$/i),
    point: find(h, /^mã\s*điểm(\s*thu)?$/i),
  };
  const get = (r: unknown[], i: number) => (i >= 0 ? norm(r[i]) : '');
  const out: CatalogEntry[] = [];
  rows.slice(headerIdx + 1).forEach((r: unknown[]) => {
    const code = get(r, col.code);
    const name = get(r, col.name);
    if (!code || !name) return;
    const e: CatalogEntry = { code, name };
    const set = (f: keyof CatalogEntry, v: string) => {
      if (v) (e as unknown as Record<string, unknown>)[f] = v;
    };
    set('address', get(r, col.address));
    set('account', get(r, col.account));
    set('phone', get(r, col.phone));
    set('manager', get(r, col.manager));
    set('taxCode', get(r, col.tax));
    set('pointCode', get(r, col.point));
    const seq = Number(get(r, col.seq));
    if (Number.isFinite(seq) && seq > 0) e.seq = seq;
    out.push(e);
  });
  return out;
};

/** Mã điểm thu (BI...) → tên rút gọn, để Book3 hiển thị cột "Đại lý thu xã". */
export const catalogToPointNames = (entries: CatalogEntry[]): Record<string, string> => {
  const out: Record<string, string> = {};
  entries.forEach(e => {
    const n = shortName(e.name);
    if (e.pointCode) out[e.pointCode] = n;
    out[e.code] = n;
  });
  return out;
};
