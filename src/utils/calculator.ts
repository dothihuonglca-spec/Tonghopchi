/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { D11aRow, FilterState, StaffSummaryRow, PointSummaryRow, AgencySettings } from '../types/index.ts';

export interface CalculationResult {
  filteredRecords: D11aRow[];
  d11aRecords: D11aRow[];
  d11aHtRecords: D11aRow[];
  staffSummaries: StaffSummaryRow[];
  pointSummaries: PointSummaryRow[];
  totals: {
    totalRevenue: number;
    totalCommission: number;
    totalReceipts: number;
    newRevenue: number;
    newCommission: number;
    regRevenue: number;
    regCommission: number;
    d11aRevenue: number;
    d11aCommission: number;
    d11aHtRevenue: number;
    d11aHtCommission: number;
    d11aHtRefund: number;
    receiptCount: number;
    totalTax: number;
    totalNetCommission: number;
    activeStaffCount: number;
    activePointCount: number;
  };
  periodTitle: string;
}

export const getPeriodTitle = (filter: FilterState): string => {
  switch (filter.periodType) {
    case 'month':
      return `Tháng ${filter.month}/${filter.year}`;
    case 'quarter':
      return `Quý ${filter.quarter}/${filter.year}`;
    case 'year':
      return `Năm ${filter.year}`;
    case 'custom':
      return `Từ ${filter.startDate || '...'} đến ${filter.endDate || '...'}`;
    case 'all':
    default:
      return 'Toàn bộ thời gian';
  }
};

