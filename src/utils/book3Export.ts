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

/**
 * Dựng workbook bằng ExcelJS (thư viện `xlsx` bản miễn phí KHÔNG ghi được
 * khung viền, font và cài đặt in — đó là lý do trước đây file xuất ra phải
 * chỉnh lại trước khi in).
 *
 * Cài đặt in đã có sẵn: A4 ngang, vừa 1 trang theo chiều rộng, lặp lại tiêu đề
 * bảng (dòng 6-10) ở mỗi trang, căn giữa, đánh số trang ở chân trang.
 */
const FONT = 'Times New Roman';
const THIN = { style: 'thin' as const };
const BORDER = { top: THIN, left: THIN, bottom: THIN, right: THIN };

export const buildBook3Workbook = async (opts: Book3ExportOptions) => {
  const ExcelJS = (await import('exceljs')).default;
  const { rows, totals, month, year } = opts;
  const aoa = book3Aoa(opts);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(book3SheetTitle(month, year), {
    views: [{ showGridLines: false, state: 'frozen', xSplit: 3, ySplit: 10 }],
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.6, header: 0.3, footer: 0.3 },
      printTitlesRow: '6:10',
    },
    headerFooter: { oddFooter: '&C&"Times New Roman,Regular"&10Trang &P / &N' },
  });

  aoa.forEach(r => ws.addRow(r));

  const lastDataRow = 10 + rows.length;      // dòng dữ liệu cuối (1-based)
  const totalRow = aoa.length;               // dòng TỔNG (1-based)

  const merges = [
    'A1:G1', 'A2:G2', 'A4:P4',
    'A6:A9', 'B6:B9', 'C6:C9', 'D6:F6', 'D7:D9', 'E7:E9', 'F7:F9',
    'G6:I6', 'G7:G9', 'H7:I7', 'H8:H9', 'I8:I9',
    'J6:M6', 'J7:M7', 'J8:K8', 'L8:M8',
    'N6:P6', 'N7:N9', 'O7:P7', 'O8:O9', 'P8:P9',
    `A${totalRow}:C${totalRow}`,
  ];
  merges.forEach(m => ws.mergeCells(m));

  // Tiêu đề đơn vị / báo cáo
  ws.getCell('A1').font = { name: FONT, size: 12, bold: true };
  ws.getCell('A2').font = { name: FONT, size: 13, bold: true };
  ws.getCell('A4').font = { name: FONT, size: 14, bold: true };
  ws.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };

  // Khối tiêu đề bảng (dòng 6-10)
  for (let r = 6; r <= 10; r++) {
    for (let c = 1; c <= 16; c++) {
      const cell = ws.getCell(r, c);
      cell.font = { name: FONT, size: 11, bold: true, italic: r === 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = BORDER;
    }
  }

  // Dữ liệu + dòng TỔNG
  for (let r = 11; r <= totalRow; r++) {
    const isTotal = r === totalRow;
    for (let c = 1; c <= 16; c++) {
      const cell = ws.getCell(r, c);
      cell.border = BORDER;
      cell.font = { name: FONT, size: 12, bold: isTotal };
      if (c === 3 && !isTotal) cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      else if (c <= 2) cell.alignment = { horizontal: 'center', vertical: 'middle' };
      else cell.alignment = { horizontal: 'right', vertical: 'middle' };
      if (c >= 4) cell.numFmt = MONEY_FMT;
    }
    ws.getRow(r).height = 23.25;
  }
  // Dòng TỔNG dùng công thức SUM để sửa tay số liệu thì tổng tự cập nhật
  if (rows.length > 0) {
    for (let c = 4; c <= 16; c++) {
      const col = ws.getColumn(c).letter;
      ws.getCell(totalRow, c).value = {
        formula: `SUM(${col}11:${col}${lastDataRow})`,
        result: Number(aoa[totalRow - 1][c - 1]) || 0,
      };
    }
  }

  const heights: Record<number, number> = { 1: 22, 2: 22, 3: 8, 4: 26, 5: 8, 6: 42, 7: 28.5, 8: 20, 9: 20, 10: 20 };
  Object.entries(heights).forEach(([r, h]) => { ws.getRow(Number(r)).height = h; });

  [5, 11, 40, 9, 9, 9, 16, 15, 16, 9, 14, 9, 15, 15, 14, 14].forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  // Vùng in: gồm cả dòng TỔNG
  ws.pageSetup.printArea = `A1:P${totalRow}`;
  return wb;
};

/** Xuất và tải file (trình duyệt). */
export const exportBook3 = async (opts: Book3ExportOptions): Promise<void> => {
  const wb = await buildBook3Workbook(opts);
  const fileName =
    opts.fileName ?? `TH_HOA_HONG_THANG_${opts.month}_${opts.year}.xlsx`;
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};
