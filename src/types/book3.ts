/**
 * Kiểu dữ liệu cho báo cáo Book3 (TỔNG HỢP SỐ PHẢI CHI HOA HỒNG ĐẠI LÝ THU).
 *
 * Tách khỏi `D11aRow` vì file D11A_HT (bảng thu hồi) có schema khác hoàn toàn:
 * 15 cột, đơn vị tiền là "hoàn trả NTG" và "thù lao phải thu hồi", không có
 * số biên lai / ngày biên lai / phương thức đóng.
 */

export type HtKind = 'new' | 'reg';

/** Một dòng của sheet D11A_HT (BẢNG CHI TIẾT SỐ TIỀN THÙ LAO ĐÃ CHI PHẢI THU HỒI). */
export interface D11aHtRow {
  stt: number;
  pointCode: string;      // B - Mã điểm thu
  staffName: string;      // C - Họ và tên nhân viên thu
  staffId: string;        // D - Mã số nhân viên thu
  participantName: string;// E - Họ và tên người tham gia
  bhxhCode: string;       // F - Mã số BHXH
  mucDong: number;        // G - Mức đóng
  soThangGiam: number;    // H - Số tháng giảm
  hoanTraNTG: number;     // I - Số tiền hoàn trả NTG
  tyLeThuHoi: number;     // J - Tỷ lệ % thù lao phải thu hồi (0.098 | 0.042)
  thuLaoThuHoi: number;   // K - Số tiền thù lao phải thu hồi
  ghiChu: string;         // L
  dotPhatSinh: string;    // M - Đợt phát sinh
  dotPhatSinhGiam: string;// N - Đợt phát sinh giảm
  daHoanTra: string;      // O
  kind: HtKind;           // suy ra từ J: 9,8% = tăng mới, 4,2% = tái tục
  month: number;
  year: number;
}

/** Một dòng của file D11A rút gọn, chỉ giữ các trường Book3 cần. */
export interface D11aRowLite {
  stt: number;
  pointCode: string;
  staffName: string;
  staffId: string;
  participantName: string;
  bhxhCode: string;
  newRevenue: number;     // J - Số tiền NTG đóng (thu mới)
  newRate: number;        // K - Tỷ lệ % (0.098)
  regRevenue: number;     // M - Số tiền NTG đóng (thường kỳ)
  regRate: number;        // N - Tỷ lệ % (0.042)
  totalRevenue: number;   // P - Tổng số thu
  totalCommission: number;// Q - Thù lao tổ chức dịch vụ thu
  month: number;
  year: number;
}

/** Một dòng của Book3 (16 cột A..P). */
export interface Book3Row {
  stt: number;
  pointCode: string;          // B - Mã đơn vị
  daiLyThu: string;           // C - Đại lý thu xã
  tongNguoi: number;          // D
  tangMoiNguoi: number;       // E
  taiTucNguoi: number;        // F
  tongThu: number;            // G
  tangMoiThu: number;         // H
  taiTucThu: number;          // I
  thoaiTangMoiNguoi: number;  // J
  thoaiTangMoiTien: number;   // K
  thoaiTaiTucNguoi: number;   // L
  thoaiTaiTucTien: number;    // M
  tongPhaiChi: number;        // N
  phaiChiTangMoi: number;     // O
  phaiChiTaiTuc: number;      // P
}

// Tỷ lệ chi thù lao: khai báo duy nhất tại src/constants.ts
export { RATE_NEW, RATE_REG } from '../constants.ts';