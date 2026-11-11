/**
 * Luồng hoàn chỉnh: 2 file nguồn -> Book3.
 *
 *   const r = await buildBook3FromFiles(file1, file2);
 *   exportBook3({ rows: r.rows, totals: r.totals, month: r.month, year: r.year });
 *
 * Không có dữ liệu mặc định: kỳ báo cáo lấy từ chính file, tên đại lý lấy từ
 * `point-names.json`. Thiếu thì báo lỗi rõ ràng thay vì tự bịa số.
 */

import { Book3Row } from '../types/book3.ts';
import { loadPointNames, loadPointStt, PointNameMap } from '../data/pointNames.ts';
import {
  readFileToSheets, parseD11aSheet, parseHtSheet, pickSheet, SheetData
} from './book3Parser.ts';
import { buildBook3Rows } from './book3Builder.ts';
import { exportBook3 } from './book3Export.ts';

export interface Book3FromFilesResult {
  success: boolean;
  rows: Book3Row[];
  totals: Book3Row | null;
  warnings: string[];
  month: number;
  year: number;
  file1Count: number;
  file2Count: number;
  message: string;
}

export const buildBook3FromSheets = (
  s1: SheetData,
  s2: SheetData,
  pointNames: PointNameMap = {},
  sttMap: Record<string, number> = {}
): Book3FromFilesResult => {
  const b1 = parseD11aSheet(s1.rows);
  const b2 = parseHtSheet(s2.rows);

  if (b1.rows.length === 0) {
    return {
      success: false, rows: [], totals: null, warnings: [],
      month: 0, year: 0, file1Count: 0, file2Count: b2.rows.length,
      message: `Không đọc được dòng nào từ sheet D11A ("${s1.name}").`,
    };
  }

  const period = b2.period ?? b1.periods[0] ?? null;
  if (!period || !period.month || !period.year) {
    return {
      success: false, rows: [], totals: null, warnings: [],
      month: 0, year: 0,
      file1Count: b1.rows.length, file2Count: b2.rows.length,
      message: 'Không xác định được kỳ báo cáo (tháng/năm) từ 2 file. ' +
        'Kiểm tra dòng "Tháng ... năm ..." của file D11A_HT hoặc cột Ngày biên lai của file D11A.',
    };
  }

  const built = buildBook3Rows(b1.rows, b2.rows, { pointNames, sttMap });

  return {
    success: true,
    rows: built.rows,
    totals: built.totals,
    warnings: built.warnings,
    month: period.month,
    year: period.year,
    file1Count: b1.rows.length,
    file2Count: b2.rows.length,
    message:
      `Đã tổng hợp ${built.rows.length} điểm thu: ` +
      `${b1.rows.length} dòng phát sinh, ${b2.rows.length} dòng thu hồi.`,
  };
};

export const buildBook3FromFiles = async (
  file1: File,
  file2: File
): Promise<Book3FromFilesResult> => {
  const [sheets1, sheets2, pointNames, sttMap] = await Promise.all([
    readFileToSheets(file1),
    readFileToSheets(file2),
    loadPointNames(),
    loadPointStt(),
  ]);
  const s1 = pickSheet(sheets1, 'D11A');
  const s2 = pickSheet(sheets2, 'D11A_HT');
  if (!s1 || !s2) {
    return {
      success: false, rows: [], totals: null, warnings: [],
      month: 0, year: 0, file1Count: 0, file2Count: 0,
      message: 'Một trong hai file không có sheet dữ liệu.',
    };
  }
  return buildBook3FromSheets(s1, s2, pointNames, sttMap);
};

export interface Book3ExportMeta {
  agencyName?: string;
  departmentName?: string;
}

/** Tổng hợp và tải file Book3 ngay. */
export const exportBook3FromFiles = async (
  file1: File,
  file2: File,
  meta: Book3ExportMeta = {},
  fileName?: string
): Promise<Book3FromFilesResult> => {
  const res = await buildBook3FromFiles(file1, file2);
  if (res.success && res.totals) {
    await exportBook3({
      rows: res.rows,
      totals: res.totals,
      month: res.month,
      year: res.year,
      agencyName: meta.agencyName ?? '',
      departmentName: meta.departmentName ?? '',
      fileName,
    });
  }
  return res;
};
