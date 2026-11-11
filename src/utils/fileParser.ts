/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { D11aRow, DataSourceType } from '../types/index.ts';
import { readFileToSheets, parseHtSheet, pickSheet } from './book3Parser.ts';
import { RATE_NEW, RATE_REG } from '../constants.ts';

export interface SheetInfo {
  name: string;
  rowCount: number;
  detectedSource: DataSourceType;
  previewRows: string[][];
}

export interface ParseResult {
  success: boolean;
  d11aRecords: D11aRow[];
  d11aHtRecords: D11aRow[];
  allRecords: D11aRow[];
  sheetNames: string[];
  sheetsInfo: SheetInfo[];
  detectedPeriods: { month: number; year: number; count: number }[];
  message: string;
  errors: string[];
}

// Clean number strings with commas, spaces, currency symbols
export const parseNumber = (val: unknown): number => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val)
    .replace(/[,\s₫đVND"']/gi, '')
    .trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

// Clean percentage strings: "9.8%" -> 0.098, "4.2%" -> 0.042, 9.8 -> 0.098
export const parseRate = (val: unknown): number => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') {
    return val > 1 ? val / 100 : val;
  }
  const str = String(val).replace(/[%,\s"']/g, '').trim();
  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  return num > 1 ? num / 100 : num;
};

// Parse date string or Excel serial number into dd/MM/yyyy and month, year, quarter.
// Không có ngày mặc định: không đọc được thì trả về rỗng (month/year = 0) để
// người dùng thấy dữ liệu "không xác định kỳ", thay vì bị gán vào một tháng bịa ra.
export const parseDateInfo = (val: unknown): { dateStr: string; month: number; year: number; quarter: number } => {
  const emptyRes = { dateStr: '', month: 0, year: 0, quarter: 0 };

  if (val === undefined || val === null || val === '') return emptyRes;

  // Handle Excel date serial number (e.g. 46278)
  if (typeof val === 'number' && val > 30000 && val < 60000) {
    const jsDate = new Date((val - 25569) * 86400 * 1000);
    const day = String(jsDate.getUTCDate()).padStart(2, '0');
    const month = jsDate.getUTCMonth() + 1;
    const year = jsDate.getUTCFullYear();
    const quarter = Math.ceil(month / 3);
    return {
      dateStr: `${day}/${String(month).padStart(2, '0')}/${year}`,
      month,
      year,
      quarter
    };
  }

  const str = String(val).trim();
  
  // Try dd/MM/yyyy or dd-MM-yyyy
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    const quarter = Math.ceil(month / 3);
    return {
      dateStr: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
      month,
      year,
      quarter
    };
  }

  // Try yyyy-MM-dd
  const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    const quarter = Math.ceil(month / 3);
    return {
      dateStr: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
      month,
      year,
      quarter
    };
  }

  return emptyRes;
};

