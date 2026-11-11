/**
 * TÊN BẢNG / TÊN CỘT — chép nguyên văn từ 3 file Excel của đơn vị.
 *
 * Đây là **tên biểu mẫu** (do BHXH quy định), không phải dữ liệu, nên được khai
 * báo một lần ở đây. Mọi màn hình phải dùng đúng các chuỗi này, không tự đặt tên
 * khác. Tên đơn vị / kỳ báo cáo thì lấy động từ Cài đặt và bộ lọc.
 */

// ---------------------------------------------------------------------------
// Book1 — sheet D11A
// ---------------------------------------------------------------------------
export const D11A = {
  sheet: 'D11A',
  title: 'BẢNG CHI TIẾT TRÍCH THÙ LAO CHO TỔ CHỨC DỊCH VỤ THU BHXH, BHYT',
  /** Dòng 5: tiêu đề tầng 1 (18 cột). Ô '' là ô gộp của tầng 2. */
  header1: [
    'STT', 'Mã điểm thu', 'Họ và tên nhân viên thu', 'Mã số nhân viên thu',
    'Họ và tên người tham gia', 'Mã số BHXH', 'Số biên lai', 'Ngày biên lai',
    'Phương thức đóng',
    'Đối tượng khai thác thu mới', '', '',
    'Đối tượng khai thác thu thường kỳ', '', '',
    'Tổng số thu của người tham gia', 'Thù lao tổ chức dịch vụ thu', 'Ghi chú',
  ],
  /** Dòng 6: tiêu đề tầng 2. */
  header2: [
    '', '', '', '', '', '', '', '', '',
    'Số tiền NTG đóng', 'Tỷ lệ % chi thù lao', 'Số tiền phải chi thù lao',
    'Số tiền NTG đóng', 'Tỷ lệ % chi thù lao', 'Số tiền phải chi thù lao',
    '', '', '',
  ],
  /** Dòng 7: mã cột A..R */
  codes: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
    'M', 'N', 'O', 'P', 'Q', 'R'],
} as const;

// ---------------------------------------------------------------------------
// Book2 — sheet D11A_HT
// ---------------------------------------------------------------------------
export const D11A_HT = {
  sheet: 'D11A_HT',
  title: 'BẢNG CHI TIẾT SỐ TIỀN THÙ LAO ĐÃ CHI PHẢI THU HỒI',
  header: [
    'STT', 'Mã điểm thu', 'Họ và tên nhân viên thu', 'Mã số nhân viên thu',
    'Họ và tên người tham gia', 'Mã số BHXH',
    'Mức đóng', 'Số tháng giảm', 'Số tiền hoàn trả NTG',
    'Tỷ lệ % thù lao phải thu hồi', 'Số tiền thù lao phải thu hồi',
    'Ghi chú', 'Đợt phát sinh', 'Đợt phát sinh giảm', 'Đã hoàn trả',
  ],
  codes: ['A', 'B', 'C', 'D', 'E', 'F', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
} as const;

// ---------------------------------------------------------------------------
// Book3 — sheet "TH HOA HONG THANG <tháng>-<năm>"
// ---------------------------------------------------------------------------
export const BOOK3 = {
  sheetName: (month: number, year: number) => `TH HOA HONG THANG ${month}-${year}`,
  title: (month: number, year: number) =>
    `TỔNG HỢP SỐ PHẢI CHI HOA HỒNG ĐẠI LÝ THU BHYT HỘ GIA ĐÌNH ` +
    `THÁNG ${month} NĂM ${year}`,
  /** Dòng 6 — tầng 1 (16 cột). */
  header1: [
    'STT', 'Mã đơn vị', 'Đại lý thu xã',
    'Người tham gia', '', '',
    'Số thu', '', '',
    'Số thoái thu', '', '', '',
    'Số phải chi Thù lao chi cho tổ chức làm \nđại lý thu', '', '',
  ],
  /** Dòng 7 — tầng 2. */
  header2: [
    '', '', '',
    'Tổng số', 'Tăng mới', 'Tái tục',
    'Tổng số', 'Trong đó', '',
    '', '', '', '',
    'Tổng số', 'Trong đó', '',
  ],
  /** Dòng 8 — tầng 3. */
  header3: [
    '', '', '', '', '', '',
    '', 'Tăng mới', 'Tái tục',
    'Tăng mới', '', 'Tái tục', '',
    '', 'Tăng mới', 'Tái tục',
  ],
  /** Dòng 9 — tầng 4 (đơn vị Người / Tiền). */
  header4: [
    '', '', '', '', '', '', '', '', '',
    'Người', 'Tiền', 'Người', 'Tiền',
    '', '', '',
  ],
  codes: ['A', '', 'B', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
    '12=5*9,8%', '13=6*4,2%'],
  /** Dòng 7 cột J: mẫu ghi " HGĐ tháng 01/2026" (cứng tháng 1) — ta ghi đúng kỳ. */
  thangLabel: (month: number, year: number) => `HGĐ tháng ${month}/${year}`,
} as const;

/** "Từ ngày 01/09/2026 đến ngày 30/09/2026" cho sheet D11A. */
export const d11aPeriodLine = (month: number, year: number): string => {
  const last = new Date(year, month, 0).getDate();
  const mm = String(month).padStart(2, '0');
  return `Từ ngày 01/${mm}/${year} đến ngày ${String(last).padStart(2, '0')}/${mm}/${year}`;
};

/** "Tháng 09 năm 2026" cho sheet D11A_HT. */
export const d11aHtPeriodLine = (month: number, year: number): string =>
  `Tháng ${String(month).padStart(2, '0')} năm ${year}`;
