/**
 * Ủy nhiệm chi (UNC) — số tiền thực chi cho từng Mã đơn vị.
 * Tên trường tương ứng đúng tên cột của file mẫu UNC.
 */
export interface UncRow {
  id: string;
  stt: number;          // STT
  date: string;         // Ngày (dd/MM/yyyy)
  voucherDate: string;  // Ngày phiếu (dd/MM/yyyy)
  voucherNo: string;    // Số phiếu
  ncCode: string;       // Mã NC
  quarter: string;      // Quý (giữ nguyên chữ trong file, ví dụ "6/2202")
  pointCode: string;    // Mã đơn vị (ví dụ BI0167D) — khớp với Mã đơn vị của Book3
  unitName: string;     // Tên đơn vị
  amount: number;       // Tiền VND
  content: string;      // Nội dung
  month: number;        // suy ra từ Ngày phiếu (hoặc Ngày)
  year: number;
}
