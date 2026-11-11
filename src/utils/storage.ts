/**
 * Lưu trữ LocalStorage.
 *
 * KHÔNG nạp dữ liệu mẫu: lần đầu mở app, danh sách rỗng. Mọi con số hiển thị
 * đều phải đến từ file người dùng nạp, tránh nhầm dữ liệu giả với dữ liệu thật.
 */

import { D11aRow, AgencySettings } from '../types/index.ts';
import { EMPTY_SETTINGS } from '../constants.ts';

const STORAGE_KEY_RECORDS = 'bhxh_d11a_records_v1';
const STORAGE_KEY_SETTINGS = 'bhxh_d11a_settings_v1';
const STORAGE_KEY_LAST_SYNC = 'bhxh_d11a_last_sync_v1';

export const loadStoredRecords = (): D11aRow[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load from LocalStorage:', err);
    return [];
  }
};

export const saveStoredRecords = (records: D11aRow[]): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toISOString());
    return true;
  } catch (err) {
    console.error('Failed to save to LocalStorage:', err);
    return false;
  }
};

export const loadStoredSettings = (): AgencySettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return { ...EMPTY_SETTINGS };
    return { ...EMPTY_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load settings:', err);
    return { ...EMPTY_SETTINGS };
  }
};

export const saveStoredSettings = (settings: AgencySettings): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    return true;
  } catch (err) {
    console.error('Failed to save settings:', err);
    return false;
  }
};

/** Xoá sạch dữ liệu. Trả về danh sách rỗng (không phục hồi dữ liệu mẫu). */
export const clearAllStoredData = (): D11aRow[] => {
  try {
    localStorage.removeItem(STORAGE_KEY_RECORDS);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
    localStorage.removeItem(STORAGE_KEY_LAST_SYNC);
  } catch (err) {
    console.error('Failed to clear storage:', err);
  }
  return [];
};

export const getStorageMetrics = () => {
  try {
    const rawRecords = localStorage.getItem(STORAGE_KEY_RECORDS) || '';
    const rawSettings = localStorage.getItem(STORAGE_KEY_SETTINGS) || '';
    const totalBytes = (rawRecords.length + rawSettings.length) * 2; // UTF-16
    const totalKB = (totalBytes / 1024).toFixed(1);
    const lastSync = localStorage.getItem(STORAGE_KEY_LAST_SYNC);
    return {
      sizeKB: totalKB,
      lastSync: lastSync ? new Date(lastSync).toLocaleString('vi-VN') : 'Chưa có dữ liệu'
    };
  } catch {
    return { sizeKB: '0', lastSync: 'Không xác định' };
  }
};

export const exportBackupJSON = (records: D11aRow[], settings: AgencySettings) => {
  const backup = {
    appName: 'BHXH_D11A_HOA_HONG',
    exportedAt: new Date().toISOString(),
    version: '1.0',
    settings,
    totalRecords: records.length,
    records
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Sao_Luu_Du_Lieu_BHXH_D11A_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
