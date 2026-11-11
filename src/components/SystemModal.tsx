/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { D11aRow, AgencySettings } from '../types/index.ts';
import { exportBackupJSON, clearAllStoredData } from '../utils/storage.ts';
import { 
  X, 
  Server, 
  Download, 
  Upload, 
  Trash2, 
  HardDrive, 
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Database
} from 'lucide-react';

interface SystemModalProps {
  isOpen: boolean;
  records: D11aRow[];
  settings: AgencySettings;
  storageSizeKB: string;
  lastSync: string;
  onClose: () => void;
  onRestoreData: (records: D11aRow[], settings?: AgencySettings) => void;
  onClearData: () => void;
}

export const SystemModal: React.FC<SystemModalProps> = ({
  isOpen,
  records,
  settings,
  storageSizeKB,
  lastSync,
  onClose,
  onRestoreData,
  onClearData
}) => {
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleBackup = () => {
    exportBackupJSON(records, settings);
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
          alert(`Khôi phục thành công ${json.records.length} bản ghi từ file sao lưu JSON!`);
          onClose();
        } else {
          alert('File JSON sao lưu không hợp lệ.');
        }
      } catch (err) {
        alert('Lỗi khi đọc file JSON sao lưu.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600 rounded-xl text-white">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Hệ Thống & Sao Lưu Khôi Phục</h2>
              <p className="text-2xs text-slate-300">Quản lý bộ nhớ LocalStorage và sao lưu dữ liệu máy tính</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Storage Status */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <HardDrive className="w-4 h-4 text-emerald-600" />
                Trạng thái lưu trữ LocalStorage:
              </span>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Hoạt động tốt
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                <div className="text-lg font-black text-slate-900">{records.length}</div>
                <div className="text-3xs text-slate-500 font-bold uppercase">Biên lai đã lưu</div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                <div className="text-lg font-black text-slate-900">{storageSizeKB} KB</div>
                <div className="text-3xs text-slate-500 font-bold uppercase">Dung lượng bộ nhớ</div>
              </div>
            </div>
            <p className="text-2xs text-slate-500 mt-1">
              Dữ liệu được lưu vĩnh viễn trực tiếp trên trình duyệt máy tính của bạn, không bị mất khi tắt máy hoặc đóng trang web.
            </p>
          </div>

          {/* Backup & Restore JSON */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-600" />
              Sao lưu & Phục hồi dữ liệu (File JSON)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Export Backup */}
              <button
                type="button"
                onClick={handleBackup}
                className="p-3.5 rounded-xl border-2 border-blue-200 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs mb-1">
                  <Download className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span>Sao lưu dữ liệu (Tải JSON)</span>
                </div>
                <p className="text-2xs text-slate-600">
                  Xuất toàn bộ biên lai các tháng và cài đặt ra máy tính để lưu trữ dự phòng.
                </p>
              </button>

              {/* Import Restore */}
              <button
                type="button"
                onClick={() => restoreFileInputRef.current?.click()}
                className="p-3.5 rounded-xl border-2 border-emerald-200 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs mb-1">
                  <Upload className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span>Khôi phục từ file JSON</span>
                </div>
                <p className="text-2xs text-slate-600">
                  Nhập lại toàn bộ dữ liệu từ file sao lưu JSON đã tải trước đây.
                </p>
              </button>
              <input
                ref={restoreFileInputRef}
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </div>
          </div>

          {/* Reset / Danger Zone */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Thao tác khởi tạo & xóa dữ liệu:
            </h3>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm('XÓA TOÀN BỘ dữ liệu đã nạp (mọi tháng) khỏi máy tính? Thao tác không khôi phục được.')) {
                    onClearData();
                    onClose();
                  }
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors cursor-pointer ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Xóa trắng toàn bộ dữ liệu</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
