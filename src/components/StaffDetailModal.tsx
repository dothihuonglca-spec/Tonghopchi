/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StaffSummaryRow } from '../types/index.ts';
import { formatCurrency } from '../utils/excelExport.ts';
import { X, User, Printer, Building2, Receipt, Coins, Calendar } from 'lucide-react';

interface StaffDetailModalProps {
  staff: StaffSummaryRow | null;
  periodTitle: string;
  agencyName: string;
  onClose: () => void;
}

export const StaffDetailModal: React.FC<StaffDetailModalProps> = ({
  staff,
  periodTitle,
  agencyName,
  onClose
}) => {
  if (!staff) return null;

  const handlePrintIndividualSlip = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">{staff.staffName}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                  {staff.staffId}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {staff.pointCode} - {staff.pointName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {periodTitle}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrintIndividualSlip}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In phiếu chi</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="p-6 border-b border-slate-100 bg-blue-50/20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <div className="text-slate-500 text-3xs uppercase font-medium">Tổng số thu của người tham gia</div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {formatCurrency(staff.totalRevenue)} VNĐ
              </div>
              <div className="text-3xs text-slate-400 mt-0.5">
                {staff.totalReceipts} biên lai phát sinh
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <div className="text-slate-500 text-3xs uppercase font-medium">Thù Lao Thu Mới</div>
              <div className="text-base font-bold text-amber-700 mt-1">
                {formatCurrency(staff.newCommission)} VNĐ
              </div>
              <div className="text-3xs text-slate-400 mt-0.5">
                Doanh thu: {formatCurrency(staff.newRevenue)} VNĐ
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <div className="text-slate-500 text-3xs uppercase font-medium">Thù Lao Thường Kỳ</div>
              <div className="text-base font-bold text-blue-700 mt-1">
                {formatCurrency(staff.regCommission)} VNĐ
              </div>
              <div className="text-3xs text-slate-400 mt-0.5">
                Doanh thu: {formatCurrency(staff.regRevenue)} VNĐ
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white p-3 rounded-xl shadow-xs">
              <div className="text-blue-200 text-3xs uppercase font-medium">Tổng Thù Lao Được Lĩnh</div>
              <div className="text-lg font-extrabold text-white mt-1">
                {formatCurrency(staff.netCommission)} VNĐ
              </div>
              {staff.taxDeduction > 0 && (
                <div className="text-3xs text-blue-200 mt-0.5">
                  Đã trừ thuế TNCN: -{formatCurrency(staff.taxDeduction)} VNĐ
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Individual Receipts Table */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center justify-between">
            <span>Danh sách chi tiết {staff.records.length} người tham gia:</span>
            <span className="text-slate-400 font-normal">Sắp xếp theo thứ tự biên lai</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-700 text-3xs uppercase font-bold text-center">
                <tr className="border-b border-slate-300">
                  <th className="px-2 py-2 border-r border-slate-300 w-10">STT</th>
                  <th className="px-2 py-2 border-r border-slate-300 w-16">Nguồn</th>
                  <th className="px-3 py-2 border-r border-slate-300 text-left">Họ tên người tham gia</th>
                  <th className="px-3 py-2 border-r border-slate-300 font-mono">Mã số BHXH</th>
                  <th className="px-2 py-2 border-r border-slate-300 font-mono">Số BL</th>
                  <th className="px-2 py-2 border-r border-slate-300">Ngày BL</th>
                  <th className="px-2 py-2 border-r border-slate-300 text-right">Thu mới</th>
                  <th className="px-2 py-2 border-r border-slate-300 text-right text-amber-800">Thù lao mới</th>
                  <th className="px-2 py-2 border-r border-slate-300 text-right">Số tiền phải chi thù lao</th>
                  <th className="px-2 py-2 border-r border-slate-300 text-right text-blue-800">Thù lao TK</th>
                  <th className="px-3 py-2 border-r border-slate-300 text-right font-bold bg-slate-100">Tổng thu</th>
                  <th className="px-3 py-2 text-right font-black text-blue-900 bg-blue-50">Thù lao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {staff.records.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50 text-slate-800">
                    <td className="px-2 py-1.5 text-center border-r border-slate-200 text-slate-400 font-mono text-3xs">
                      {i + 1}
                    </td>
                    <td className="px-2 py-1.5 text-center border-r border-slate-200">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-3xs font-bold ${
                        r.source === 'D11A' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {r.source}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-semibold text-slate-900">
                      {r.participantName}
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-mono text-slate-600">
                      {r.bhxhCode}
                    </td>
                    <td className="px-2 py-1.5 text-center border-r border-slate-200 font-mono text-slate-700">
                      {r.receiptNumber}
                    </td>
                    <td className="px-2 py-1.5 text-center border-r border-slate-200 font-mono text-slate-600">
                      {r.receiptDate}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-slate-200 font-mono text-slate-700">
                      {r.newRevenue > 0 ? formatCurrency(r.newRevenue) : '-'}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-slate-200 font-mono text-amber-700">
                      {r.newCommission > 0 ? formatCurrency(r.newCommission) : '-'}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-slate-200 font-mono text-slate-700">
                      {r.regRevenue > 0 ? formatCurrency(r.regRevenue) : '-'}
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-slate-200 font-mono text-blue-700">
                      {r.regCommission > 0 ? formatCurrency(r.regCommission) : '-'}
                    </td>
                    <td className="px-3 py-1.5 text-right border-r border-slate-200 font-bold text-slate-900 font-mono bg-slate-50/50">
                      {formatCurrency(r.totalRevenue)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-black text-blue-900 font-mono bg-blue-50/40">
                      {formatCurrency(r.totalCommission)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {agencyName} - Mẫu D11a-TS
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
