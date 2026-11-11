/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { D11aRow, DataSourceType } from '../types/index.ts';
import { parseDateInfo } from '../utils/fileParser.ts';
import { RATE_NEW, RATE_REG } from '../constants.ts';
import { X, Plus, Save } from 'lucide-react';

interface AddRecordModalProps {
  isOpen: boolean;
  activeSheet: 'D11A' | 'D11A_HT' | 'ALL';
  availablePoints: { code: string; name: string }[];
  availableStaff: { id: string; name: string; pointCode: string }[];
  onClose: () => void;
  onAddRecord: (record: D11aRow) => void;
}

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  activeSheet,
  availablePoints,
  availableStaff,
  onClose,
  onAddRecord
}) => {
  const [source, setSource] = useState<DataSourceType>(activeSheet === 'D11A_HT' ? 'D11A_HT' : 'D11A');
  const [pointCode, setPointCode] = useState(availablePoints[0]?.code || '');
  const [staffName, setStaffName] = useState(availableStaff[0]?.name || '');
  const [staffId, setStaffId] = useState(availableStaff[0]?.id || '');
  const [participantName, setParticipantName] = useState('');
  const [bhxhCode, setBhxhCode] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [receiptDate, setReceiptDate] = useState(() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  });
  const [paymentMethod, setPaymentMethod] = useState('12');
  const [type, setType] = useState<'new' | 'reg'>('new');
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleStaffSelect = (id: string) => {
    const s = availableStaff.find(item => item.id === id);
    if (s) {
      setStaffId(s.id);
      setStaffName(s.name);
      setPointCode(s.pointCode);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantName.trim()) {
      alert('Vui lòng nhập họ và tên người tham gia!');
      return;
    }

    const dateInfo = parseDateInfo(receiptDate);
    const pointObj = availablePoints.find(p => p.code === pointCode);

    let newRevenue = 0;
    let newRate = 0;
    let newCommission = 0;
    let regRevenue = 0;
    let regRate = 0;
    let regCommission = 0;

    if (type === 'new') {
      newRevenue = amount;
      newRate = RATE_NEW;
      newCommission = Math.round(amount * RATE_NEW);
    } else {
      regRevenue = amount;
      regRate = RATE_REG;
      regCommission = Math.round(amount * RATE_REG);
    }

    const totalRevenue = newRevenue + regRevenue;
    const totalCommission = newCommission + regCommission;

    const newRecord: D11aRow = {
      id: `${source.toLowerCase()}_${Date.now()}`,
      stt: Date.now() % 10000,
      source,
      category: 'BHYT Hộ gia đình',
      pointCode,
      pointName: pointObj?.name || `Điểm thu ${pointCode}`,
      staffName,
      staffId,
      participantName: participantName.trim(),
      bhxhCode: bhxhCode.trim() || '0340' + Math.floor(10000000 + Math.random() * 90000000),
      receiptNumber: receiptNumber.trim() || 'BL' + Math.floor(10000 + Math.random() * 90000),
      receiptDate,
      paymentMethod,
      newRevenue,
      newRate,
      newCommission,
      regRevenue,
      regRate,
      regCommission,
      totalRevenue,
      totalCommission,
      notes: notes.trim(),
      month: dateInfo.month,
      year: dateInfo.year,
      quarter: dateInfo.quarter
    };

    onAddRecord(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Thêm Mới Biên Lai Thu BHXH / BHYT</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Nguồn sheet</label>
              <select
                value={source}
                onChange={e => setSource(e.target.value as DataSourceType)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-blue-700"
              >
                <option value="D11A">Sheet D11A</option>
                <option value="D11A_HT">Sheet D11A_HT</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Nhân viên thu</label>
              <select
                value={staffId}
                onChange={e => handleStaffSelect(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
              >
                {availableStaff.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.pointCode})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Họ tên người tham gia *</label>
              <input
                type="text"
                placeholder="VD: Nguyễn Văn An"
                value={participantName}
                onChange={e => setParticipantName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Mã số BHXH</label>
              <input
                type="text"
                placeholder="VD: 034095007514"
                value={bhxhCode}
                onChange={e => setBhxhCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Số biên lai</label>
              <input
                type="text"
                placeholder="VD: 0039544"
                value={receiptNumber}
                onChange={e => setReceiptNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Ngày biên lai</label>
              <input
                type="text"
                placeholder="dd/MM/yyyy"
                value={receiptDate}
                onChange={e => setReceiptDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Phương thức đóng</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
              >
                <option value="12">12 tháng</option>
                <option value="6">6 tháng</option>
                <option value="3">3 tháng</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Loại thu</label>
              <select
                value={type}
                onChange={e => {
                  const val = e.target.value as 'new' | 'reg';
                  setType(val);
                }}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold"
              >
                <option value="new">Thu mới (Thù lao {(RATE_NEW * 100).toFixed(1)}%)</option>
                <option value="reg">Thu thường kỳ (Thù lao {(RATE_REG * 100).toFixed(1)}%)</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Số tiền NTG đóng (VNĐ)</label>
              <input
                type="number"
                step="1000"
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-blue-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Ghi chú (Số đợt / hóa đơn)</label>
            <input
              type="text"
              placeholder="Số ghi chú (nếu có)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center space-x-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu biên lai</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
