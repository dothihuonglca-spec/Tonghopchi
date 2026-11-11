/**
 * Xuất file Excel đúng mẫu Book3:
 *   "TỔNG HỢP SỐ PHẢI CHI HOA HỒNG ĐẠI LÝ THU BHYT HỘ GIA ĐÌNH"
 *
 * Cấu trúc mẫu (sheet `TH HOA HONG THANG 9-2026`):
 *   dòng 1-2  : tên đơn vị, bộ phận
 *   dòng 4    : tiêu đề báo cáo
 *   dòng 6-9  : tiêu đề 4 tầng (16 cột A..P)
 *   dòng 10   : mã cột (A, B, 1..13)
 *   dòng 11+  : dữ liệu theo Mã điểm thu
 *   dòng cuối : TỔNG
 */

import * as XLSX from 'xlsx';
import { Book3Row } from '../types/book3.ts';

export interface Book3ExportOptions {
  rows: Book3Row[];
  totals: Book3Row;
  month: number;
  year: number;
  /** Tên đơn vị ở dòng 1 (mặc định theo mẫu). */
  agencyName?: string;
  departmentName?: string;
  fileName?: string;
  /** Trả về workbook thay vì ghi file (dùng cho test). */
  asWorkbook?: boolean;
}

const MONEY_FMT = '#,##0';

export const book3SheetTitle = (month: number, year: number): string =>
  `TH HOA HONG THANG ${month}-${year}`.slice(0, 31);

export const book3ReportTitle = (month: number, year: number): string =>
  `TỔNG HỢP SỐ PHẢI CHI HOA HỒNG ĐẠI LÝ THU BHYT HỘ GIA ĐÌNH ` +
  `THÁNG ${month} NĂM ${year}`;

/** Dựng mảng 2 chiều đúng thứ tự ô của mẫu Book3. */
export const book3Aoa = (opts: Book3ExportOptions): unknown[][] => {
  const { rows, totals, month, year } = opts;
  const title = book3ReportTitle(month, year);

  const aoa: unknown[][] = [];

  // 1-5
  // 1-5  (không có giá trị mặc định: lấy từ Cài đặt của đơn vị)
  aoa.push([opts.agencyName ?? '']);
  aoa.push([opts.departmentName ?? '']);
  aoa.push([]);
  aoa.push([title]);
  aoa.push([]);

  // 6: tiêu đề tầng 1
  aoa.push([
    'STT', 'Mã đơn vị', 'Đại lý thu xã',
    'Người tham gia', '', '',
    'Số thu', '', '',
    'Số thoái thu', '', '', '',
    'Số phải chi Thù lao chi cho tổ chức làm \nđại lý thu', '', '',
  ]);
  // 7: tầng 2
  aoa.push([
    '', '', '',
    'Tổng số', 'Tăng mới', 'Tái tục',
    'Tổng số', 'Trong đó', '',
    `HGĐ tháng ${month}/${year}`, '', '', '',
    'Tổng số', 'Trong đó', '',
  ]);
  // 8: tầng 3  (N8 để trống vì N7:N9 đã gộp; O8 = "Tăng mới", P8 = "Tái tục")
  aoa.push([
    '', '', '', '', '', '',
    '', 'Tăng mới', 'Tái tục',
    'Tăng mới', '', 'Tái tục', '',
    '', 'Tăng mới', 'Tái tục',
  ]);
  // 9: tầng 4 (đơn vị Người / Tiền)
  aoa.push([
    '', '', '', '', '', '', '', '', '',
    'Người', 'Tiền', 'Người', 'Tiền',
    '', '', '',
  ]);
  // 10: mã cột
  aoa.push(['A', '', 'B', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, '12=5*9,8%', '13=6*4,2%']);

  // 11+: dữ liệu
  for (const r of rows) {
    aoa.push([
      r.stt, r.pointCode, r.daiLyThu,
      r.tongNguoi, r.tangMoiNguoi, r.taiTucNguoi,
      r.tongThu, r.tangMoiThu, r.taiTucThu,
      r.thoaiTangMoiNguoi, r.thoaiTangMoiTien, r.thoaiTaiTucNguoi, r.thoaiTaiTucTien,
      r.tongPhaiChi, r.phaiChiTangMoi, r.phaiChiTaiTuc,
    ]);
  }

  // dòng TỔNG
  aoa.push([
    'TỔNG', '', '',
    totals.tongNguoi, totals.tangMoiNguoi, totals.taiTucNguoi,
    totals.tongThu, totals.tangMoiThu, totals.taiTucThu,
    totals.thoaiTangMoiNguoi, totals.thoaiTangMoiTien, totals.thoaiTaiTucNguoi, totals.thoaiTaiTucTien,
    totals.tongPhaiChi, totals.phaiChiTangMoi, totals.phaiChiTaiTuc,
  ]);

  return aoa;
};

