/**
 * Tổng hợp Book3 từ 2 nguồn D11A (phát sinh) và D11A_HT (thu hồi).
 *
 * Công thức đã đối chiếu khớp tuyệt đối với file Book3 mẫu (5/5 mã điểm thu,
 * tất cả 13 cột số):
 *
 *   D  = số dòng D11A của mã điểm thu
 *   E  = số dòng có "Số tiền NTG đóng" (thu mới)  > 0
 *   F  = số dòng có "Số tiền NTG đóng" (thường kỳ) > 0
 *   G  = Σ Tổng số thu          H = Σ thu mới      I = Σ thường kỳ
 *   J  = số dòng HT có tỷ lệ 9,8%      K = Σ Số tiền hoàn trả NTG (nhóm 9,8%)
 *   L  = số dòng HT có tỷ lệ 4,2%      M = Σ Số tiền hoàn trả NTG (nhóm 4,2%)
 *   O  = round(Σ thu_mới×9,8%  − Σ hoàn_trả_9,8%×9,8%)
 *   P  = round(Σ thường_kỳ×4,2% − Σ hoàn_trả_4,2%×4,2%)
 *   N  = O + P
 *
 * Lưu ý: làm tròn **một lần ở cuối** (không làm tròn từng dòng) mới khớp Book3.
 */

import {
  Book3Row, D11aHtRow, D11aRowLite, RATE_NEW, RATE_REG
} from '../types/book3.ts';
import { pointName as resolvePointName } from '../data/pointNames.ts';

export interface Book3BuildResult {
  rows: Book3Row[];
  totals: Book3Row;
  warnings: string[];
}

export interface Book3BuildOptions {
  /** Tên "Đại lý thu xã" theo mã điểm thu. Thiếu thì dùng "Điểm thu <mã>". */
  pointNames?: Record<string, string>;
  /** STT gốc theo mã điểm thu (Book3 mẫu dùng 1, 2, 3, 14, 46...). */
  sttMap?: Record<string, number>;
}

const emptyRow = (pointCode = ''): Book3Row => ({
  stt: 0,
  pointCode,
  daiLyThu: '',
  tongNguoi: 0,
  tangMoiNguoi: 0,
  taiTucNguoi: 0,
  tongThu: 0,
  tangMoiThu: 0,
  taiTucThu: 0,
  thoaiTangMoiNguoi: 0,
  thoaiTangMoiTien: 0,
  thoaiTaiTucNguoi: 0,
  thoaiTaiTucTien: 0,
  tongPhaiChi: 0,
  phaiChiTangMoi: 0,
  phaiChiTaiTuc: 0,
});

export const buildBook3Rows = (
  d11a: D11aRowLite[],
  ht: D11aHtRow[],
  options: Book3BuildOptions = {}
): Book3BuildResult => {
  const { pointNames = {}, sttMap = {} } = options;
  const warnings: string[] = [];

  const codes = Array.from(new Set([
    ...d11a.map(r => r.pointCode),
    ...ht.map(r => r.pointCode),
  ])).filter(Boolean).sort((a, b) => a.localeCompare(b, 'vi'));

  const rows: Book3Row[] = codes.map((code, idx) => {
    const b1 = d11a.filter(r => r.pointCode === code);
    const b2 = ht.filter(r => r.pointCode === code);
    const htNew = b2.filter(r => r.kind === 'new');
    const htReg = b2.filter(r => r.kind === 'reg');

    const sum = (arr: number[]) => arr.reduce((s, v) => s + v, 0);

    // Phần phát sinh (làm tròn 1 lần ở cuối)
    const commissionNew = sum(b1.map(r => r.newRevenue * (r.newRate || RATE_NEW)));
    const commissionReg = sum(b1.map(r => r.regRevenue * (r.regRate || RATE_REG)));
    // Phần thu hồi
    const recoverNew = sum(htNew.map(r => r.hoanTraNTG * (r.tyLeThuHoi || RATE_NEW)));
    const recoverReg = sum(htReg.map(r => r.hoanTraNTG * (r.tyLeThuHoi || RATE_REG)));

    const phaiChiTangMoi = Math.round(commissionNew - recoverNew);
    const phaiChiTaiTuc = Math.round(commissionReg - recoverReg);

    if (b1.length === 0 && b2.length > 0) {
      warnings.push(`${code}: chỉ có dữ liệu thu hồi, không có phát sinh.`);
    }

    return {
      stt: sttMap[code] ?? idx + 1,
      pointCode: code,
      daiLyThu: resolvePointName(code, pointNames),
      tongNguoi: b1.length,
      tangMoiNguoi: b1.filter(r => r.newRevenue > 0).length,
      taiTucNguoi: b1.filter(r => r.regRevenue > 0).length,
      tongThu: sum(b1.map(r => r.totalRevenue)),
      tangMoiThu: sum(b1.map(r => r.newRevenue)),
      taiTucThu: sum(b1.map(r => r.regRevenue)),
      thoaiTangMoiNguoi: htNew.length,
      thoaiTangMoiTien: sum(htNew.map(r => r.hoanTraNTG)),
      thoaiTaiTucNguoi: htReg.length,
      thoaiTaiTucTien: sum(htReg.map(r => r.hoanTraNTG)),
      tongPhaiChi: phaiChiTangMoi + phaiChiTaiTuc,
      phaiChiTangMoi,
      phaiChiTaiTuc,
    };
  });

  const totals = emptyRow();
  totals.stt = 0;
  totals.daiLyThu = 'TỔNG';
  for (const r of rows) {
    totals.tongNguoi += r.tongNguoi;
    totals.tangMoiNguoi += r.tangMoiNguoi;
    totals.taiTucNguoi += r.taiTucNguoi;
    totals.tongThu += r.tongThu;
    totals.tangMoiThu += r.tangMoiThu;
    totals.taiTucThu += r.taiTucThu;
    totals.thoaiTangMoiNguoi += r.thoaiTangMoiNguoi;
    totals.thoaiTangMoiTien += r.thoaiTangMoiTien;
    totals.thoaiTaiTucNguoi += r.thoaiTaiTucNguoi;
    totals.thoaiTaiTucTien += r.thoaiTaiTucTien;
  }
  totals.tongPhaiChi = totals.phaiChiTangMoi + totals.phaiChiTaiTuc;
  totals.phaiChiTangMoi = rows.reduce((s, r) => s + r.phaiChiTangMoi, 0);
  totals.phaiChiTaiTuc = rows.reduce((s, r) => s + r.phaiChiTaiTuc, 0);
  totals.tongPhaiChi = totals.phaiChiTangMoi + totals.phaiChiTaiTuc;

  // Kiểm tra chéo: nếu có thu hồi mà không có phát sinh thì Book3 sẽ ra số âm.
  for (const r of rows) {
    if (r.phaiChiTangMoi < 0 || r.phaiChiTaiTuc < 0) {
      warnings.push(
        `${r.pointCode}: thù lao thu hồi lớn hơn thù lao phát sinh ` +
        `(tăng mới ${r.phaiChiTangMoi}, tái tục ${r.phaiChiTaiTuc}).`
      );
    }
  }

  return { rows, totals, warnings };
};
