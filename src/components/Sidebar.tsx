/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  CalendarRange, 
  GitCompare, 
  UserCheck, 
  Server,
  FileSpreadsheet,
  HardDrive,
  Calendar,
  Check
} from 'lucide-react';

export type SidebarMenuItem = 
  | 'dashboard' 
  | 'upload' 
  | 'months' 
  | 'compare' 
  | 'settings' 
  | 'system';

interface SidebarProps {
  activeItem: SidebarMenuItem;
  onSelectMenuItem: (item: SidebarMenuItem) => void;
  totalRecordsCount: number;
  storageSizeKB: string;
  agencyName: string;
  currentMonth: number;
  currentYear: number;
  onSelectMonth: (month: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeItem,
  onSelectMenuItem,
  totalRecordsCount,
  storageSizeKB,
  agencyName,
  currentMonth,
  currentYear,
  onSelectMonth
}) => {
  const menuItems = [
    {
      id: 'dashboard' as SidebarMenuItem,
      label: 'Tổng quan',
      icon: LayoutDashboard,
      description: 'Bảng tổng hợp thù lao & chỉ số'
    },
    {
      id: 'upload' as SidebarMenuItem,
      label: 'Tải file lên',
      icon: UploadCloud,
      description: 'Nạp sheet D11A & D11A_HT'
    },
    {
      id: 'months' as SidebarMenuItem,
      label: 'Quản lý các tháng',
      icon: CalendarRange,
      description: 'Xem, chuyển hoặc xóa từng tháng'
    },
    {
      id: 'compare' as SidebarMenuItem,
      label: 'So sánh phát sinh',
      icon: GitCompare,
      description: 'Đối chiếu D11A và D11A_HT'
    },
    {
      id: 'settings' as SidebarMenuItem,
      label: 'Cài đặt người ký',
      icon: UserCheck,
      description: 'Thông tin cơ quan & Người ký'
    },
    {
      id: 'system' as SidebarMenuItem,
      label: 'Hệ thống & sao lưu',
      icon: Server,
      description: 'Sao lưu, phục hồi & LocalStorage'
    }
  ];

  return (
    <aside 
      className="w-56 shrink-0 rounded-2xl flex flex-col justify-between p-3.5 shadow-xl border sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto z-20 text-white scrollbar-thin scrollbar-thumb-sky-700/50"
      style={{ 
        borderColor: '#017cb5', 
        backgroundColor: '#0c567a' 
      }}
    >
      
      {/* Upper Content: Brand, Menu Navigation, and Quick Month Filter */}
      <div className="space-y-3.5">
        
        {/* Brand Header */}
        <div className="flex items-center space-x-2.5 pb-3 border-b border-[#146b94]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-950/40 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-black uppercase text-white tracking-wider truncate">
              {agencyName || 'BHXH'}
            </h2>
          </div>
        </div>

        {/* 6 Main Navigation Menu Items */}
        <nav className="space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                title={item.description}
                type="button"
                onClick={() => onSelectMenuItem(item.id)}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-2.5 group ${
                  isActive
                    ? 'bg-sky-500 text-white font-bold shadow-md shadow-sky-950/30 ring-1 ring-sky-300'
                    : 'text-sky-100 hover:bg-[#116994] hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform ${
                  isActive ? 'text-white' : 'text-sky-300 group-hover:text-white group-hover:scale-105'
                }`} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate leading-tight">
                    {item.label}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* LỌC THEO THÁNG INTEGRATED IN THE SIDEBAR MENU (Replaces the top filter row as requested) */}
        <div className="pt-3 border-t border-[#146b94] space-y-2">
          <div className="flex items-center justify-between text-2xs font-bold text-sky-200 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-300" />
              Tháng
            </span>
          </div>

          {/* 12 Month Buttons in a Compact, Elegant Grid (4 cols x 3 rows) */}
          <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-[#094868] border border-[#166d96]">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
              const isSelected = currentMonth === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onSelectMonth(m)}
                  className={`h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? 'bg-sky-400 text-slate-950 shadow-md font-black '
                      : 'bg-[#0f5478] hover:bg-[#156e9c] text-sky-100'
                  }`}
                  title={`Xem báo cáo thù lao Tháng ${m < 10 ? `0${m}` : m}/${currentYear}`}
                >
                  T{m}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Footer LocalStorage Status in Sidebar */}
      <div className="pt-3 mt-3 border-t border-[#146b94] text-3xs text-sky-200/90 space-y-1">
        <div className="flex items-center justify-between text-white font-medium">
          <span className="flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            Bộ nhớ:
          </span>
          <span className="text-emerald-300 font-mono font-bold">{storageSizeKB} KB</span>
        </div>
        <div className="text-sky-200/80 text-3xs">
          Tổng hồ sơ: <strong className="text-white">{totalRecordsCount}</strong> biên lai
        </div>
      </div>

    </aside>
  );
};