export const buildBook3Workbook = (opts: Book3ExportOptions): XLSX.WorkBook => {
  const { month, year } = opts;
  const aoa = book3Aoa(opts);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();

  const totalRowIdx = aoa.length - 1; // 0-based

  // --- gộp ô đúng như mẫu ---
  const merges: XLSX.Range[] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },   // A1:C1 đơn vị
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },   // A2:C2 bộ phận
    { s: { r: 3, c: 0 }, e: { r: 3, c: 15 } },  // A4:P4 tiêu đề
    // tầng 1 gộp dọc
    { s: { r: 5, c: 0 }, e: { r: 8, c: 0 } },   // A6:A9
    { s: { r: 5, c: 1 }, e: { r: 8, c: 1 } },   // B6:B9
    { s: { r: 5, c: 2 }, e: { r: 8, c: 2 } },   // C6:C9
    { s: { r: 5, c: 3 }, e: { r: 5, c: 5 } },   // D6:F6 Người tham gia
    { s: { r: 6, c: 3 }, e: { r: 8, c: 3 } },   // D7:D9
    { s: { r: 6, c: 4 }, e: { r: 8, c: 4 } },   // E7:E9
    { s: { r: 6, c: 5 }, e: { r: 8, c: 5 } },   // F7:F9
    { s: { r: 5, c: 6 }, e: { r: 5, c: 8 } },   // G6:I6 Số thu
    { s: { r: 6, c: 6 }, e: { r: 8, c: 6 } },   // G7:G9
    { s: { r: 6, c: 7 }, e: { r: 6, c: 8 } },   // H7:I7 Trong đó
    { s: { r: 7, c: 7 }, e: { r: 8, c: 7 } },   // H8:H9
    { s: { r: 7, c: 8 }, e: { r: 8, c: 8 } },   // I8:I9
    { s: { r: 5, c: 9 }, e: { r: 5, c: 12 } },  // J6:M6 Số thoái thu
    { s: { r: 6, c: 9 }, e: { r: 6, c: 12 } },  // J7:M7
    { s: { r: 7, c: 9 }, e: { r: 7, c: 10 } },  // J8:K8
    { s: { r: 5, c: 13 }, e: { r: 5, c: 15 } }, // N6:P6 Số phải chi
    { s: { r: 6, c: 13 }, e: { r: 8, c: 13 } }, // N7:N9
    { s: { r: 6, c: 14 }, e: { r: 6, c: 15 } }, // O7:P7
    { s: { r: 7, c: 14 }, e: { r: 8, c: 14 } }, // O8:O9
    { s: { r: 7, c: 15 }, e: { r: 8, c: 15 } }, // P8:P9
    // dòng TỔNG
    { s: { r: totalRowIdx, c: 0 }, e: { r: totalRowIdx, c: 2 } },
  ];
  ws['!merges'] = merges;

  // --- định dạng số ---
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let r = 10; r <= range.e.r; r++) {
    for (let c = 3; c <= 15; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (cell && typeof cell.v === 'number') cell.z = MONEY_FMT;
    }
  }

  // --- độ rộng cột ---
  ws['!cols'] = [
    { wch: 5 },   // A STT
    { wch: 12 },  // B Mã đơn vị
    { wch: 34 },  // C Đại lý thu xã
    { wch: 8 },   // D
    { wch: 8 },   // E
    { wch: 8 },   // F
    { wch: 14 },  // G
    { wch: 12 },  // H
    { wch: 14 },  // I
    { wch: 8 },   // J
    { wch: 12 },  // K
    { wch: 8 },   // L
    { wch: 13 },  // M
    { wch: 13 },  // N
    { wch: 12 },  // O
    { wch: 12 },  // P
  ];

  (ws as unknown as Record<string, unknown>)['!pageSetup'] = {
    orientation: 'landscape',
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };

  XLSX.utils.book_append_sheet(wb, ws, book3SheetTitle(month, year));
  return wb;
};

/** Xuất và tải file (dùng trong trình duyệt) hoặc ghi ra đĩa (Node). */
export const exportBook3 = (opts: Book3ExportOptions): void => {
  const wb = buildBook3Workbook(opts);
  const fileName =
    opts.fileName ?? `TH_HOA_HONG_THANG_${opts.month}_${opts.year}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