export const filterAndCalculate = (
  allRecords: D11aRow[],
  filter: FilterState,
  settings: AgencySettings
): CalculationResult => {
  const searchTerm = filter.search.trim().toLowerCase();

  const filteredRecords = allRecords.filter(r => {
    // 1. Filter by period
    if (filter.periodType === 'month') {
      if (r.month !== filter.month || r.year !== filter.year) return false;
    } else if (filter.periodType === 'quarter') {
      if (r.quarter !== filter.quarter || r.year !== filter.year) return false;
    } else if (filter.periodType === 'year') {
      if (r.year !== filter.year) return false;
    } else if (filter.periodType === 'custom') {
      if (filter.startDate || filter.endDate) {
        // Parse r.receiptDate "dd/MM/yyyy" to compare with "yyyy-MM-dd"
        const parts = r.receiptDate.split('/');
        if (parts.length === 3) {
          const recDateIso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          if (filter.startDate && recDateIso < filter.startDate) return false;
          if (filter.endDate && recDateIso > filter.endDate) return false;
        }
      }
    }

    // 2. Filter by source (D11A, D11A_HT, or ALL)
    if (filter.source !== 'ALL') {
      if (r.source !== filter.source) return false;
    }

    // 3. Filter by Collection Point
    if (filter.pointCode && filter.pointCode !== '') {
      if (r.pointCode !== filter.pointCode) return false;
    }

    // 4. Filter by Staff
    if (filter.staffId && filter.staffId !== '') {
      if (r.staffId !== filter.staffId) return false;
    }

    // 5. Filter by Search Query
    if (searchTerm) {
      const match =
        r.staffName.toLowerCase().includes(searchTerm) ||
        r.staffId.toLowerCase().includes(searchTerm) ||
        r.participantName.toLowerCase().includes(searchTerm) ||
        r.bhxhCode.toLowerCase().includes(searchTerm) ||
        r.receiptNumber.toLowerCase().includes(searchTerm) ||
        r.pointCode.toLowerCase().includes(searchTerm) ||
        (r.pointName && r.pointName.toLowerCase().includes(searchTerm)) ||
        (r.notes && r.notes.toLowerCase().includes(searchTerm));
      if (!match) return false;
    }

    return true;
  });

  const d11aRecords = filteredRecords.filter(r => r.source === 'D11A');
  const d11aHtRecords = filteredRecords.filter(r => r.source === 'D11A_HT');

  // Group by Staff (PointCode + StaffId + StaffName)
  const staffMap = new Map<string, StaffSummaryRow>();

  filteredRecords.forEach(r => {
    const key = `${r.pointCode}__${r.staffId}`;
    let item = staffMap.get(key);
    if (!item) {
      item = {
        stt: 0,
        pointCode: r.pointCode,
        pointName: r.pointName || `Điểm thu ${r.pointCode}`,
        staffId: r.staffId,
        staffName: r.staffName,
        totalReceipts: 0,
        newRevenue: 0,
        newCommission: 0,
        regRevenue: 0,
        regCommission: 0,
        totalRevenue: 0,
        totalCommission: 0,
        d11aRevenue: 0,
        d11aCommission: 0,
        d11aHtRevenue: 0,
        d11aHtCommission: 0,
        taxDeduction: 0,
        netCommission: 0,
        records: []
      };
      staffMap.set(key, item);
    }

    item.totalReceipts += 1;
    item.newRevenue += r.newRevenue;
    item.newCommission += r.newCommission;
    item.regRevenue += r.regRevenue;
    item.regCommission += r.regCommission;
    item.totalRevenue += r.totalRevenue;
    item.totalCommission += r.totalCommission;

    if (r.source === 'D11A') {
      item.d11aRevenue += r.totalRevenue;
      item.d11aCommission += r.totalCommission;
    } else {
      item.d11aHtRevenue += r.totalRevenue;
      item.d11aHtCommission += r.totalCommission;
    }

    item.records.push(r);
  });

  // Calculate net commission according to source filter:
  // If ALL: Total Commission = File 1 (Trích thù lao phát sinh) - File 2 (Thù lao đã chi phải thu hồi)
  // If D11A: Total Commission = File 1
  // If D11A_HT: Total Commission = File 2
  const staffSummaries: StaffSummaryRow[] = Array.from(staffMap.values())
    .map((s, idx) => {
      let finalCom = s.totalCommission;
      if (filter.source === 'ALL') {
        finalCom = s.d11aCommission - s.d11aHtCommission;
      } else if (filter.source === 'D11A') {
        finalCom = s.d11aCommission;
      } else {
        finalCom = s.d11aHtCommission;
      }

      let tax = 0;
      if (settings.applyTax) {
        if (finalCom >= (settings.taxThreshold || 0)) {
          tax = Math.round(finalCom * (settings.taxRate || 0.10));
        }
      }

      return {
        ...s,
        stt: idx + 1,
        totalCommission: finalCom,
        taxDeduction: tax,
        netCommission: finalCom - tax
      };
    })
    .sort((a, b) => b.totalCommission - a.totalCommission);

  // Group by Point
  const pointMap = new Map<string, PointSummaryRow>();
  const pointStaffSet = new Map<string, Set<string>>();

  filteredRecords.forEach(r => {
    let p = pointMap.get(r.pointCode);
    if (!p) {
      p = {
        pointCode: r.pointCode,
        pointName: r.pointName || `Điểm thu ${r.pointCode}`,
        staffCount: 0,
        totalReceipts: 0,
        newRevenue: 0,
        newCommission: 0,
        regRevenue: 0,
        regCommission: 0,
        totalRevenue: 0,
        totalCommission: 0
      };
      pointMap.set(r.pointCode, p);
      pointStaffSet.set(r.pointCode, new Set<string>());
    }

    p.totalReceipts += 1;
    p.newRevenue += r.newRevenue;
    p.newCommission += r.newCommission;
    p.regRevenue += r.regRevenue;
    p.regCommission += r.regCommission;
    p.totalRevenue += r.totalRevenue;
    p.totalCommission += r.totalCommission;

    pointStaffSet.get(r.pointCode)?.add(r.staffId);
  });

  const pointSummaries: PointSummaryRow[] = Array.from(pointMap.values())
    .map(p => ({
      ...p,
      staffCount: pointStaffSet.get(p.pointCode)?.size || 0
    }))
    .sort((a, b) => b.totalCommission - a.totalCommission);

  // Totals
  let sumReceipts = 0;
  let sumNewRev = 0;
  let sumNewCom = 0;
  let sumRegRev = 0;
  let sumRegCom = 0;
  let sumTotRev = 0;
  let sumD11aRev = 0;
  let sumD11aCom = 0;
  let sumHtRev = 0;
  let sumHtCom = 0;
  let sumTax = 0;
  let sumNetCom = 0;
  let sumTotCom = 0;

  staffSummaries.forEach(s => {
    sumReceipts += s.totalReceipts;
    sumNewRev += s.newRevenue;
    sumNewCom += s.newCommission;
    sumRegRev += s.regRevenue;
    sumRegCom += s.regCommission;
    sumTotRev += s.totalRevenue;
    sumD11aRev += s.d11aRevenue;
    sumD11aCom += s.d11aCommission;
    sumHtRev += s.d11aHtRevenue;
    sumHtCom += s.d11aHtCommission;
    sumTotCom += s.totalCommission;
    sumTax += s.taxDeduction;
    sumNetCom += s.netCommission;
  });

  return {
    filteredRecords,
    d11aRecords,
    d11aHtRecords,
    staffSummaries,
    pointSummaries,
    totals: {
      totalReceipts: sumReceipts,
      newRevenue: sumNewRev,
      newCommission: sumNewCom,
      regRevenue: sumRegRev,
      regCommission: sumRegCom,
      totalRevenue: sumTotRev,
      totalCommission: sumTotCom,
      d11aRevenue: sumD11aRev,
      d11aCommission: sumD11aCom,
      d11aHtRevenue: sumHtRev,
      d11aHtCommission: sumHtCom,
      d11aHtRefund: d11aHtRecords.reduce((s, r) => s + (r.hoanTraNTG ?? 0), 0),
      receiptCount: d11aRecords.length,
      totalTax: sumTax,
      totalNetCommission: sumNetCom,
      activeStaffCount: staffSummaries.filter(s => !s.staffId.startsWith('HT:')).length,
      activePointCount: pointSummaries.length
    },
    periodTitle: getPeriodTitle(filter)
  };
};
