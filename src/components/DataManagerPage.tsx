/**
 * TRANG "TẢI FILE LÊN & QUẢN LÝ DỮ LIỆU"
 *
 * Bố cục: 3 thẻ (tab) — D11A | D11A_HT | UNC. Mỗi thẻ có cùng một khuôn:
 *   [Nạp file] [Tải mẫu] [Thêm mới] [Tìm kiếm]  →  bảng danh sách có Sửa / Xóa từng dòng  →  dòng TỔNG.
 * Mọi số liệu chỉ hiển thị trong KỲ đang chọn ở bộ lọc (tháng/quý/năm).
 */
import React, { useMemo, useRef, useState } from 'react';
import { Upload, Download, Plus, Pencil, Trash2, Search, FileSpreadsheet } from 'lucide-react';
import { D11aRow, FilterState } from '../types/index.ts';
import { UncRow } from '../types/unc.ts';
import { D11A, D11A_HT, UNC } from '../data/templateNames.ts';
import { formatCurrency, downloadStandardTemplate } from '../utils/excelExport.ts';
import { downloadUncTemplate, groupUncByUnit, inPeriod, mergeUnc, parseUncFile } from '../utils/unc.ts';
import { RecordEditModal } from './RecordEditModal.tsx';
import { UncEditModal } from './UncEditModal.tsx';

type Tab = 'D11A' | 'D11A_HT' | 'UNC';

interface Props {
  records: D11aRow[];
  uncRows: UncRow[];
  filter: FilterState;
  onOpenUpload: () => void;
  onAddRecord: (source: 'D11A' | 'D11A_HT') => void;
  onUpdateRecord: (r: D11aRow) => void;
  onDeleteRecord: (id: string) => void;
  onUncChange: (rows: UncRow[]) => void;
  /** Thẻ mở sẵn khi vào trang. */
  initialTab?: Tab;
}

const BTN = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors';
const TH = 'px-2 py-2 border border-sky-300 font-bold text-left whitespace-nowrap bg-sky-200 sticky top-0 z-10';
const TD = 'px-2 py-1 border border-sky-100';
const money = (n: number) => (n ? formatCurrency(n) : '');

export const periodLabel = (f: FilterState): string => {
  if (f.periodType === 'month') return `Tháng ${f.month}/${f.year}`;
  if (f.periodType === 'quarter') return `Quý ${f.quarter}/${f.year}`;
  if (f.periodType === 'year') return `Năm ${f.year}`;
  if (f.periodType === 'custom') return `${f.startDate} → ${f.endDate}`;
  return 'Tất cả các kỳ';
};

