/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import logoBhxh from '../assets/bhxh-logo.png';
import { AgencySettings } from '../types/index.ts';
import { DEFAULT_AGENCY_NAME } from '../constants.ts';

interface NavbarProps {
  totalRecordsCount?: number;
  d11aCount?: number;
  d11aHtCount?: number;
  storageSizeKB?: string;
  settings: AgencySettings;
  periodTitle: string;
  onPrint?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  periodTitle
}) => {
  return (
    <header className="bg-[#135074] border-b border-[#0d3b57] sticky top-0 z-30 shadow-md text-white print:static">
      <div className="w-full max-w-none px-3 sm:px-4 lg:px-5">
        <div className="flex items-center justify-between gap-4 py-2 bg-[#135074]">

          {/* Logo + tên biểu mẫu + tên đơn vị */}
          <div className="flex items-center gap-3 min-w-0">
            {/*
              Logo nền xanh trùng màu thanh tiêu đề nên đặt trong đĩa trắng
              bo tròn + viền để tách khỏi nền.
            */}
            <div className="w-12 h-12 shrink-0 rounded-full bg-white p-1 ring-2 ring-white/80 shadow-md flex items-center justify-center">
              <img
                src={logoBhxh}
                alt="Logo Bảo hiểm xã hội Việt Nam"
                className="w-full h-full object-contain rounded-full"
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base lg:text-lg font-black uppercase tracking-tight text-white leading-tight truncate">
                Tổng hợp chi cho Đại lý thu BHXH hộ gia đình
              </h1>
              <p className="text-2xs sm:text-xs font-bold uppercase tracking-wide text-sky-100 truncate">
                {settings.agencyName || DEFAULT_AGENCY_NAME}
              </p>
            </div>
          </div>

          {/* Kỳ báo cáo */}
          <div className="hidden sm:flex flex-col items-end shrink-0">
            <span className="text-2xs uppercase tracking-wide text-sky-200">Kỳ báo cáo</span>
            <span className="text-xs font-bold text-white">{periodTitle}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
