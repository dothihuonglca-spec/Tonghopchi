/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StaffSummaryRow, PointSummaryRow } from '../types/index.ts';
import { formatCurrency } from '../utils/excelExport.ts';
import { RATE_NEW, RATE_REG } from '../constants.ts';
import { Award, Building2, PieChart, TrendingUp, Users } from 'lucide-react';

interface AnalyticsChartsProps {
  staffSummaries: StaffSummaryRow[];
  pointSummaries: PointSummaryRow[];
  newCommission: number;
  regCommission: number;
  totalCommission: number;
  periodTitle: string;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  staffSummaries,
  pointSummaries,
  newCommission,
  regCommission,
  totalCommission,
  periodTitle
}) => {
  const topStaff = staffSummaries.slice(0, 7);
  const maxStaffCom = Math.max(...topStaff.map(s => s.totalCommission), 1);
  const maxPointCom = Math.max(...pointSummaries.map(p => p.totalCommission), 1);

  const newComPercent = totalCommission > 0 ? ((newCommission / totalCommission) * 100).toFixed(1) : '0';
  const regComPercent = totalCommission > 0 ? ((regCommission / totalCommission) * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Top Staff Performers */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">Top Nhân Viên Thu Thù Lao Cao Nhất</h3>
              <p className="text-xs text-slate-500">Xếp hạng theo hoa hồng được hưởng ({periodTitle})</p>
            </div>
          </div>
        </div>

        <div className="space-y-3.5 mt-4">
          {topStaff.map((staff, idx) => {
            const pct = Math.round((staff.totalCommission / maxStaffCom) * 100);
            return (
              <div key={staff.staffId} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-3xs ${
                      idx === 0 ? 'bg-amber-400 text-amber-950 shadow-xs' :
                      idx === 1 ? 'bg-slate-300 text-slate-800' :
                      idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-900">{staff.staffName}</span>
                    <span className="text-3xs text-slate-400 font-mono">({staff.pointCode})</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(staff.totalCommission)} VNĐ
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      idx === 0 ? 'bg-gradient-to-r from-blue-600 to-indigo-600' :
                      idx === 1 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                      idx === 2 ? 'bg-gradient-to-r from-cyan-500 to-teal-500' :
                      'bg-slate-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart 2: Commission by Collection Point */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">Thù Lao Theo Điểm Thu</h3>
              <p className="text-xs text-slate-500">Doanh thu và hoa hồng trích cho các điểm ({periodTitle})</p>
            </div>
          </div>
        </div>

        <div className="space-y-3.5 mt-4">
          {pointSummaries.map((point) => {
            const pct = Math.round((point.totalCommission / maxPointCom) * 100);
            return (
              <div key={point.pointCode} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-3xs font-bold border border-slate-200">
                      {point.pointCode}
                    </span>
                    <span className="font-semibold text-slate-900 truncate max-w-[180px] sm:max-w-[240px]">
                      {point.pointName}
                    </span>
                    <span className="text-3xs text-slate-400">({point.staffCount} NV)</span>
                  </div>
                  <span className="font-mono font-bold text-blue-900">
                    {formatCurrency(point.totalCommission)} VNĐ
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart 3: Commission Composition (New vs Regular) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">Cơ Cấu Thù Lao: Thu Mới vs Thu Thường Kỳ</h3>
              <p className="text-xs text-slate-500">So sánh mức chi thù lao theo nhóm đối tượng khai thác</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
          {/* Progress bar visual */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-amber-800">
                  <span className="w-3 h-3 rounded-md bg-amber-500" />
                  Khai thác thu mới ({newComPercent}%)
                </span>
                <span className="font-mono text-slate-900">{formatCurrency(newCommission)} VNĐ</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${newComPercent}%` }}
                />
              </div>
              <p className="text-3xs text-slate-400 mt-1">Tỷ lệ trích thù lao chuẩn: {(RATE_NEW * 100).toFixed(1)}%</p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-blue-800">
                  <span className="w-3 h-3 rounded-md bg-blue-600" />
                  Khai thác thu thường kỳ ({regComPercent}%)
                </span>
                <span className="font-mono text-slate-900">{formatCurrency(regCommission)} VNĐ</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${regComPercent}%` }}
                />
              </div>
              <p className="text-3xs text-slate-400 mt-1">Tỷ lệ trích thù lao chuẩn: {(RATE_REG * 100).toFixed(1)}%</p>
            </div>
          </div>

          {/* Quick Notes Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Đánh giá hiệu quả kinh doanh kỳ này:
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-2xs">
              <li>
                Thu thường kỳ (đáo hạn/tái tục) chiếm tỷ trọng chủ lực ({regComPercent}%), tạo nguồn thu ổn định cho nhân viên thu.
              </li>
              <li>
                Thu mới đạt tỷ lệ thù lao cao ({(RATE_NEW * 100).toFixed(1)}%), là động lực chính để tăng thu nhập cá nhân cho nhân viên năng nổ khai thác.
              </li>
              <li>
                Toàn bộ dữ liệu tính toán theo công thức chính xác: <code>Thù lao = NTG đóng * Tỷ lệ %</code>.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
