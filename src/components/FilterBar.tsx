/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Calendar, 
  Search, 
  X, 
  RotateCcw,
  MapPin,
  UserCheck,
  Check
} from 'lucide-react';
import { FilterState, PeriodType } from '../types/index.ts';

interface FilterBarProps {
  filter: FilterState;
  onFilterChange: (newFilter: FilterState) => void;
  availablePoints: { code: string; name: string }[];
  availableStaff: { id: string; name: string; pointCode: string }[];
  availableYears: number[];
  totalRecordsMatched: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  availablePoints,
  availableStaff,
  availableYears
}) => {
  const handlePeriodTypeChange = (periodType: PeriodType) => {
    onFilterChange({ ...filter, periodType });
  };

  const handleSelectQuickMonth = (monthNumber: number) => {
    onFilterChange({
      ...filter,
      periodType: 'month',
      month: monthNumber,
      quarter: Math.ceil(monthNumber / 3)
    });
  };

  const handleResetFilters = () => {
    const d = new Date();
    onFilterChange({
      periodType: 'month',
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      quarter: Math.ceil((d.getMonth() + 1) / 3),
      startDate: '',
      endDate: '',
      source: 'ALL',
      pointCode: '',
      staffId: '',
      search: ''
    });
  };

  const isFiltered = 
    filter.periodType !== 'month' || 
    filter.pointCode !== '' || 
    filter.staffId !== '' || 
    filter.search !== '';

  return (
    <div className="space-y-3">
      {/* Row 1: Loai Ky & Period Status (Month buttons moved to Sidebar menu) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-200">
        
        {/* Left: Loai ky */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-2xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Loại kỳ:
          </span>

          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => handlePeriodTypeChange('month')}
              className={`px-3 py-1 font-bold rounded-md transition-all cursor-pointer ${
                filter.periodType === 'month'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Tháng
            </button>
            <button
              onClick={() => handlePeriodTypeChange('quarter')}
              className={`px-3 py-1 font-bold rounded-md transition-all cursor-pointer ${
                filter.periodType === 'quarter'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Quý
            </button>
            <button
              onClick={() => handlePeriodTypeChange('year')}
              className={`px-3 py-1 font-bold rounded-md transition-all cursor-pointer ${
                filter.periodType === 'year'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Năm
            </button>
            <button
              onClick={() => handlePeriodTypeChange('custom')}
              className={`px-3 py-1 font-bold rounded-md transition-all cursor-pointer ${
                filter.periodType === 'custom'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khoảng ngày
            </button>
            <button
              onClick={() => handlePeriodTypeChange('all')}
              className={`px-3 py-1 font-bold rounded-md transition-all cursor-pointer ${
                filter.periodType === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả
            </button>
          </div>
        </div>

        {/* Right: Current period indicator & Reset filter button */}
        <div className="flex flex-wrap items-center gap-2 text-xs">

          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center space-x-1 px-2 py-1 text-slate-500 hover:text-red-600 rounded transition-colors cursor-pointer text-3xs font-semibold"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Secondary Dropdowns (Tháng, Năm, Điểm thu, Nhân viên, Tìm kiếm - NO Nguồn File, NO Khớp text) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Dynamic Period Dropdown for Month / Quarter / Year */}
        {filter.periodType === 'month' && (
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="block text-3xs font-bold text-slate-600 mb-1 uppercase">Tháng</label>
              <select
                value={filter.month}
                onChange={e => onFilterChange({ ...filter, month: parseInt(e.target.value, 10), quarter: Math.ceil(parseInt(e.target.value, 10) / 3) })}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Tháng {m < 10 ? `0${m}` : m}</option>
                ))}
              </select>
            </div>
            <div className="w-20">
              <label className="block text-3xs font-bold text-slate-600 mb-1 uppercase">Năm</label>
              <select
                value={filter.year}
                onChange={e => onFilterChange({ ...filter, year: parseInt(e.target.value, 10) })}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {filter.periodType === 'quarter' && (
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="block text-3xs font-bold text-slate-600 mb-1 uppercase">Quý</label>
              <select
                value={filter.quarter}
                onChange={e => onFilterChange({ ...filter, quarter: parseInt(e.target.value, 10) })}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Quý I (Tháng 1-3)</option>
                <option value={2}>Quý II (Tháng 4-6)</option>
                <option value={3}>Quý III (Tháng 7-9)</option>
                <option value={4}>Quý IV (Tháng 10-12)</option>
              </select>
            </div>
            <div className="w-20">
              <label className="block text-3xs font-bold text-slate-600 mb-1 uppercase">Năm</label>
              <select
                value={filter.year}
                onChange={e => onFilterChange({ ...filter, year: parseInt(e.target.value, 10) })}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {filter.periodType === 'year' && (
          <div>
            <label className="block text-3xs font-bold text-slate-600 mb-1 uppercase">Chọn Năm</label>
            <select
              value={filter.year}
              onChange={e => onFilterChange({ ...filter, year: parseInt(e.target.value, 10) })}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          </div>
        )}

        {filter.periodType === 'custom' && (
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="block text-3xs font-bold text-slate-600 mb-1 uppercase">Từ ngày</label>
              <input
                type="date"
                value={filter.startDate}
                onChange={e => onFilterChange({ ...filter, startDate: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-3xs font-bold text-slate-600 mb-1 uppercase">Đến ngày</label>
              <input
                type="date"
                value={filter.endDate}
                onChange={e => onFilterChange({ ...filter, endDate: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {filter.periodType === 'all' && (
          <div>
            <label className="block text-3xs font-bold text-slate-600 mb-1 uppercase">Thời gian</label>
            <div className="text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg px-2.5 py-1.5 border border-slate-200">
              Toàn bộ các năm
            </div>
          </div>
        )}

        {/* Điểm thu */}
        <div className="lg:col-span-1 sm:col-span-1">
          <label className="block text-3xs font-bold text-slate-600 mb-1 flex items-center gap-1 uppercase">
            <MapPin className="w-3 h-3 text-red-500" />
            Điểm thu
          </label>
          <select
            value={filter.pointCode}
            onChange={e => onFilterChange({ ...filter, pointCode: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả điểm thu ({availablePoints.length})</option>
            {availablePoints.map(p => (
              <option key={p.code} value={p.code}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Nhân viên thu */}
        <div className="lg:col-span-2 sm:col-span-1">
          <label className="block text-3xs font-bold text-slate-600 mb-1 flex items-center gap-1 uppercase">
            <UserCheck className="w-3 h-3 text-emerald-500" />
            Nhân viên thu
          </label>
          <select
            value={filter.staffId}
            onChange={e => onFilterChange({ ...filter, staffId: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả nhân viên ({availableStaff.length})</option>
            {availableStaff.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.pointCode})
              </option>
            ))}
          </select>
        </div>

        {/* Tìm kiếm */}
        <div className="lg:col-span-1 sm:col-span-2">
          <label className="block text-3xs font-bold text-slate-600 mb-1 uppercase">Tìm kiếm</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Tên, số BL..."
              value={filter.search}
              onChange={e => onFilterChange({ ...filter, search: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-7 pr-6 py-1.5 focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
            {filter.search && (
              <button
                onClick={() => onFilterChange({ ...filter, search: '' })}
                className="absolute right-1.5 top-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