// Clean text
export const cleanText = (val: unknown): string => {
  if (val === undefined || val === null) return '';
  let str = String(val).trim();
  str = str.replace(/^["']|["']$/g, '').trim();
  return str;
};

// Detect source from sheet name, file name, or content
export const detectSourceType = (sheetName: string, fileName?: string): DataSourceType => {
  const sLower = (sheetName || '').toLowerCase();
  const fLower = (fileName || '').toLowerCase();

  // If sheet or file name contains HT / He thong / Ho tro
  if (
    sLower.includes('d11a_ht') ||
    sLower.includes('d11a-ht') ||
    sLower.includes('ht') ||
    sLower.includes('he thong') ||
    sLower.includes('he_thong') ||
    sLower.includes('ho tro') ||
    fLower.includes('d11a_ht') ||
    fLower.includes('d11a-ht') ||
    fLower.includes('_ht') ||
    fLower.includes('he_thong')
  ) {
    return 'D11A_HT';
  }

  return 'D11A';
};

// Parse a single worksheet into D11aRow[]
export const parseWorksheet = (
  ws: XLSX.WorkSheet,
  assignedSource: DataSourceType,
  sheetName: string
): D11aRow[] => {
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (rows.length === 0) return [];

  const source = assignedSource;

  // Find header row: phải có >= 2 "cột neo" và có cột STT (hoặc số biên lai / mức đóng).
  // Cách cũ chỉ dò chữ "thù lao" nên bắt nhầm dòng tiêu đề lớn (dòng 3) và đọc
  // cả dòng mã cột (A,B,C...) thành dữ liệu.
  let headerRowIndex = -1;
  let codeRowIndex = -1;

  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const cells = (rows[i] || []).map(c => String(c).toLowerCase().trim());
    const anchors = ['mã điểm thu', 'họ và tên người tham gia', 'mã số bhxh']
      .filter(k => cells.some(c => c.includes(k))).length;
    const hasStt = cells.some(c => c.startsWith('stt'));
    const hasKeyMoney = cells.some(c => c.includes('số biên lai') || c.includes('mức đóng'));
    if (anchors >= 2 && (hasStt || hasKeyMoney)) {
      headerRowIndex = i;
      break;
    }
  }

  // Dòng mã cột (A, B, C..., 1, 2, 3...) nằm ngay sau tiêu đề, cách 1 hoặc 2 dòng.
  if (headerRowIndex !== -1) {
    for (const offset of [1, 2]) {
      const idx = headerRowIndex + offset;
      if (idx >= rows.length) break;
      const codeLike = (rows[idx] || []).filter(c => {
        const s = String(c).trim();
        return /^[A-Z]{1,2}$/.test(s) || /^\d{1,2}$/.test(s);
      }).length;
      if (codeLike >= 5) { codeRowIndex = idx; break; }
    }
  }

  // Default column positions if headers match Mẫu D11a-TS
  let colMap = {
    stt: 0,
    pointCode: 1,
    staffName: 2,
    staffId: 3,
    participantName: 4,
    bhxhCode: 5,
    receiptNumber: 6,
    receiptDate: 7,
    paymentMethod: 8,
    newRevenue: 9,
    newRate: 10,
    newCommission: 11,
    regRevenue: 12,
    regRate: 13,
    regCommission: 14,
    totalRevenue: 15,
    totalCommission: 16,
    notes: 17
  };

  // Dynamic header scanning
  if (headerRowIndex !== -1) {
    const hRow = rows[headerRowIndex];
    hRow.forEach((col, idx) => {
      const colStr = String(col).toLowerCase().trim();
      if (colStr.includes('mã điểm thu') || colStr === 'mã điểm' || colStr.includes('diem thu')) colMap.pointCode = idx;
      else if (colStr.includes('tên nhân viên thu') || colStr.includes('nhân viên thu') || colStr === 'họ và tên nvt') colMap.staffName = idx;
      else if (colStr.includes('mã số nhân viên thu') || colStr.includes('mã nhân viên') || colStr === 'mã nv') colMap.staffId = idx;
      // Cột tiền phải xét TRƯỚC "người tham gia", vì tiêu đề
      // "Tổng số thu của người tham gia" cũng chứa chữ "người tham gia".
      else if (colStr.includes('tổng số thu') || colStr.includes('tổng cộng thu') || colStr === 'tổng số') colMap.totalRevenue = idx;
      else if (colStr.includes('thù lao tổ chức') || colStr.includes('tổng thù lao') || colStr.includes('hoa hong')) colMap.totalCommission = idx;
      else if (colStr.includes('họ và tên người tham gia') || colStr === 'người tham gia' || colStr.includes('họ tên ntg')) colMap.participantName = idx;
      else if (colStr.includes('mã số bhxh') || colStr.includes('số sổ bhxh') || colStr.includes('ma bhxh')) colMap.bhxhCode = idx;
      else if (colStr.includes('số biên lai') || colStr === 'số bl' || colStr.includes('bien lai')) colMap.receiptNumber = idx;
      else if (colStr.includes('ngày biên lai') || colStr === 'ngày bl' || colStr.includes('ngay thu')) colMap.receiptDate = idx;
      else if (colStr.includes('phương thức đóng') || colStr.includes('pt đóng') || colStr.includes('phuong thuc')) colMap.paymentMethod = idx;
      else if (colStr.includes('ghi chú')) colMap.notes = idx;
    });
  }

  const startRow = codeRowIndex !== -1 ? codeRowIndex + 1 : (headerRowIndex !== -1 ? headerRowIndex + 1 : 0);
  const records: D11aRow[] = [];
  let currentCategory = assignedSource === 'D11A_HT' ? 'BHYT Hộ gia đình (Hệ thống)' : 'BHYT Hộ gia đình';

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const firstCell = String(row[0] || '').trim();
    const secondCell = String(row[1] || '').trim();

    // Check Roman numeral category header (e.g. I, BHYT Hộ gia đình, II, BHXH Tự nguyện)
    if (firstCell.match(/^(I|II|III|IV|V|VI|A|B|C)$/i) && secondCell && !row[colMap.participantName]) {
      currentCategory = secondCell;
      continue;
    }

    const isNumericStt = !isNaN(parseInt(firstCell, 10)) && parseInt(firstCell, 10) > 0;
    const hasParticipant = Boolean(cleanText(row[colMap.participantName]));
    const hasReceipt = Boolean(cleanText(row[colMap.receiptNumber]));
    const rawPointCode = cleanText(row[colMap.pointCode]);
    const hasRealPointCode = /^[A-Za-z0-9]{5,}$/.test(rawPointCode);

    // Bỏ dòng rác: dòng chỉ có STT, dòng mã cột, dòng "BI" cụt...
    if (!hasRealPointCode && !hasParticipant) {
      continue;
    }

    // Không có mã điểm thu hợp lệ thì bỏ dòng, không tự gán mã mặc định.
    if (!hasRealPointCode) {
      continue;
    }

    const stt = isNumericStt ? parseInt(firstCell, 10) : records.length + 1;
    const pointCode = rawPointCode;
    let staffName = cleanText(row[colMap.staffName]);
    let staffId = cleanText(row[colMap.staffId]);
    const participantName = cleanText(row[colMap.participantName]);
    const bhxhCode = cleanText(row[colMap.bhxhCode]);
    const receiptNumber = cleanText(row[colMap.receiptNumber]);
    const rawDate = row[colMap.receiptDate];
    const dateInfo = parseDateInfo(rawDate);
    const paymentMethod = cleanText(row[colMap.paymentMethod]);

    if (!staffName && staffId) {
      staffName = staffId;
    } else if (!staffId && staffName) {
      staffId = staffName;
    }

    const newRev = parseNumber(row[colMap.newRevenue]);
    let newR = parseRate(row[colMap.newRate]);
    if (newRev > 0 && newR === 0) newR = RATE_NEW;
    let newCom = parseNumber(row[colMap.newCommission]);
    if (newRev > 0 && newCom === 0) newCom = Math.round(newRev * newR);

    const regRev = parseNumber(row[colMap.regRevenue]);
    let regR = parseRate(row[colMap.regRate]);
    if (regRev > 0 && regR === 0) regR = RATE_REG;
    let regCom = parseNumber(row[colMap.regCommission]);
    if (regRev > 0 && regCom === 0) regCom = Math.round(regRev * regR);

    let totRev = parseNumber(row[colMap.totalRevenue]);
    if (totRev === 0) totRev = newRev + regRev;

    let totCom = parseNumber(row[colMap.totalCommission]);
    if (totCom === 0) totCom = newCom + regCom;

    const notes = cleanText(row[colMap.notes]);

    records.push({
      id: `${source.toLowerCase()}_${Date.now()}_${stt}_${Math.random().toString(36).substring(2, 6)}`,
      stt,
      source,
      category: currentCategory,
      pointCode,
      staffName,
      staffId,
      participantName,
      bhxhCode,
      receiptNumber,
      receiptDate: dateInfo.dateStr,
      paymentMethod,
      newRevenue: newRev,
      newRate: newR,
      newCommission: newCom,
      regRevenue: regRev,
      regRate: regR,
      regCommission: regCom,
      totalRevenue: totRev,
      totalCommission: totCom,
      notes,
      month: dateInfo.month,
      year: dateInfo.year,
      quarter: dateInfo.quarter
    });
  }

  return records;
};

