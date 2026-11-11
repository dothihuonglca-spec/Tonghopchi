/**
 * Tiện ích xuất Excel dùng chung + tải biểu mẫu TRỐNG.
 *
 * Mọi tên bảng / tên cột lấy từ `src/data/templateNames.ts` (chép nguyên văn từ
 * file Excel của đơn vị). Không có dữ liệu mẫu, không có tên đơn vị điền sẵn.
 */

import * as XLSX from 'xlsx';
import { D11A, D11A_HT, d11aPeriodLine, d11aHtPeriodLine } from '../data/templateNames.ts';

/** 1234567 -> "1.234.567" */
export const formatCurrency = (val: number): string =>
  new Intl.NumberFormat('vi-VN').format(Math.round(val || 0));

/**
 * Tải file mẫu TRỐNG gồm 2 sheet đúng tên và đúng cột của file nguồn:
 *   - D11A    : 18 cột, tiêu đề 2 tầng
 *   - D11A_HT : 15 cột
 */
export const downloadStandardTemplate = (month?: number, year?: number) => {
  const now = new Date();
  const m = month ?? now.getMonth() + 1;
  const y = year ?? now.getFullYear();

  const wb = XLSX.utils.book_new();

  // --- Sheet D11A ---
  const d11aRows: unknown[][] = [
    [D11A.title],
    [d11aPeriodLine(m, y)],
    [...D11A.header1],
    [...D11A.header2],
    [...D11A.codes],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(d11aRows), D11A.sheet);

  // --- Sheet D11A_HT ---
  const htRows: unknown[][] = [
    [D11A_HT.title],
    [d11aHtPeriodLine(m, y)],
    [...D11A_HT.header],
    [...D11A_HT.codes],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(htRows), D11A_HT.sheet);

  XLSX.writeFile(wb, `Mau_Trong_${D11A.sheet}_va_${D11A_HT.sheet}.xlsx`);
};
