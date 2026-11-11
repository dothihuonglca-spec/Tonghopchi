/**
 * Danh mục "Mã điểm thu → Đại lý thu xã" dùng cho cột C của Book3.
 *
 * KHÔNG gán cứng trong code. Tên được nạp theo thứ tự ưu tiên:
 *   1. `public/point-names.json`  (do đơn vị tự cập nhật)
 *   2. bản ghi trong LocalStorage (nếu người dùng sửa trong app)
 *
 * Mã nào chưa có tên thì hiển thị đúng mã đó, không bịa tên.
 */

const STORAGE_KEY = 'bhxh_point_names_v1';

export type PointNameMap = Record<string, string>;

const readLocal = (): PointNameMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const readFile = async (): Promise<PointNameMap> => {
  try {
    const res = await fetch('/point-names.json', { cache: 'no-cache' });
    if (!res.ok) return {};
    const data = await res.json();
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
};

export const loadPointNames = async (): Promise<PointNameMap> => ({
  ...(await readFile()),
  ...readLocal(),
});

export const savePointNames = (map: PointNameMap): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.error('Không lưu được danh mục điểm thu:', err);
  }
};

/** Tên hiển thị: có trong danh mục thì dùng, không thì trả về chính mã. */
export const pointName = (code: string, map: PointNameMap = {}): string =>
  map[code] ?? code;

/**
 * STT gốc của từng mã điểm thu trong Book3 (ví dụ 1, 2, 3, 14, 46).
 * Đọc từ `public/point-stt.json`; mã nào chưa có thì builder tự đánh số.
 */
export const loadPointStt = async (): Promise<Record<string, number>> => {
  try {
    const res = await fetch('/point-stt.json', { cache: 'no-cache' });
    if (!res.ok) return {};
    const data = await res.json();
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
};
