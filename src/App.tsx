/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { D11aRow, FilterState, AgencySettings, StaffSummaryRow } from './types/index.ts';
import { 
  loadStoredRecords, 
  saveStoredRecords, 
  loadStoredSettings, 
  saveStoredSettings, 
  clearAllStoredData,
  getStorageMetrics
} from './utils/storage.ts';
import { filterAndCalculate } from './utils/calculator.ts';
import { downloadStandardTemplate } from './utils/excelExport.ts';
import { exportBook3 } from './utils/book3Export.ts';
import { buildBook3FromRecords } from './utils/book3FromRecords.ts';
import { loadPointNames, PointNameMap } from './data/pointNames.ts';
import { D11A, D11A_HT, BOOK3 } from './data/templateNames.ts';

// Components
import { Navbar } from './components/Navbar.tsx';
import { Sidebar, SidebarMenuItem } from './components/Sidebar.tsx';
import { FilterBar } from './components/FilterBar.tsx';
import { SummaryCards, SummaryBlockId } from './components/SummaryCards.tsx';
import { Book3Table } from './components/Book3Table.tsx';
import { D11aTable } from './components/D11aTable.tsx';
import { PointStaffSummaryTable } from './components/PointStaffSummaryTable.tsx';
import { ComparisonView } from './components/ComparisonView.tsx';
import { AnalyticsCharts } from './components/AnalyticsCharts.tsx';
import { UploadModal, ImportStrategy } from './components/UploadModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { SystemModal } from './components/SystemModal.tsx';
import { StaffDetailModal } from './components/StaffDetailModal.tsx';
import { AddRecordModal } from './components/AddRecordModal.tsx';
import { PeriodManagerModal } from './components/PeriodManagerModal.tsx';
import { RefundTable } from './components/RefundTable.tsx';
import { RATE_NEW, RATE_REG } from './constants.ts';

import { 
  Upload, 
  Download, 
  Printer, 
  Calendar, 
  PlusCircle,
  GitCompare
} from 'lucide-react';

