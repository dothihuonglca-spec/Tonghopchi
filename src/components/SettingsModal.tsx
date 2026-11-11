/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { AgencySettings, D11aRow } from '../types/index.ts';
import { exportBackupJSON, clearAllStoredData } from '../utils/storage.ts';
import { 
  X, 
  Settings, 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  HardDrive, 
  Check, 
  AlertTriangle,
  Building,
  UserCheck
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AgencySettings;
  records: D11aRow[];
  storageSizeKB: string;
  lastSync: string;
  onClose: () => void;
  onSaveSettings: (settings: AgencySettings) => void;
  onRestoreData: (records: D11aRow[], settings?: AgencySettings) => void;
  onClearData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  records,
  storageSizeKB,
  lastSync,
  onClose,
  onSaveSettings,
  onRestoreData,
  onClearData
}) => {
  const [formData, setFormData] = useState<AgencySettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleBackup = () => {
    exportBackupJSON(records, formData);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && Array.isArray(json.records)) {
          onRestoreData(json.records, json.settings);
          alert(`Khôi phục thành công ${json.records.length} bản ghi từ file sao lưu!`);
          onClose();
        } else {
          alert('File JSON sao lưu không hợp lệ.');
        }
      } catch (err) {
        alert('Lỗi đọc file JSON sao lưu.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Cài Đặt Đơn Vị & Quản Lý LocalStorage
              </h2>
              <p className="text-xs text-slate-500">
                Thông tin xuất biểu mẫu chuẩn BHXH và quản lý lưu trữ trình duyệt
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Agency Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Thông Tin Tổ Chức Dịch Vụ Thu (Đại Lý)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">Tên Tổ Chức Dịch Vụ Thu</label>
                <input
                  type="text"
                  value={formData.agencyName}
                  onChange={e => setFormData({ ...formData, agencyName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Mã Đơn Vị</label>
                <input
                  type="text"
                  value={formData.agencyCode}
                  onChange={e => setFormData({ ...formData, agencyCode: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Điện Thoại</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">Địa Chỉ</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Signatures on Document */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Chữ Ký Biểu Mẫu (Xuất Excel & In)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Người Lập Biểu</label>
                <input
                  type="text"
                  value={formData.preparerName}
                  onChange={e => setFormData({ ...formData, preparerName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Kế Toán Trưởng</label>
                <input
                  type="text"
                  value={formData.accountantName}
                  onChange={e => setFormData({ ...formData, accountantName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Thủ Trưởng Đơn Vị</label>
                <input
                  type="text"
                  value={formData.representativeName}
                  onChange={e => setFormData({ ...formData, representativeName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Tax Configuration */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Khấu trừ thuế Thu Nhập Cá Nhân (TNCN 10%)
                </div>
                <div className="text-2xs text-slate-500 mt-0.5">
                  Tự động tính thuế TNCN đối với thù lao đại lý/nhân viên thu theo quy định
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.applyTax}
                  onChange={e => setFormData({ ...formData, applyTax: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Section 4: LocalStorage Management & Backup */}
          <div className="space-y-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-emerald-600" />
                Lưu Trữ LocalStorage Trình Duyệt:
              </span>
              <span className="font-mono text-emerald-800 font-semibold">
                {records.length} dòng ({storageSizeKB} KB)
              </span>
            </div>

            <p className="text-2xs text-emerald-800">
              Dữ liệu của bạn được lưu trữ an toàn trong trình duyệt (LocalStorage). Khi tắt máy hoặc khởi động lại trình duyệt, toàn bộ số liệu vẫn được giữ nguyên đầy đủ.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleBackup}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Sao lưu dữ liệu (Tải file .JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => restoreFileInputRef.current?.click()}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Khôi phục từ file sao lưu</span>
              </button>

              <input
                ref={restoreFileInputRef}
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu trong LocalStorage không? Thao tác này không thể hoàn tác!')) {
                    onClearData();
                    onClose();
                  }
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 rounded-lg transition-colors cursor-pointer ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa sạch dữ liệu</span>
              </button>
            </div>
          </div>

          {/* Footer Save Button */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            {savedSuccess ? (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Đã lưu cài đặt thành công!
              </span>
            ) : <span />}

            <button
              type="submit"
              className="inline-flex items-center space-x-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Cài Đặt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
