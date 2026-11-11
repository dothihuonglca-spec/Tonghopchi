/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DataSourceType = 'D11A' | 'D11A_HT';

export interface D11aRow {
  id: string;
  stt: number;
  source: DataSourceType; // 'D11A' (File 1) or 'D11A_HT' (File 2)
  category: string; // e.g., 'BHYT Hộ gia đình', 'BHXH Tự nguyện'
  pointCode: string; // Mã điểm thu (e.g. BI0121C)
  pointName?: string; // Tên điểm thu (nếu danh mục có khai báo)
  staffName: string; // Họ và tên nhân viên thu
  staffId: string; // Mã số nhân viên thu (e.g. NV033180007606)
  participantName: string; // Họ và tên người tham gia
  bhxhCode: string; // Mã số BHXH
  receiptNumber: string; // Số biên lai
  receiptDate: string; // Ngày biên lai (dd/MM/yyyy)
  paymentMethod: string; // Phương thức đóng (12, 6, 3...)
  
  // Thu mới
  newRevenue: number; // Đối tượng khai thác thu mới - Số tiền NTG đóng
  newRate: number; // Tỷ lệ % chi thù lao thu mới (e.g. 0.098 for 9.8%)
  newCommission: number; // Số tiền phải chi thù lao thu mới (= newRevenue * newRate)
  
  // Thu thường kỳ
  regRevenue: number; // Đối tượng khai thác thu thường kỳ - Số tiền NTG đóng
  regRate: number; // Tỷ lệ % chi thù lao thường kỳ (e.g. 0.042 for 4.2%)
  regCommission: number; // Số tiền phải chi thù lao thường kỳ (= regRevenue * regRate)
  
  // Tổng cộng
  totalRevenue: number; // Tổng số thu của người tham gia (= newRevenue + regRevenue)
  totalCommission: number; // Thù lao tổ chức dịch vụ thu (= newCommission + regCommission)
  notes: string; // Ghi chú (e.g. 2026.09.000011)
  
  // Thời gian
  month: number; // 1 - 12
  year: number; // e.g. 2026
  quarter: number; // 1 - 4

  // --- Riêng file D11A_HT (bảng thu hồi) ---
  // Các trường này KHÔNG có ở file D11A. Dùng để hiển thị đúng bảng thu hồi
  // thay vì tái sử dụng cột "biên lai"/"doanh thu" của D11A.
  mucDong?: number;          // G - Mức đóng
  soThangGiam?: number;      // H - Số tháng giảm
  hoanTraNTG?: number;       // I - Số tiền hoàn trả người tham gia
  tyLeThuHoi?: number;       // J - Tỷ lệ % thù lao phải thu hồi (0.098 | 0.042)
  dotPhatSinh?: string;      // M - Đợt phát sinh
  dotPhatSinhGiam?: string;  // N - Đợt phát sinh giảm
  daHoanTra?: string;        // O - Đã hoàn trả
}

export interface StaffSummaryRow {
  stt: number;
  pointCode: string;
  pointName: string;
  staffId: string;
  staffName: string;
  totalReceipts: number;
  newRevenue: number;
  newCommission: number;
  regRevenue: number;
  regCommission: number;
  totalRevenue: number;
  totalCommission: number;
  d11aRevenue: number;
  d11aCommission: number;
  d11aHtRevenue: number;
  d11aHtCommission: number;
  taxDeduction: number; // Thuế TNCN (e.g. 10% nếu áp dụng)
  netCommission: number; // Thực lĩnh sau thuế
  records: D11aRow[];
}

export interface PointSummaryRow {
  pointCode: string;
  pointName: string;
  staffCount: number;
  totalReceipts: number;
  newRevenue: number;
  newCommission: number;
  regRevenue: number;
  regCommission: number;
  totalRevenue: number;
  totalCommission: number;
}

export type PeriodType = 'all' | 'month' | 'quarter' | 'year' | 'custom';

export interface FilterState {
  periodType: PeriodType;
  year: number;
  month: number; // 1-12
  quarter: number; // 1-4
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
  source: 'ALL' | 'D11A' | 'D11A_HT';
  pointCode: string; // '' for all
  staffId: string; // '' for all
  search: string;
}

export interface AgencySettings {
  agencyName: string; // Tên đơn vị — người dùng nhập trong Cài đặt
  agencyCode: string; // Mã tổ chức / Bưu cục
  address: string; // Địa chỉ
  phone: string;
  representativeName: string; // Thủ trưởng đơn vị / Người đại diện
  accountantName: string; // Kế toán trưởng
  preparerName: string; // Người lập biểu
  applyTax: boolean; // Khấu trừ thuế TNCN 10%
  taxThreshold: number; // Ngưỡng áp dụng thuế (ví dụ: 0 hoặc 2,000,000)
  taxRate: number; // Tỷ lệ thuế (e.g. 0.10)
}
