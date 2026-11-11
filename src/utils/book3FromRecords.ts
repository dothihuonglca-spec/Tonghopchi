/**
 * Dựng số liệu Book3 từ danh sách bản ghi đang lưu trong app (D11A + D11A_HT).
 * Dùng cho bảng Book3 trên màn hình và cho nút xuất Excel.
 */

import { D11aRow } from '../types/index.ts';
import {
  Book3BuildResult, buildBook3Rows
} from './book3Builder.ts';
import { D11aHtRow, D11aRowLite, RATE_NEW } from '../types/book3.ts';
import { PointNameMap } from '../data/pointNames.ts';

export const buildBook3FromRecords = (
  records: D11aRow[],
  pointNames: PointNameMap = {},
  sttMap: Record<string, number> = {}
): Book3BuildResult => {
  const d11a: D11aRowLite[] = records
    .filter(r => r.source === 'D11A')
    .map(r => ({
      stt: r.stt,
      pointCode: r.pointCode,
      staffName: r.staffName,
      staffId: r.staffId,
      participantName: r.participantName,
      bhxhCode: r.bhxhCode,
      newRevenue: r.newRevenue,
      newRate: r.newRate,
      regRevenue: r.regRevenue,
      regRate: r.regRate,
      totalRevenue: r.totalRevenue,
      totalCommission: r.totalCommission,
      month: r.month,
      year: r.year,
    }));

  const ht: D11aHtRow[] = records
    .filter(r => r.source === 'D11A_HT')
    .map(r => ({
      stt: r.stt,
      pointCode: r.pointCode,
      staffName: r.staffName,
      staffId: r.staffId,
      participantName: r.participantName,
      bhxhCode: r.bhxhCode,
      mucDong: r.mucDong ?? 0,
      soThangGiam: r.soThangGiam ?? 0,
      hoanTraNTG: r.hoanTraNTG ?? 0,
      tyLeThuHoi: r.tyLeThuHoi ?? 0,
      thuLaoThuHoi: r.totalCommission,
      ghiChu: r.notes,
      dotPhatSinh: r.dotPhatSinh ?? '',
      dotPhatSinhGiam: r.dotPhatSinhGiam ?? '',
      daHoanTra: r.daHoanTra ?? '',
      kind: Math.abs((r.tyLeThuHoi ?? 0) - RATE_NEW) < 1e-9 ? 'new' : 'reg',
      month: r.month,
      year: r.year,
    }));

  return buildBook3Rows(d11a, ht, { pointNames, sttMap });
};
