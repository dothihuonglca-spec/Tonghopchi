/**
 * Hằng số nghiệp vụ — nơi DUY NHẤT chứa các con số cố định.
 *
 * Không đặt dữ liệu (mã điểm thu, tên người, số tiền, ngày tháng) ở đây.
 * Mọi dữ liệu phải đến từ file người dùng nạp.
 */

import { AgencySettings } from './types/index.ts';

/** Tỷ lệ chi thù lao theo quy định: thu mới 9,8% — thường kỳ 4,2%. */
export const RATE_NEW = 0.098;
export const RATE_REG = 0.042;

/**
 * Tên đơn vị mặc định — CHỈ là giá trị khởi tạo cho Cài đặt.
 * Người dùng sửa trong "Cài đặt" và giá trị đó được lưu lại, không ghi đè.
 */
export const DEFAULT_AGENCY_NAME = 'BẢO HIỂM XÃ HỘI TỈNH HƯNG YÊN';

/** Thông tin đơn vị mặc định (chỉ tên đơn vị; các trường khác để trống). */
export const EMPTY_SETTINGS: AgencySettings = {
  agencyName: DEFAULT_AGENCY_NAME,
  agencyCode: '',
  address: '',
  phone: '',
  representativeName: '',
  accountantName: '',
  preparerName: '',
  applyTax: false,
  taxThreshold: 0,
  taxRate: 0.1,
};