export default function App() {
  // 1. Persistent Records & Settings State
  const [records, setRecords] = useState<D11aRow[]>(() => loadStoredRecords());
  const [settings, setSettings] = useState<AgencySettings>(() => loadStoredSettings());
  const [storageMetrics, setStorageMetrics] = useState(getStorageMetrics());

  // 2. Active Sidebar Menu Item
  const [activeMenuItem, setActiveMenuItem] = useState<SidebarMenuItem>('dashboard');

  // 3. Active Notification Block (Controls which table appears directly below)
  const [activeBlockId, setActiveBlockId] = useState<SummaryBlockId>('hoahong');

  // Secondary views (Comparative analysis, Analytics charts)
  const [secondaryView, setSecondaryView] = useState<'none' | 'compare' | 'analytics'>('none');

  // 4. Filter State — mặc định theo THÁNG HIỆN TẠI, không gán cứng kỳ nào
  const now = new Date();
  const [filter, setFilter] = useState<FilterState>({
    periodType: 'month',
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    quarter: Math.ceil((now.getMonth() + 1) / 3),
    startDate: '',
    endDate: '',
    source: 'ALL',
    pointCode: '',
    staffId: '',
    search: '',
  });

  // 5. Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSystemOpen, setIsSystemOpen] = useState(false);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [isPeriodManagerOpen, setIsPeriodManagerOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffSummaryRow | null>(null);

  // Sync with LocalStorage whenever records change
  useEffect(() => {
    saveStoredRecords(records);
    setStorageMetrics(getStorageMetrics());
  }, [records]);

  // Sync settings with LocalStorage
  useEffect(() => {
    saveStoredSettings(settings);
    setStorageMetrics(getStorageMetrics());
  }, [settings]);

  // Available points and staff lists for dropdown filters
  const availablePoints = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach(r => {
      if (r.pointCode && !map.has(r.pointCode)) {
        map.set(r.pointCode, r.pointName || `Điểm thu ${r.pointCode}`);
      }
    });
    return Array.from(map.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [records]);

  const availableStaff = useMemo(() => {
    const map = new Map<string, { id: string; name: string; pointCode: string }>();
    records.forEach(r => {
      if (r.staffId && !map.has(r.staffId)) {
        map.set(r.staffId, { id: r.staffId, name: r.staffName, pointCode: r.pointCode });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [records]);

  const availableYears = useMemo(() => {
    // Chỉ lấy năm có trong dữ liệu thật đã nạp
    const set = new Set<number>();
    records.forEach(r => {
      if (r.year) set.add(r.year);
    });
    if (set.size === 0) set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [records]);

  // Distinct months in records for quick switcher
  const existingMonths = useMemo(() => {
    const map = new Map<string, { month: number; year: number; count: number }>();
    records.forEach(r => {
      const key = `${r.month}_${r.year}`;
      const item = map.get(key) || { month: r.month, year: r.year, count: 0 };
      item.count++;
      map.set(key, item);
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [records]);

  // Run calculation engine
  const calculation = useMemo(() => {
    return filterAndCalculate(records, filter, settings);
  }, [records, filter, settings]);

  // Danh mục mã điểm thu -> tên đại lý thu (lấy từ public/point-names.json)
  const [pointNames, setPointNames] = useState<PointNameMap>({});
  useEffect(() => {
    loadPointNames().then(setPointNames).catch(() => setPointNames({}));
  }, []);

  // Số liệu Book3 theo đúng kỳ đang lọc
  const book3 = useMemo(
    () => buildBook3FromRecords(calculation.filteredRecords, pointNames),
    [calculation, pointNames]
  );

  // Handle Excel Export (Print-ready A4 Landscape)
  const handleExportExcel = () => {
    exportBook3({
      rows: book3.rows,
      totals: book3.totals,
      month: filter.month,
      year: filter.year,
      agencyName: settings.agencyName,
    });
  };

  // Handle Direct Print
  const handlePrint = () => {
    window.print();
  };

  // Handle Left Sidebar Menu Selection
  const handleSelectMenuItem = (item: SidebarMenuItem) => {
    setActiveMenuItem(item);
    if (item === 'dashboard') {
      setSecondaryView('none');
    } else if (item === 'upload') {
      setIsUploadOpen(true);
    } else if (item === 'months') {
      setIsPeriodManagerOpen(true);
    } else if (item === 'compare') {
      setSecondaryView(secondaryView === 'compare' ? 'none' : 'compare');
    } else if (item === 'settings') {
      setIsSettingsOpen(true);
    } else if (item === 'system') {
      setIsSystemOpen(true);
    }
  };

  // Handle Importing Data from UploadModal
  const handleImportData = (
    newRecords: D11aRow[], 
    strategy: ImportStrategy, 
    detectedPeriods: { month: number; year: number }[]
  ) => {
    if (strategy === 'replace_all') {
      setRecords(newRecords);
    } else if (strategy === 'replace_period') {
      const periodKeys = new Set(detectedPeriods.map(p => `${p.month}_${p.year}`));
      setRecords(prev => {
        const kept = prev.filter(r => !periodKeys.has(`${r.month}_${r.year}`));
        return [...kept, ...newRecords];
      });
    } else {
      // append_dedup: preserve previous months, merge new records
      setRecords(prev => {
        const existingKeyMap = new Map<string, number>();
        prev.forEach((r, idx) => {
          const key = `${r.receiptNumber}_${r.receiptDate}_${r.pointCode}_${r.source}`;
          existingKeyMap.set(key, idx);
        });

        const updated = [...prev];
        newRecords.forEach(nr => {
          const key = `${nr.receiptNumber}_${nr.receiptDate}_${nr.pointCode}_${nr.source}`;
          if (existingKeyMap.has(key)) {
            const idx = existingKeyMap.get(key)!;
            updated[idx] = nr;
          } else {
            updated.push(nr);
          }
        });
        return updated;
      });
    }

    // Auto switch filter to the first detected month in the newly uploaded file
    if (detectedPeriods.length > 0) {
      const p = detectedPeriods[0];
      setFilter(prev => ({
        ...prev,
        periodType: 'month',
        month: p.month,
        year: p.year,
        quarter: Math.ceil(p.month / 3)
      }));
    }
  };

  // Handle Deleting a specific month
  const handleDeletePeriod = (month: number, year: number) => {
    setRecords(prev => prev.filter(r => !(r.month === month && r.year === year)));
  };

  // Xoá dữ liệu và đưa bộ lọc về tháng hiện tại
  const handleClearData = () => {
    const empty = clearAllStoredData();
    setRecords(empty);
    const d = new Date();
    setFilter(prev => ({
      ...prev,
      periodType: 'month',
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      quarter: Math.ceil((d.getMonth() + 1) / 3),
      pointCode: '',
      staffId: '',
      search: '',
    }));
  };

  // Handle Delete Single Record
  const handleDeleteRecord = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa dòng biên lai này không?')) {
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  // Handle Add Single Record
  const handleAddRecord = (record: D11aRow) => {
    setRecords(prev => [record, ...prev]);
  };

  // Filter by point code when clicked from points table
  const handleFilterByPoint = (pointCode: string) => {
    setFilter(prev => ({ ...prev, pointCode }));
    setActiveBlockId('hoahong');
    setSecondaryView('none');
  };

  const d11aCount = useMemo(() => records.filter(r => r.source === 'D11A').length, [records]);
  const d11aHtCount = useMemo(() => records.filter(r => r.source === 'D11A_HT').length, [records]);

  // Block details for header indicator
  const blockInfo = useMemo(() => {
    switch (activeBlockId) {
      case 'hoahong':
        return {
          title: BOOK3.title(filter.month, filter.year),
          badge: `${book3.rows.length} điểm thu • ${book3.totals.tongNguoi} người`,
          description: `Sheet ${BOOK3.sheetName(filter.month, filter.year)}`
        };
      case 'revenue':
        return {
          title: D11A.title,
          badge: `${calculation.d11aRecords.length} dòng`,
          description: `Sheet ${D11A.sheet} — tất cả biên lai trong kỳ`
        };
      case 'new_rev':
        return {
          title: `${D11A.title} — chỉ dòng thu mới (${(RATE_NEW * 100).toFixed(1)}%)`,
          badge: `${calculation.d11aRecords.filter(r => r.newRevenue > 0).length} dòng`,
          description: 'Các dòng thuộc cột "Đối tượng khai thác thu mới"'
        };
      case 'reg_rev':
        return {
          title: `${D11A.title} — chỉ dòng thu thường kỳ (${(RATE_REG * 100).toFixed(1)}%)`,
          badge: `${calculation.d11aRecords.filter(r => r.regRevenue > 0).length} dòng`,
          description: 'Các dòng thuộc cột "Đối tượng khai thác thu thường kỳ"'
        };
      case 'd11a':
        return {
          title: D11A.title,
          badge: `${calculation.d11aRecords.length} dòng`,
          description: `Sheet ${D11A.sheet}`
        };
      case 'd11a_ht':
        return {
          title: D11A_HT.title,
          badge: `${calculation.d11aHtRecords.length} dòng`,
          description: `Sheet ${D11A_HT.sheet}`
        };
      case 'scale':
        return {
          title: 'Bảng Tổng Hợp Theo Điểm Thu & Đội Ngũ Nhân Viên',
          badge: `${calculation.pointSummaries.length} điểm thu • ${calculation.staffSummaries.length} nhân viên`,
          description: 'Thống kê quy mô hoạt động, doanh thu và thù lao theo điểm thu và nhân viên'
        };
      default:
        return { title: 'Bảng Dữ Liệu', badge: '', description: '' };
    }
  }, [activeBlockId, calculation, book3, filter.month, filter.year]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased">
      {/* 1. Slim Unified Top Header */}
      <Navbar
        totalRecordsCount={records.length}
        d11aCount={d11aCount}
        d11aHtCount={d11aHtCount}
        storageSizeKB={storageMetrics.sizeKB}
        settings={settings}
        periodTitle={calculation.periodTitle}
        onPrint={handlePrint}
      />

      {/* Main Unified Workspace: Left Sidebar + Right Master Block */}
      <div className="flex-1 w-full max-w-none px-2 sm:px-3 lg:px-4 py-3 flex flex-col lg:flex-row gap-3 items-start">
        
        {/* ========================================================================= */}
        {/* KHỐI MENU BÊN TRÁI (LEFT SIDEBAR: 6 Menu Items) */}
        {/* ========================================================================= */}
        <Sidebar
          activeItem={activeMenuItem}
          onSelectMenuItem={handleSelectMenuItem}
          totalRecordsCount={records.length}
          storageSizeKB={storageMetrics.sizeKB}
          agencyName={settings.agencyName}
          currentMonth={filter.month}
          currentYear={filter.year}
          onSelectMonth={(month) => {
            setFilter(prev => ({
              ...prev,
              periodType: 'month',
              month,
              quarter: Math.ceil(month / 3)
            }));
          }}
        />

        {/* ========================================================================= */}
        {/* KHỐI THỐNG NHẤT BÊN PHẢI (MASTER RIGHT PANEL) */}
        {/* ========================================================================= */}
        <main className="flex-1 min-w-0 w-full space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* 1. Months Bar / Quick Period Switcher (Persisted in LocalStorage) - Removed 'Quản lý chi tiết các tháng >>' text */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Đã lưu:
                </span>
                {existingMonths.map(p => (
                  <button
                    key={`${p.month}_${p.year}`}
                    onClick={() => setFilter(prev => ({
                      ...prev,
                      periodType: 'month',
                      month: p.month,
                      year: p.year,
                      quarter: Math.ceil(p.month / 3)
                    }))}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                      filter.periodType === 'month' && filter.month === p.month && filter.year === p.year
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-300'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {p.month < 10 ? `0${p.month}` : p.month}/{p.year} · {p.count} BL
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Integrated Filter Bar (Loại kỳ & Nút lọc theo tháng T1-T12 cùng 1 hàng; Bỏ dropdown Nguồn file & Khớp text) */}
            <div className="px-3 sm:px-4 py-3 bg-white border-b border-slate-200">
              <FilterBar
                filter={filter}
                onFilterChange={setFilter}
                availablePoints={availablePoints}
                availableStaff={availableStaff}
                availableYears={availableYears}
                totalRecordsMatched={calculation.filteredRecords.length}
              />
            </div>

            {/* 3. Notification / Metric Blocks with Crisp Borders (Clickable) */}
            <div className="px-3 sm:px-4 py-3 bg-slate-50/70 border-b border-slate-200">
              <SummaryCards
                totalRevenue={calculation.totals.totalRevenue}
                totalCommission={calculation.totals.totalCommission}
                newRevenue={calculation.totals.newRevenue}
                newCommission={calculation.totals.newCommission}
                regRevenue={calculation.totals.regRevenue}
                regCommission={calculation.totals.regCommission}
                totalReceipts={calculation.totals.totalReceipts}
                activeStaffCount={calculation.totals.activeStaffCount}
                activePointCount={calculation.totals.activePointCount}
                d11aRevenue={calculation.totals.d11aRevenue || 0}
                d11aCommission={calculation.totals.d11aCommission || 0}
                d11aCount={calculation.d11aRecords.length}
                d11aHtRevenue={calculation.totals.d11aHtRevenue || 0}
                d11aHtCommission={calculation.totals.d11aHtCommission || 0}
                d11aHtRefund={calculation.totals.d11aHtRefund || 0}
                d11aHtCount={calculation.d11aHtRecords.length}
                receiptCount={calculation.totals.receiptCount || 0}
                book3Total={book3.totals.tongPhaiChi}
                taxDeduction={calculation.totals.totalTax}
                netCommission={calculation.totals.totalNetCommission}
                applyTax={settings.applyTax}
                activeBlockId={activeBlockId}
                onSelectBlock={(blockId) => {
                  setActiveBlockId(blockId);
                  setSecondaryView('none');
                }}
                onResetFilter={() => {
                  setActiveBlockId('hoahong');
                  setSecondaryView('none');
                  setFilter(prev => ({
                    ...prev,
                    pointCode: '',
                    staffId: '',
                    search: '',
                    periodType: 'month'
                  }));
                }}
              />
            </div>

            {/* 4. Action Toolbar Down in the Work Area (User Request: Nạp 2 file xuất excel cho xuống dưới) */}
            <div className="px-5 py-3.5 bg-slate-100 border-b border-slate-300 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Primary Action 1: Nạp 2 File */}
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-sm"
                  title="Nạp sheet D11A và D11A_HT để tự động tổng hợp"
                >
                  <Upload className="w-4 h-4" />
                  <span>Nạp file</span>
                </button>

                {/* Primary Action 2: Xuất Excel In Ngay A4 */}
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-sm"
                  title="Xuất file Excel Book3 đúng biểu mẫu"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất Excel</span>
                </button>

                {/* Primary Action 3: In Biểu Mẫu */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
                  title="In trực tiếp biểu mẫu thù lao từ trình duyệt"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>In</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRecordOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Thêm biên lai</span>
                </button>
              </div>
            </div>

            {/* 5. Dynamic Data Table corresponding to the selected block */}
            <div className="p-2 sm:p-3 bg-white">
              
              {/* Secondary View Overrides if active */}
              {secondaryView === 'compare' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <h3 className="font-bold text-sm text-indigo-900 flex items-center gap-2">
                      <GitCompare className="w-4 h-4 text-indigo-600" />
                      Bảng đối chiếu Sheet D11A (phát sinh) và Sheet D11A_HT (thu hồi)
                    </h3>
                    <button
                      onClick={() => setSecondaryView('none')}
                      className="text-xs text-blue-700 hover:underline font-bold cursor-pointer"
                    >
                      ‹ Quay lại bảng
                    </button>
                  </div>
                  <ComparisonView
                    staffSummaries={calculation.staffSummaries}
                    pointSummaries={calculation.pointSummaries}
                    totals={calculation.totals}
                    periodTitle={calculation.periodTitle}
                  />
                </div>
              )}

              {/* Default View: Dynamic Table matching the clicked notification block */}
              {secondaryView === 'none' && (
                <div>
                  {/* Table Header Indicator (Cleaned of instruction text) */}
                  <div className={`mb-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 ${activeBlockId === 'hoahong' ? 'hidden' : ''}`}>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 " />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-slate-900 tracking-tight">
                          {blockInfo.title}
                        </span>
                        <span className="text-3xs font-extrabold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                          {blockInfo.badge}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1. KHỐI BOOK3 — đúng biểu mẫu tổng hợp số phải chi hoa hồng đại lý thu */}
                  {activeBlockId === 'hoahong' && (
                    <Book3Table
                      rows={book3.rows}
                      totals={book3.totals}
                      month={filter.month}
                      year={filter.year}
                      agencyName={settings.agencyName}
                    />
                  )}

                  {/* 2. KHỐI DOANH THU: bảng D11A đầy đủ */}
                  {activeBlockId === 'revenue' && (
                    <D11aTable
                      records={calculation.d11aRecords}
                      month={filter.month}
                      year={filter.year}
                      agencyName={settings.agencyName}
                      filterKind="ALL"
                      onDeleteRecord={handleDeleteRecord}
                    />
                  )}

                  {/* 3. KHỐI THU MỚI: chỉ các dòng cột J */}
                  {activeBlockId === 'new_rev' && (
                    <D11aTable
                      records={calculation.d11aRecords}
                      month={filter.month}
                      year={filter.year}
                      agencyName={settings.agencyName}
                      filterKind="NEW"
                      onDeleteRecord={handleDeleteRecord}
                    />
                  )}

                  {/* 4. KHỐI THU THƯỜNG KỲ: chỉ các dòng cột M */}
                  {activeBlockId === 'reg_rev' && (
                    <D11aTable
                      records={calculation.d11aRecords}
                      month={filter.month}
                      year={filter.year}
                      agencyName={settings.agencyName}
                      filterKind="REG"
                      onDeleteRecord={handleDeleteRecord}
                    />
                  )}

                  {/* 5. KHỐI SHEET D11A */}
                  {activeBlockId === 'd11a' && (
                    <D11aTable
                      records={calculation.d11aRecords}
                      month={filter.month}
                      year={filter.year}
                      agencyName={settings.agencyName}
                      filterKind="ALL"
                      onDeleteRecord={handleDeleteRecord}
                    />
                  )}

                  {/* 6. KHỐI SHEET D11A_HT */}
                  {activeBlockId === 'd11a_ht' && (
                    <RefundTable
                      records={calculation.d11aHtRecords}
                      month={filter.month}
                      year={filter.year}
                      agencyName={settings.agencyName}
                      onDeleteRecord={handleDeleteRecord}
                    />
                  )}

                  {/* 7. KHỐI QUY MÔ: Thống kê Điểm thu & Đội ngũ nhân viên */}
                  {activeBlockId === 'scale' && (
                    <PointStaffSummaryTable
                      pointSummaries={calculation.pointSummaries}
                      staffSummaries={calculation.staffSummaries}
                      periodTitle={calculation.periodTitle}
                      onSelectStaff={setSelectedStaff}
                      onFilterByPoint={handleFilterByPoint}
                    />
                  )}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-2 text-center text-2xs text-slate-400">
        <div className="w-full max-w-none px-3 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{settings.agencyName}</span>
        </div>
      </footer>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onImportData={handleImportData}
        agencyName={settings.agencyName}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        records={records}
        storageSizeKB={storageMetrics.sizeKB}
        lastSync={storageMetrics.lastSync}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSettings={setSettings}
        onRestoreData={(recs, sett) => {
          setRecords(recs);
          if (sett) setSettings(sett);
        }}
        onClearData={handleClearData}
      />

      <SystemModal
        isOpen={isSystemOpen}
        records={records}
        settings={settings}
        storageSizeKB={storageMetrics.sizeKB}
        lastSync={storageMetrics.lastSync}
        onClose={() => setIsSystemOpen(false)}
        onRestoreData={(recs, sett) => {
          setRecords(recs);
          if (sett) setSettings(sett);
        }}
        onClearData={handleClearData}
      />

      <StaffDetailModal
        staff={selectedStaff}
        periodTitle={calculation.periodTitle}
        agencyName={settings.agencyName}
        onClose={() => setSelectedStaff(null)}
      />

      <AddRecordModal
        isOpen={isAddRecordOpen}
        activeSheet={activeBlockId === 'd11a_ht' ? 'D11A_HT' : 'D11A'}
        availablePoints={availablePoints}
        availableStaff={availableStaff}
        onClose={() => setIsAddRecordOpen(false)}
        onAddRecord={handleAddRecord}
      />

      <PeriodManagerModal
        isOpen={isPeriodManagerOpen}
        records={records}
        activePeriodTitle={calculation.periodTitle}
        onClose={() => setIsPeriodManagerOpen(false)}
        onSelectPeriod={(month, year) => {
          setFilter(prev => ({
            ...prev,
            periodType: 'month',
            month,
            year,
            quarter: Math.ceil(month / 3)
          }));
        }}
        onDeletePeriod={handleDeletePeriod}
      />
    </div>
  );
}