// Scan sheet metadata (names, row counts, preview) before or during parse
export const scanWorkbookSheets = (workbook: XLSX.WorkBook, fileName?: string): SheetInfo[] => {
  return workbook.SheetNames.map(name => {
    const ws = workbook.Sheets[name];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const detectedSource = detectSourceType(name, fileName);
    const preview = rows.slice(0, 5).map(r => r.slice(0, 8).map(c => String(c)));
    return {
      name,
      rowCount: rows.length,
      detectedSource,
      previewRows: preview
    };
  });
};

// Main function to parse uploaded Excel or CSV file
export const parseUploadedFile = async (
  file: File,
  targetSource?: DataSourceType,
  sheetMapping?: Record<string, DataSourceType | 'IGNORE'>
): Promise<ParseResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellDates: false,
      raw: true
    });

    const sheetNames = workbook.SheetNames;
    if (sheetNames.length === 0) {
      return {
        success: false,
        d11aRecords: [],
        d11aHtRecords: [],
        allRecords: [],
        sheetNames: [],
        sheetsInfo: [],
        detectedPeriods: [],
        message: 'Tập tin không chứa bảng tính (sheet) nào.',
        errors: ['File rỗng']
      };
    }

    const sheetsInfo = scanWorkbookSheets(workbook, file.name);
    const d11aRecords: D11aRow[] = [];
    const d11aHtRecords: D11aRow[] = [];

    // Process each sheet
    for (const info of sheetsInfo) {
      const sName = info.name;
      const ws = workbook.Sheets[sName];

      // Check if user provided explicit mapping
      let assignedSource: DataSourceType | 'IGNORE' | undefined = sheetMapping?.[sName];

      if (!assignedSource) {
        if (targetSource) {
          assignedSource = targetSource;
        } else {
          assignedSource = info.detectedSource;
        }
      }

      if (assignedSource === 'IGNORE') continue;

      const records = parseWorksheet(ws, assignedSource, sName);
      if (assignedSource === 'D11A') {
        d11aRecords.push(...records);
      } else {
        d11aHtRecords.push(...records);
      }
    }

    const allRecords = [...d11aRecords, ...d11aHtRecords];

    // Detect distinct months & years in the parsed records
    const periodMap = new Map<string, { month: number; year: number; count: number }>();
    allRecords.forEach(r => {
      const key = `${r.month}_${r.year}`;
      const p = periodMap.get(key) || { month: r.month, year: r.year, count: 0 };
      p.count++;
      periodMap.set(key, p);
    });

    const detectedPeriods = Array.from(periodMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    const periodSummaryStr = detectedPeriods
      .map(p => `Tháng ${p.month < 10 ? `0${p.month}` : p.month}/${p.year} (${p.count} biên lai)`)
      .join(', ');

    return {
      success: allRecords.length > 0,
      d11aRecords,
      d11aHtRecords,
      allRecords,
      sheetNames,
      sheetsInfo,
      detectedPeriods,
      message: `Đọc dữ liệu thành công! Tìm thấy: ${periodSummaryStr || 'Không xác định kỳ'}. Tổng: ${allRecords.length} biên lai.`,
      errors: []
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('File parsing error:', err);
    return {
      success: false,
      d11aRecords: [],
      d11aHtRecords: [],
      allRecords: [],
      sheetNames: [],
      sheetsInfo: [],
      detectedPeriods: [],
      message: `Lỗi khi xử lý file: ${errMsg}`,
      errors: [errMsg]
    };
  }
};

