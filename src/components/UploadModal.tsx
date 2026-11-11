/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Layers, 
  FileCheck,
  RefreshCw,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  Files
} from 'lucide-react';
import { D11aRow, DataSourceType } from '../types/index.ts';
import { 
  parseUploadedFile, 
  parseTwoSeparateFiles, 
  ParseResult, 
  DualParseResult 
} from '../utils/fileParser.ts';
import { downloadStandardTemplate } from '../utils/excelExport.ts';
import { exportBook3FromFiles } from '../utils/book3Pipeline.ts';

export type ImportStrategy = 'append_dedup' | 'replace_period' | 'replace_all';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportData: (records: D11aRow[], strategy: ImportStrategy, detectedPeriods: { month: number; year: number }[]) => void;
  /** Tên đơn vị lấy từ Cài đặt — dùng cho dòng 1 của Book3. */
  agencyName?: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onImportData,
  agencyName
}) => {
  // Mode: 'dual' (2 separate files) or 'single' (1 file with 2 sheets)
  const [uploadMode, setUploadMode] = useState<'dual' | 'single'>('dual');
  const [importStrategy, setImportStrategy] = useState<ImportStrategy>('append_dedup');
  const [isProcessing, setIsProcessing] = useState(false);

  // Dual file state
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [dualResult, setDualResult] = useState<DualParseResult | null>(null);
  const [book3Msg, setBook3Msg] = useState<string | null>(null);
  const file1InputRef = useRef<HTMLInputElement>(null);
  const file2InputRef = useRef<HTMLInputElement>(null);

  // Single file state
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [singleResult, setSingleResult] = useState<ParseResult | null>(null);
  const [singleTab, setSingleTab] = useState<'auto' | 'd11a' | 'd11a_ht'>('auto');
  const [sheetMapping, setSheetMapping] = useState<Record<string, DataSourceType | 'IGNORE'>>({});
  const singleFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process dual files whenever file1 or file2 changes
  const processDualFiles = async (f1: File | null, f2: File | null) => {
    if (!f1 && !f2) {
      setDualResult(null);
      return;
    }
    setIsProcessing(true);
    const res = await parseTwoSeparateFiles(f1, f2);
    setDualResult(res);
    setIsProcessing(false);
  };

  const handleFile1Select = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFile1(file);
    await processDualFiles(file, file2);
  };

  const handleFile2Select = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFile2(file);
    await processDualFiles(file1, file);
  };

  // Drag and drop multiple files at once into dual zone
  const handleDualDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    let f1: File | null = file1;
    let f2: File | null = file2;

    files.forEach(f => {
      const name = f.name.toLowerCase();
      if (name.includes('ht') || name.includes('he_thong') || name.includes('d11a_ht')) {
        f2 = f;
      } else {
        f1 = f;
      }
    });

    setFile1(f1);
    setFile2(f2);
    await processDualFiles(f1, f2);
  };

  // Process single file
  const handleSingleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    setSingleFile(file);
    setIsProcessing(true);
    setSingleResult(null);

    const targetSource: DataSourceType | undefined = 
      singleTab === 'd11a' ? 'D11A' : 
      singleTab === 'd11a_ht' ? 'D11A_HT' : undefined;

    const res = await parseUploadedFile(file, targetSource);
    const initialMapping: Record<string, DataSourceType | 'IGNORE'> = {};
    res.sheetsInfo.forEach(s => {
      initialMapping[s.name] = s.detectedSource;
    });
    setSheetMapping(initialMapping);
    setSingleResult(res);
    setIsProcessing(false);
  };

  // Xuất Book3 đúng mẫu (tổng hợp theo mã điểm thu)
  const handleExportBook3 = async () => {
    if (!file1 || !file2) return;
    setIsProcessing(true);
    setBook3Msg(null);
    try {
      const r = await exportBook3FromFiles(file1, file2, { agencyName });
      setBook3Msg(
        r.success
          ? `Đã xuất Book3: ${r.rows.length} điểm thu, tháng ${r.month}/${r.year}` +
            (r.warnings.length ? ` (${r.warnings.length} cảnh báo)` : '')
          : r.message
      );
    } catch (e) {
      setBook3Msg(`Lỗi xuất Book3: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm and import
  const handleConfirm = () => {
    if (uploadMode === 'dual') {
      if (!dualResult || dualResult.allRecords.length === 0) return;
      onImportData(dualResult.allRecords, importStrategy, dualResult.detectedPeriods);
      onClose();
    } else {
      if (!singleResult || singleResult.allRecords.length === 0) return;
      onImportData(singleResult.allRecords, importStrategy, singleResult.detectedPeriods);
      onClose();
    }
  };

  const totalRecordsToImport = uploadMode === 'dual' 
    ? dualResult?.allRecords.length || 0 
    : singleResult?.allRecords.length || 0;

  const canConfirm = totalRecordsToImport > 0 && !isProcessing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Files className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Đọc 2 File Riêng Biệt & Tự Động Tổng Hợp Hoa Hồng
              </h2>
              <p className="text-xs text-slate-500">
                Xuất từ hệ thống BHXH thành 2 sheet ➔ tự động gộp và xuất biểu mẫu Book3
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

        {/* Mode Selector Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 bg-white">
          <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setUploadMode('dual')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                uploadMode === 'dual'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Files className="w-4 h-4" />
              <span>Nạp đồng thời 2 File riêng biệt (D11A + D11A_HT)</span>
            </button>

            <button
              onClick={() => setUploadMode('single')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                uploadMode === 'single'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Nạp 1 File đơn lẻ (File gộp 2 sheet hoặc file lẻ)</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {uploadMode === 'dual' ? (
            /* DUAL FILE MODE: 2 SLOTS SIDE BY SIDE */
            <div className="space-y-4">
              <div className="text-xs text-slate-600 bg-blue-50/70 p-3 rounded-xl border border-blue-200 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Quy trình tự động:</strong> Chọn <strong>sheet D11A</strong> (bảng trích thù lao) và <strong>sheet D11A_HT</strong> (bảng thù lao phải thu hồi). Bạn có thể chọn file Excel (.xlsx, .xls) hoặc CSV. Hệ thống sẽ đọc cả 2 file cùng lúc và tự động tổng hợp!
                </div>
              </div>

              {/* 2 Dropzones side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" onDragOver={e => e.preventDefault()} onDrop={handleDualDrop}>
                {/* Slot 1: File D11A */}
                <div 
                  className={`rounded-2xl border-2 p-5 flex flex-col justify-between transition-all ${
                    file1 
                      ? 'border-blue-500 bg-blue-50/30' 
                      : 'border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                        <span className="truncate">SHEET D11A: TRÍCH THÙ LAO PHÁT SINH</span>
                      </span>
                      <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 shrink-0">
                        Phát sinh theo tháng
                      </span>
                    </div>

                    <p className="text-2xs font-semibold text-slate-700 mb-4">
                      BẢNG CHI TIẾT TRÍCH THÙ LAO CHO TỔ CHỨC DỊCH VỤ THU BHXH, BHYT THEO THÁNG
                    </p>

                    {file1 ? (
                      <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 truncate max-w-[180px]" title={file1.name}>
                            {file1.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFile1(null);
                              processDualFiles(null, file2);
                            }}
                            className="text-slate-400 hover:text-red-600 p-1 rounded"
                            title="Bỏ file này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-2xs text-blue-700 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã nhận diện: {dualResult?.file1Count || 0} biên lai phát sinh</span>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => file1InputRef.current?.click()}
                        className="py-6 px-4 text-center cursor-pointer hover:bg-blue-50/50 rounded-xl transition-colors border border-dashed border-slate-200"
                      >
                        <div className="mx-auto w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                          <Plus className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-blue-700">Chọn sheet D11A (trích thù lao)</div>
                        <div className="text-3xs text-slate-400 mt-1">Excel (.xlsx, .xls) hoặc CSV</div>
                      </div>
                    )}
                  </div>

                  <input
                    ref={file1InputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv, .txt"
                    onChange={handleFile1Select}
                    className="hidden"
                  />

                  {file1 && (
                    <button
                      type="button"
                      onClick={() => file1InputRef.current?.click()}
                      className="mt-3 text-2xs text-blue-600 hover:underline text-center cursor-pointer"
                    >
                      Đổi sheet D11A khác
                    </button>
                  )}
                </div>

                {/* Slot 2: File D11A_HT */}
                <div 
                  className={`rounded-2xl border-2 p-5 flex flex-col justify-between transition-all ${
                    file2 
                      ? 'border-purple-500 bg-purple-50/30' 
                      : 'border-dashed border-slate-300 hover:border-purple-400 bg-slate-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
                        <span className="truncate">SHEET D11A_HT: THÙ LAO PHẢI THU HỒI</span>
                      </span>
                      <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 shrink-0">
                        Khoản thu hồi
                      </span>
                    </div>

                    <p className="text-2xs font-semibold text-slate-700 mb-4">
                      BẢNG CHI TIẾT SỐ TIỀN THÙ LAO ĐÃ CHI PHẢI THU HỒI
                    </p>

                    {file2 ? (
                      <div className="p-3 bg-white rounded-xl border border-purple-200 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 truncate max-w-[180px]" title={file2.name}>
                            {file2.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFile2(null);
                              processDualFiles(file1, null);
                            }}
                            className="text-slate-400 hover:text-red-600 p-1 rounded"
                            title="Bỏ file này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-2xs text-purple-700 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã nhận diện: {dualResult?.file2Count || 0} biên lai thu hồi</span>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => file2InputRef.current?.click()}
                        className="py-6 px-4 text-center cursor-pointer hover:bg-purple-50/50 rounded-xl transition-colors border border-dashed border-slate-200"
                      >
                        <div className="mx-auto w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
                          <Plus className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-purple-700">Chọn sheet D11A_HT (thù lao thu hồi)</div>
                        <div className="text-3xs text-slate-400 mt-1">Excel (.xlsx, .xls) hoặc CSV</div>
                      </div>
                    )}
                  </div>

                  <input
                    ref={file2InputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv, .txt"
                    onChange={handleFile2Select}
                    className="hidden"
                  />

                  {file2 && (
                    <button
                      type="button"
                      onClick={() => file2InputRef.current?.click()}
                      className="mt-3 text-2xs text-purple-600 hover:underline text-center cursor-pointer"
                    >
                      Đổi sheet D11A_HT khác
                    </button>
                  )}
                </div>
              </div>

              {/* Combined Synthesis Preview */}
              {dualResult && dualResult.success && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
                      Tổng hợp tự động 2 file thành công!
                    </span>
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-200 text-emerald-950">
                      Tổng {dualResult.allRecords.length} biên lai
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-slate-600">Sheet D11A: </span>
                      <strong className="text-blue-900">{dualResult.file1Count} biên lai</strong>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-slate-600">Sheet D11A_HT: </span>
                      <strong className="text-purple-900">{dualResult.file2Count} biên lai</strong>
                    </div>
                  </div>

                  {dualResult.detectedPeriods.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-2xs text-emerald-900">
                      <span className="font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                        Kỳ tháng phát hiện:
                      </span>
                      {dualResult.detectedPeriods.map(p => (
                        <span key={`${p.month}_${p.year}`} className="px-2 py-0.5 rounded bg-emerald-200/80 font-bold font-mono">
                          Tháng {p.month < 10 ? `0${p.month}` : p.month}/{p.year} ({p.count} BL)
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Xuất đúng mẫu Book3: TỔNG HỢP SỐ PHẢI CHI HOA HỒNG ĐẠI LÝ THU */}
                  <div className="pt-2 border-t border-emerald-200 space-y-1.5">
                    <button
                      type="button"
                      onClick={handleExportBook3}
                      disabled={!file1 || !file2 || isProcessing}
                      className="w-full inline-flex items-center justify-center space-x-2 px-3 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Xuất Book3 — Tổng hợp số phải chi hoa hồng đại lý thu</span>
                    </button>
                    {book3Msg && (
                      <div className="text-2xs text-emerald-900 font-medium">{book3Msg}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* SINGLE FILE MODE */
            <div className="space-y-4">
              <div 
                onClick={() => singleFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
                  singleFile ? 'border-blue-500 bg-blue-50/30' : 'border-slate-300 hover:border-blue-400 bg-slate-50'
                }`}
              >
                <input
                  ref={singleFileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv, .txt"
                  onChange={handleSingleFileSelect}
                  className="hidden"
                />
                <div className="mx-auto w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                {singleFile ? (
                  <div>
                    <div className="text-xs font-bold text-slate-900">{singleFile.name}</div>
                    <div className="text-2xs text-blue-600 font-medium mt-0.5">Nhấp để chọn file khác</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs font-bold text-slate-800">Chọn 1 file Excel chứa cả 2 sheet hoặc file CSV</div>
                    <div className="text-3xs text-slate-400 mt-1">Hỗ trợ .xlsx, .xls, .csv</div>
                  </div>
                )}
              </div>

              {singleResult && singleResult.success && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-blue-900 flex items-center justify-between">
                    <span>Đã nhận diện: {singleResult.allRecords.length} biên lai</span>
                    <span className="text-2xs font-mono">D11A: {singleResult.d11aRecords.length} | D11A_HT: {singleResult.d11aHtRecords.length}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading status */}
          {isProcessing && (
            <div className="flex items-center justify-center space-x-2 py-3 text-blue-600 text-xs font-semibold">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang đọc và tự động tổng hợp dữ liệu từ 2 file...</span>
            </div>
          )}

          {/* Import Strategy Options (Preserve old months or replace) */}
          {canConfirm && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-900">Cách lưu trữ vào hệ thống cùng các tháng cũ:</div>
              <div className="space-y-2">
                <label className="flex items-start space-x-2.5 p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
                  <input
                    type="radio"
                    name="importStrategy"
                    value="append_dedup"
                    checked={importStrategy === 'append_dedup'}
                    onChange={() => setImportStrategy('append_dedup')}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <div className="font-bold text-blue-900">
                      Gộp thêm vào & tự động cập nhật biên lai trùng (Khuyên dùng)
                    </div>
                    <div className="text-2xs text-slate-500">
                      Giữ nguyên toàn bộ các tháng trước; nạp thêm tháng trong 2 file này.
                    </div>
                  </div>
                </label>

                <label className="flex items-start space-x-2.5 p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
                  <input
                    type="radio"
                    name="importStrategy"
                    value="replace_period"
                    checked={importStrategy === 'replace_period'}
                    onChange={() => setImportStrategy('replace_period')}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <div className="font-bold text-purple-900">
                      Chỉ ghi đè kỳ có trong 2 file nạp
                    </div>
                    <div className="text-2xs text-slate-500">
                      Thay thế riêng tháng trong file nạp, giữ nguyên các tháng khác.
                    </div>
                  </div>
                </label>

                <label className="flex items-start space-x-2.5 p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
                  <input
                    type="radio"
                    name="importStrategy"
                    value="replace_all"
                    checked={importStrategy === 'replace_all'}
                    onChange={() => setImportStrategy('replace_all')}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <div className="font-bold text-amber-900">
                      Xóa trắng dữ liệu cũ và thay thế toàn bộ
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Download Standard Template Button */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tải file mẫu để đối chiếu cột:</span>
            <button
              onClick={() => downloadStandardTemplate()}
              className="inline-flex items-center space-x-1.5 text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file Excel mẫu chuẩn (Có sheet D11A & D11A_HT)</span>
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {canConfirm ? (
              <span className="font-semibold text-emerald-800">
                Sẵn sàng nạp tổng hợp: {totalRecordsToImport} biên lai
              </span>
            ) : (
              <span>Vui lòng chọn sheet D11A hoặc D11A_HT</span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>Tự Động Tổng Hợp Cả 2 File & Xem Hoa Hồng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