export const DataManagerPage: React.FC<Props> = ({
  records, uncRows, filter, onOpenUpload, onAddRecord, onUpdateRecord, onDeleteRecord, onUncChange, initialTab = 'D11A',
}) => {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [query, setQuery] = useState('');
  const [editRec, setEditRec] = useState<D11aRow | null>(null);
  const [editUnc, setEditUnc] = useState<UncRow | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const uncFileRef = useRef<HTMLInputElement>(null);

  const inRange = (month: number, year: number) => inPeriod(month, year, filter);
  const q = query.trim().toLowerCase();
  const match = (...vals: unknown[]) => !q || vals.some(v => String(v ?? '').toLowerCase().includes(q));

  const d11a = useMemo(
    () => records.filter(r => r.source === 'D11A' && inRange(r.month, r.year) &&
      match(r.pointCode, r.staffName, r.staffId, r.participantName, r.bhxhCode, r.receiptNumber)),
    [records, filter, q] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const ht = useMemo(
    () => records.filter(r => r.source === 'D11A_HT' && inRange(r.month, r.year) &&
      match(r.pointCode, r.staffName, r.participantName, r.bhxhCode)),
    [records, filter, q] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const uncPeriod = useMemo(() => uncRows.filter(r => inRange(r.month, r.year)), [uncRows, filter]); // eslint-disable-line react-hooks/exhaustive-deps
  const uncList = useMemo(
    () => uncPeriod.filter(r => match(r.pointCode, r.unitName, r.voucherNo, r.content, r.ncCode)),
    [uncPeriod, q] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const groups = useMemo(() => groupUncByUnit(uncPeriod), [uncPeriod]);

  const counts = {
    D11A: records.filter(r => r.source === 'D11A' && inRange(r.month, r.year)).length,
    D11A_HT: records.filter(r => r.source === 'D11A_HT' && inRange(r.month, r.year)).length,
    UNC: uncPeriod.length,
  };

  const importUnc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const incoming = await parseUncFile(file);
      if (incoming.length === 0) throw new Error('File UNC không có dòng dữ liệu nào (cần có Mã đơn vị và Tiền VND).');
      const { merged, added, updated } = mergeUnc(uncRows, incoming);
      onUncChange(merged);
      const periods = Array.from(new Set(incoming.map(r => `${r.month}/${r.year}`))).join(', ');
      setNotice({ ok: true, text: `Đã nạp UNC: thêm mới ${added}, ghi đè ${updated}. Dữ liệu thuộc tháng: ${periods}.` });
    } catch (err) {
      setNotice({ ok: false, text: err instanceof Error ? err.message : 'Không đọc được file UNC.' });
    }
  };

  const delUnc = (r: UncRow) => {
    if (confirm(`Xóa dòng UNC số phiếu ${r.voucherNo || '(trống)'} — ${r.pointCode}?`)) {
      onUncChange(uncRows.filter(x => x.id !== r.id));
    }
  };

  const RowActions: React.FC<{ onEdit: () => void; onDelete: () => void }> = ({ onEdit, onDelete }) => (
    <td className={`${TD} whitespace-nowrap text-center w-20`}>
      <button onClick={onEdit} title="Sửa" className="p-1 text-sky-700 hover:text-sky-900 cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
      <button onClick={onDelete} title="Xóa" className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
    </td>
  );
  const Empty: React.FC<{ cols: number }> = ({ cols }) => (
    <tr><td colSpan={cols} className="px-3 py-10 text-center text-slate-500">Chưa có dữ liệu trong kỳ {periodLabel(filter)}. Hãy nạp file hoặc bấm "Thêm mới".</td></tr>
  );
  const tabBtn = (id: Tab, label: string) => (
    <button
      key={id}
      onClick={() => { setTab(id); setQuery(''); setNotice(null); }}
      className={`px-4 py-2 text-xs font-bold rounded-t-lg border border-b-0 cursor-pointer ${
        tab === id ? 'bg-sky-50 text-sky-900 border-sky-300' : 'bg-sky-100/60 text-slate-600 border-transparent hover:bg-sky-100'
      }`}
    >
      {label} <span className="ml-1 px-1.5 rounded-full bg-white border border-sky-200 text-3xs">{counts[id]}</span>
    </button>
  );

  return (
    <div className="bg-sky-50 rounded-2xl border border-sky-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-[#0c567a] text-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-500 rounded-xl"><FileSpreadsheet className="w-5 h-5" /></div>
          <div>
            <h2 className="text-base font-bold">Tải file lên & quản lý dữ liệu</h2>
            <p className="text-2xs text-sky-100">Nạp file, xem danh sách, sửa / xóa / thêm mới từng dòng</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-bold whitespace-nowrap">Kỳ: {periodLabel(filter)}</span>
      </div>

      {/* Nút nạp file luôn hiển thị, không phụ thuộc thẻ đang mở */}
      <div className="px-4 pt-3 flex flex-wrap items-center gap-2">
        <button onClick={onOpenUpload} className={`${BTN} bg-sky-600 text-white hover:bg-sky-700 border-sky-600`}>
          <Upload className="w-3.5 h-3.5" /> Nạp file D11A / D11A_HT
        </button>
        <button
          onClick={() => { setTab('UNC'); setQuery(''); uncFileRef.current?.click(); }}
          className={`${BTN} bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600`}
        >
          <Upload className="w-3.5 h-3.5" /> Nạp file UNC
        </button>
        <button onClick={downloadUncTemplate} className={`${BTN} bg-white text-slate-700 hover:bg-sky-100 border-sky-300`}>
          <Download className="w-3.5 h-3.5" /> Tải mẫu UNC
        </button>
        <input ref={uncFileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={importUnc} />
      </div>

      <div className="px-4 pt-3 flex gap-1 border-b border-sky-300">
        {tabBtn('D11A', `Sheet ${D11A.sheet}`)}
        {tabBtn('D11A_HT', `Sheet ${D11A_HT.sheet}`)}
        {tabBtn('UNC', `${UNC.sheet} — Ủy nhiệm chi`)}
      </div>

      <div className="p-4 space-y-3">
        {/* Thanh công cụ dùng chung */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm kiếm trong danh sách..."
              className="w-full pl-8 pr-2 py-1.5 text-xs border border-sky-300 rounded-lg bg-white" />
          </div>
          {tab === 'UNC' ? (
            <>
              <button onClick={() => uncFileRef.current?.click()} className={`${BTN} bg-sky-600 text-white hover:bg-sky-700 border-sky-600`}>
                <Upload className="w-3.5 h-3.5" /> Nạp file UNC
              </button>
              <button onClick={downloadUncTemplate} className={`${BTN} bg-white text-slate-700 hover:bg-sky-100 border-sky-300`}>
                <Download className="w-3.5 h-3.5" /> Tải mẫu UNC
              </button>
              <button
                onClick={() => setEditUnc({ id: '', stt: uncRows.length + 1, date: '', voucherDate: '', voucherNo: '', ncCode: '', quarter: '', pointCode: '', unitName: '', amount: 0, content: '', month: 0, year: 0 })}
                className={`${BTN} bg-white text-slate-700 hover:bg-sky-100 border-sky-300`}
              >
                <Plus className="w-3.5 h-3.5" /> Thêm mới
              </button>
            </>
          ) : (
            <>
              <button onClick={onOpenUpload} className={`${BTN} bg-sky-600 text-white hover:bg-sky-700 border-sky-600`}>
                <Upload className="w-3.5 h-3.5" /> Nạp file D11A / D11A_HT
              </button>
              <button onClick={() => downloadStandardTemplate(filter.month, filter.year)} className={`${BTN} bg-white text-slate-700 hover:bg-sky-100 border-sky-300`}>
                <Download className="w-3.5 h-3.5" /> Tải mẫu trống
              </button>
              <button onClick={() => onAddRecord(tab)} className={`${BTN} bg-white text-slate-700 hover:bg-sky-100 border-sky-300`}>
                <Plus className="w-3.5 h-3.5" /> Thêm mới
              </button>
            </>
          )}
        </div>
        {notice && <div className={`text-xs font-semibold ${notice.ok ? 'text-emerald-700' : 'text-rose-600'}`}>{notice.text}</div>}

        {/* ---------------- D11A ---------------- */}
        {tab === 'D11A' && (
          <>
            <div className="text-xs font-black uppercase text-slate-800">{D11A.title}</div>
            <div className="overflow-auto max-h-[62vh] rounded-xl border border-sky-200 bg-white">
              <table className="w-full text-2xs border-collapse">
                <thead>
                  <tr>
                    {['STT', 'Mã điểm thu', 'Họ và tên nhân viên thu', 'Họ và tên người tham gia', 'Mã số BHXH', 'Số biên lai', 'Ngày biên lai',
                      'Đối tượng khai thác thu mới — Số tiền NTG đóng', 'Đối tượng khai thác thu thường kỳ — Số tiền NTG đóng',
                      'Tổng số thu của người tham gia', 'Thù lao tổ chức dịch vụ thu', 'Ghi chú', 'Thao tác'].map(h => <th key={h} className={TH}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {d11a.length === 0 && <Empty cols={13} />}
                  {d11a.map((r, i) => (
                    <tr key={r.id} className={i % 2 ? 'bg-sky-50' : 'bg-white'}>
                      <td className={`${TD} text-center`}>{r.stt}</td>
                      <td className={`${TD} font-mono`}>{r.pointCode}</td>
                      <td className={TD}>{r.staffName}</td>
                      <td className={TD}>{r.participantName}</td>
                      <td className={`${TD} font-mono`}>{r.bhxhCode}</td>
                      <td className={TD}>{r.receiptNumber}</td>
                      <td className={`${TD} whitespace-nowrap`}>{r.receiptDate}</td>
                      <td className={`${TD} text-right`}>{money(r.newRevenue)}</td>
                      <td className={`${TD} text-right`}>{money(r.regRevenue)}</td>
                      <td className={`${TD} text-right font-semibold`}>{money(r.totalRevenue)}</td>
                      <td className={`${TD} text-right`}>{money(r.totalCommission)}</td>
                      <td className={TD}>{r.notes}</td>
                      <RowActions onEdit={() => setEditRec(r)} onDelete={() => onDeleteRecord(r.id)} />
                    </tr>
                  ))}
                </tbody>
                {d11a.length > 0 && (
                  <tfoot>
                    <tr className="bg-sky-200 font-black">
                      <td className={`${TD} text-center`} colSpan={7}>TỔNG ({d11a.length} dòng)</td>
                      <td className={`${TD} text-right`}>{money(d11a.reduce((s, r) => s + r.newRevenue, 0))}</td>
                      <td className={`${TD} text-right`}>{money(d11a.reduce((s, r) => s + r.regRevenue, 0))}</td>
                      <td className={`${TD} text-right`}>{money(d11a.reduce((s, r) => s + r.totalRevenue, 0))}</td>
                      <td className={`${TD} text-right`}>{money(d11a.reduce((s, r) => s + r.totalCommission, 0))}</td>
                      <td className={TD} colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}

        {/* ---------------- D11A_HT ---------------- */}
        {tab === 'D11A_HT' && (
          <>
            <div className="text-xs font-black uppercase text-slate-800">{D11A_HT.title}</div>
            <div className="overflow-auto max-h-[62vh] rounded-xl border border-sky-200 bg-white">
              <table className="w-full text-2xs border-collapse">
                <thead>
                  <tr>
                    {[...D11A_HT.header.slice(0, 12), 'Thao tác'].map(h => <th key={h} className={TH}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {ht.length === 0 && <Empty cols={13} />}
                  {ht.map((r, i) => (
                    <tr key={r.id} className={i % 2 ? 'bg-sky-50' : 'bg-white'}>
                      <td className={`${TD} text-center`}>{r.stt}</td>
                      <td className={`${TD} font-mono`}>{r.pointCode}</td>
                      <td className={TD}>{r.staffName}</td>
                      <td className={`${TD} font-mono`}>{r.staffId}</td>
                      <td className={TD}>{r.participantName}</td>
                      <td className={`${TD} font-mono`}>{r.bhxhCode}</td>
                      <td className={`${TD} text-right`}>{money(r.mucDong ?? 0)}</td>
                      <td className={`${TD} text-center`}>{r.soThangGiam ?? ''}</td>
                      <td className={`${TD} text-right`}>{money(r.hoanTraNTG ?? 0)}</td>
                      <td className={`${TD} text-center`}>{r.tyLeThuHoi ? `${(r.tyLeThuHoi * 100).toFixed(1)}%` : ''}</td>
                      <td className={`${TD} text-right font-semibold`}>{money(r.totalCommission)}</td>
                      <td className={TD}>{r.notes}</td>
                      <RowActions onEdit={() => setEditRec(r)} onDelete={() => onDeleteRecord(r.id)} />
                    </tr>
                  ))}
                </tbody>
                {ht.length > 0 && (
                  <tfoot>
                    <tr className="bg-sky-200 font-black">
                      <td className={`${TD} text-center`} colSpan={8}>TỔNG ({ht.length} dòng)</td>
                      <td className={`${TD} text-right`}>{money(ht.reduce((s, r) => s + (r.hoanTraNTG ?? 0), 0))}</td>
                      <td className={TD} />
                      <td className={`${TD} text-right`}>{money(ht.reduce((s, r) => s + r.totalCommission, 0))}</td>
                      <td className={TD} colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}

        {/* ---------------- UNC ---------------- */}
        {tab === 'UNC' && (
          <>
            <div className="text-xs font-black uppercase text-slate-800">{UNC.title} — tổng theo nhóm Mã đơn vị (cột Tiền VND)</div>
            <div className="overflow-auto max-h-64 rounded-xl border border-sky-200 bg-white max-w-3xl">
              <table className="w-full text-2xs border-collapse">
                <thead>
                  <tr>{['Mã đơn vị', 'Tên đơn vị', 'Số phiếu', 'Tiền VND'].map(h => <th key={h} className={TH}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {groups.length === 0 && <Empty cols={4} />}
                  {groups.map((g, i) => (
                    <tr key={g.pointCode} className={i % 2 ? 'bg-sky-50' : 'bg-white'}>
                      <td className={`${TD} font-mono`}>{g.pointCode}</td>
                      <td className={TD}>{g.unitName}</td>
                      <td className={`${TD} text-center`}>{g.count}</td>
                      <td className={`${TD} text-right font-semibold`}>{formatCurrency(g.total)}</td>
                    </tr>
                  ))}
                </tbody>
                {groups.length > 0 && (
                  <tfoot>
                    <tr className="bg-sky-200 font-black">
                      <td className={`${TD} text-center`} colSpan={2}>TỔNG</td>
                      <td className={`${TD} text-center`}>{groups.reduce((s, g) => s + g.count, 0)}</td>
                      <td className={`${TD} text-right`}>{formatCurrency(groups.reduce((s, g) => s + g.total, 0))}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="text-xs font-black uppercase text-slate-800 pt-1">Danh sách UNC</div>
            <div className="overflow-auto max-h-[46vh] rounded-xl border border-sky-200 bg-white">
              <table className="w-full text-2xs border-collapse">
                <thead>
                  <tr>{[...UNC.header, 'Thao tác'].map(h => <th key={h} className={TH}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {uncList.length === 0 && <Empty cols={11} />}
                  {uncList.map((r, i) => (
                    <tr key={r.id} className={i % 2 ? 'bg-sky-50' : 'bg-white'}>
                      <td className={`${TD} text-center`}>{r.stt}</td>
                      <td className={`${TD} whitespace-nowrap`}>{r.date}</td>
                      <td className={`${TD} whitespace-nowrap`}>{r.voucherDate}</td>
                      <td className={TD}>{r.voucherNo}</td>
                      <td className={TD}>{r.ncCode}</td>
                      <td className={TD}>{r.quarter}</td>
                      <td className={`${TD} font-mono`}>{r.pointCode}</td>
                      <td className={TD}>{r.unitName}</td>
                      <td className={`${TD} text-right font-semibold`}>{formatCurrency(r.amount)}</td>
                      <td className={`${TD} min-w-48`}>{r.content}</td>
                      <RowActions onEdit={() => setEditUnc(r)} onDelete={() => delUnc(r)} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="text-2xs text-slate-600">
          Chỉ hiển thị dữ liệu của kỳ {periodLabel(filter)} (đổi kỳ ở thanh bộ lọc). Mọi thay đổi tự lưu vào trình duyệt và có trong file sao lưu JSON.
        </div>
      </div>

      <RecordEditModal key={editRec?.id ?? 'none'} record={editRec} onClose={() => setEditRec(null)} onSave={onUpdateRecord} />
      <UncEditModal
        key={editUnc ? editUnc.id || 'new' : 'none'}
        row={editUnc}
        onClose={() => setEditUnc(null)}
        onSave={r => onUncChange(uncRows.some(x => x.id === r.id) ? uncRows.map(x => (x.id === r.id ? r : x)) : [...uncRows, r])}
      />
    </div>
  );
};