export interface DualParseResult {
  success: boolean;
  d11aRecords: D11aRow[];
  d11aHtRecords: D11aRow[];
  allRecords: D11aRow[];
  detectedPeriods: { month: number; year: number; count: number }[];
  file1Name: string;
  file1Count: number;
  file2Name: string;
  file2Count: number;
  message: string;
  errors: string[];
}

// Parse 2 separate files simultaneously (File 1 = D11A, File 2 = D11A_HT)
export const parseTwoSeparateFiles = async (
  file1: File | null,
  file2: File | null
): Promise<DualParseResult> => {
  const errors: string[] = [];
  let d11aRecords: D11aRow[] = [];
  let d11aHtRecords: D11aRow[] = [];
  let f1Name = '';
  let f2Name = '';

  if (!file1 && !file2) {
    return {
      success: false,
      d11aRecords: [],
      d11aHtRecords: [],
      allRecords: [],
      detectedPeriods: [],
      file1Name: '',
      file1Count: 0,
      file2Name: '',
      file2Count: 0,
      message: 'Vui lòng chọn ít nhất một file để nạp.',
      errors: ['Chưa chọn file']
    };
  }

  // Parse File 1 as D11A
  if (file1) {
    f1Name = file1.name;
    const res1 = await parseUploadedFile(file1, 'D11A');
    if (res1.success) {
      d11aRecords = res1.allRecords.map(r => ({ ...r, source: 'D11A' as DataSourceType }));
    } else {
      errors.push(`Sheet D11A (${file1.name}): ${res1.message}`);
    }
  }

  // Parse File 2 as D11A_HT — file thu hồi có schema KHÁC D11A (15 cột), nên
  // dùng bộ đọc riêng rồi quy đổi về D11aRow để các màn hình cũ vẫn chạy.
  if (file2) {
    f2Name = file2.name;
    try {
      const sheets = await readFileToSheets(file2);
      const sheet = pickSheet(sheets, 'D11A_HT');
      if (!sheet) throw new Error('Không tìm thấy sheet dữ liệu.');
      const ht = parseHtSheet(sheet.rows);
      const period = ht.period ?? { month: 0, year: 0 };
      d11aHtRecords = ht.rows.map((r, idx) => {
        const commission = Math.round(r.hoanTraNTG * r.tyLeThuHoi);
        return {
          id: `ht_${r.pointCode}_${idx}`,
          stt: r.stt,
          source: 'D11A_HT' as DataSourceType,
          category: 'BHYT Hộ gia đình (Thu hồi)',
          pointCode: r.pointCode,
          staffName: r.staffName,
          staffId: r.staffId,
          participantName: r.participantName,
          bhxhCode: r.bhxhCode,
          receiptNumber: r.dotPhatSinhGiam || r.dotPhatSinh || '',
          receiptDate: '',
          paymentMethod: '',
          newRevenue: 0,
          newRate: 0,
          newCommission: 0,
          regRevenue: 0,
          regRate: 0,
          regCommission: 0,
          totalRevenue: 0,
          totalCommission: commission,
          notes: r.ghiChu,
          month: period.month,
          year: period.year,
          quarter: period.month ? Math.ceil(period.month / 3) : 0,
          // Trường riêng của bảng thu hồi
          mucDong: r.mucDong,
          soThangGiam: r.soThangGiam,
          hoanTraNTG: r.hoanTraNTG,
          tyLeThuHoi: r.tyLeThuHoi,
          dotPhatSinh: r.dotPhatSinh,
          dotPhatSinhGiam: r.dotPhatSinhGiam,
          daHoanTra: r.daHoanTra,
        } as D11aRow;
      });
      if (d11aHtRecords.length === 0) {
        errors.push(`Sheet D11A_HT (${file2.name}): không đọc được dòng thu hồi nào.`);
      }

      // File D11A_HT không có cột mã nhân viên. Gán dòng thu hồi về nhân viên
      // nếu điểm thu chỉ có đúng 1 nhân viên; còn lại gom theo điểm thu để
      // không bịa người nhận.
      const staffByPoint = new Map<string, Map<string, string>>();
      for (const r of d11aRecords) {
        if (!r.staffId) continue;
        const map = staffByPoint.get(r.pointCode) ?? new Map<string, string>();
        map.set(r.staffId, r.staffName);
        staffByPoint.set(r.pointCode, map);
      }
      for (const h of d11aHtRecords) {
        const map = staffByPoint.get(h.pointCode);
        if (map && map.size === 1) {
          const [id, name] = [...map.entries()][0];
          h.staffId = id;
          h.staffName = name;
        } else {
          h.staffId = `HT:${h.pointCode}`;
          h.staffName = `Thu hồi điểm ${h.pointCode}`;
        }
      }
    } catch (e) {
      errors.push(`Sheet D11A_HT (${file2.name}): ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const allRecords = [...d11aRecords, ...d11aHtRecords];

  // Detect periods
  const periodMap = new Map<string, { month: number; year: number; count: number }>();
  allRecords.forEach(r => {
    const key = `${r.month}_${r.year}`;
    const p = periodMap.get(key) || { month: r.month, year: r.year, count: 0 };
    p.count++;
    periodMap.set(key, p);
  });

  const detectedPeriods = Array.from(periodMap.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  const success = allRecords.length > 0;
  let msg = '';
  if (file1 && file2) {
    msg = `Đã đọc 2 sheet: D11A (${d11aRecords.length} dòng) và D11A_HT (${d11aHtRecords.length} dòng thu hồi). Tổng: ${allRecords.length} dòng.`;
  } else if (file1) {
    msg = `Đã đọc sheet D11A: ${d11aRecords.length} dòng.`;
  } else if (file2) {
    msg = `Đã đọc sheet D11A_HT: ${d11aHtRecords.length} dòng thu hồi.`;
  }

  return {
    success,
    d11aRecords,
    d11aHtRecords,
    allRecords,
    detectedPeriods,
    file1Name: f1Name,
    file1Count: d11aRecords.length,
    file2Name: f2Name,
    file2Count: d11aHtRecords.length,
    message: msg,
    errors
  };
};
