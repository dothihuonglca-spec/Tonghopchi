/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TrendingUp,
  Coins,
  Sparkles,
  Repeat,
  CheckCircle2,
  Building2,
  MinusCircle,
  PlusCircle,
  RotateCcw,
  type LucideIcon
} from 'lucide-react';
import { formatCurrency } from '../utils/excelExport.ts';
import { RATE_NEW, RATE_REG } from '../constants.ts';

export type SummaryBlockId = 
  | 'hoahong' 
  | 'revenue' 
  | 'new_rev' 
  | 'reg_rev' 
  | 'd11a' 
  | 'd11a_ht' 
  | 'scale';

interface SummaryCardsProps {
  totalRevenue: number;
  totalCommission: number;
  newRevenue: number;
  newCommission: number;
  regRevenue: number;
  regCommission: number;
  totalReceipts: number;
  activeStaffCount: number;
  activePointCount: number;
  d11aRevenue: number;
  d11aCommission: number;
  d11aCount: number;
  d11aHtRevenue: number;
  d11aHtCommission: number;
  d11aHtRefund: number;
  d11aHtCount: number;
  receiptCount: number;
  /** Tổng "Số phải chi" của Book3 (đã làm tròn theo từng điểm thu). */
  book3Total: number;
  taxDeduction: number;
  netCommission: number;
  applyTax: boolean;
  activeBlockId: SummaryBlockId;
  onSelectBlock: (blockId: SummaryBlockId) => void;
  onResetFilter?: () => void;
}

type Tone = {
  idle: string;
  active: string;
  iconBox: string;
  chip: string;
  check: string;
};

// Khai báo đủ tên class để Tailwind nhận diện
const TONES: Record<'blue' | 'emerald' | 'amber' | 'indigo' | 'sky' | 'purple' | 'slate', Tone> = {
  blue:    { idle: 'border-slate-200 hover:border-blue-400',    active: 'border-blue-500 bg-blue-50 ring-2 ring-blue-200',       iconBox: 'bg-blue-100 text-blue-700',       chip: 'bg-blue-50 text-blue-700',       check: 'text-blue-600' },
  emerald: { idle: 'border-slate-200 hover:border-emerald-400', active: 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200', iconBox: 'bg-emerald-100 text-emerald-700', chip: 'bg-emerald-50 text-emerald-700', check: 'text-emerald-600' },
  amber:   { idle: 'border-slate-200 hover:border-amber-400',   active: 'border-amber-500 bg-amber-50 ring-2 ring-amber-200',     iconBox: 'bg-amber-100 text-amber-700',     chip: 'bg-amber-50 text-amber-700',     check: 'text-amber-600' },
  indigo:  { idle: 'border-slate-200 hover:border-indigo-400',  active: 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200',  iconBox: 'bg-indigo-100 text-indigo-700',   chip: 'bg-indigo-50 text-indigo-700',   check: 'text-indigo-600' },
  sky:     { idle: 'border-slate-200 hover:border-sky-400',     active: 'border-sky-500 bg-sky-50 ring-2 ring-sky-200',           iconBox: 'bg-sky-100 text-sky-700',         chip: 'bg-sky-50 text-sky-700',         check: 'text-sky-600' },
  purple:  { idle: 'border-slate-200 hover:border-purple-400',  active: 'border-purple-500 bg-purple-50 ring-2 ring-purple-200',  iconBox: 'bg-purple-100 text-purple-700',   chip: 'bg-purple-50 text-purple-700',   check: 'text-purple-600' },
  slate:   { idle: 'border-slate-200 hover:border-slate-400',   active: 'border-slate-500 bg-slate-100 ring-2 ring-slate-300',    iconBox: 'bg-slate-200 text-slate-700',     chip: 'bg-slate-100 text-slate-700',    check: 'text-slate-600' },
};

interface StatCardProps {
  tone: keyof typeof TONES;
  icon: LucideIcon;
  label: string;
  chip: string;
  active: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ tone, icon: Icon, label, chip, active, onClick, className = '', children, footer }) => {
  const t = TONES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-full min-w-0 text-left rounded-xl border bg-white px-3.5 py-3 transition-colors cursor-pointer flex flex-col gap-1.5 ${
        active ? t.active : t.idle
      } ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${t.iconBox}`}>
          <Icon className="w-4 h-4" />
        </span>
        <span className="text-xs font-semibold text-slate-700 truncate flex-1" title={label}>{label}</span>
        {active
          ? <CheckCircle2 className={`w-4 h-4 shrink-0 ${t.check}`} aria-label="Đang xem" />
          : <span className={`text-2xs font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${t.chip}`}>{chip}</span>}
      </div>
      <div className="text-lg font-bold text-slate-900 tracking-tight truncate">{children}</div>
      <div className="text-2xs text-slate-500 truncate mt-auto" title={typeof footer === 'string' ? footer : undefined}>{footer}</div>
    </button>
  );
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalRevenue,
  totalCommission,
  newRevenue,
  newCommission,
  regRevenue,
  regCommission,
  totalReceipts,
  activeStaffCount,
  activePointCount,
  d11aRevenue,
  d11aCommission,
  d11aCount,
  d11aHtRevenue,
  d11aHtCommission,
  d11aHtRefund,
  d11aHtCount,
  receiptCount,
  book3Total,
  activeBlockId,
  onSelectBlock,
  onResetFilter
}) => {
  const avgNewRate = newRevenue > 0 ? ((newCommission / newRevenue) * 100).toFixed(1) : (RATE_NEW * 100).toFixed(1);
  const avgRegRate = regRevenue > 0 ? ((regCommission / regRevenue) * 100).toFixed(1) : (RATE_REG * 100).toFixed(1);
  const comRatio = totalRevenue > 0 ? ((totalCommission / totalRevenue) * 100).toFixed(2) : '—';
  const unit = <span className="text-2xs font-medium text-slate-500">VNĐ</span>;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600 truncate">
          Chỉ số tổng hợp <span className="normal-case font-normal text-slate-500">· nhấn vào khối để xem bảng chi tiết bên dưới</span>
        </h3>
        <button
          type="button"
          onClick={() => (onResetFilter ? onResetFilter() : onSelectBlock('hoahong'))}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer shrink-0"
          title="Bỏ toàn bộ bộ lọc và xem lại bảng thù lao tổng hợp mặc định"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Bỏ lọc</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7 gap-2.5 items-stretch">
        <StatCard
          tone="blue" icon={Coins} label="Tổng thù lao thực lĩnh" chip={`TB ${comRatio}%`}
          active={activeBlockId === 'hoahong'} onClick={() => onSelectBlock('hoahong')}
          footer={`Đã trừ thù lao thu hồi (${d11aHtCount} dòng)`}
        >
          {formatCurrency(book3Total)} {unit}
        </StatCard>

        <StatCard
          tone="emerald" icon={TrendingUp} label="Tổng doanh thu đóng" chip={`${receiptCount} BL`}
          active={activeBlockId === 'revenue'} onClick={() => onSelectBlock('revenue')}
          footer={`Thu mới: ${formatCurrency(newRevenue)}`}
        >
          {formatCurrency(totalRevenue)} {unit}
        </StatCard>

        <StatCard
          tone="amber" icon={Sparkles} label={`Thù lao thu mới (${(RATE_NEW * 100).toFixed(1)}%)`} chip={`${avgNewRate}%`}
          active={activeBlockId === 'new_rev'} onClick={() => onSelectBlock('new_rev')}
          footer={`Doanh thu mới: ${formatCurrency(newRevenue)}`}
        >
          {formatCurrency(newCommission)} {unit}
        </StatCard>

        <StatCard
          tone="indigo" icon={Repeat} label={`Thu thường kỳ (${(RATE_REG * 100).toFixed(1)}%)`} chip={`${avgRegRate}%`}
          active={activeBlockId === 'reg_rev'} onClick={() => onSelectBlock('reg_rev')}
          footer={`Doanh thu TK: ${formatCurrency(regRevenue)}`}
        >
          {formatCurrency(regCommission)} {unit}
        </StatCard>

        <StatCard
          tone="sky" icon={PlusCircle} label="Sheet D11A — trích thù lao phát sinh" chip={`${d11aCount} BL`}
          active={activeBlockId === 'd11a'} onClick={() => onSelectBlock('d11a')}
          footer={`Tiền thu: ${formatCurrency(d11aRevenue)}`}
        >
          +{formatCurrency(d11aCommission)} {unit}
        </StatCard>

        <StatCard
          tone="purple" icon={MinusCircle} label="Sheet D11A_HT — thù lao phải thu hồi" chip={`${d11aHtCount} dòng`}
          active={activeBlockId === 'd11a_ht'} onClick={() => onSelectBlock('d11a_ht')}
          footer={`Hoàn trả NTG: ${formatCurrency(d11aHtRefund)}`}
        >
          −{formatCurrency(d11aHtCommission)} {unit}
        </StatCard>

        <StatCard
          tone="slate" icon={Building2} label="Điểm thu & nhân viên thu" chip={`${activePointCount} điểm`}
          active={activeBlockId === 'scale'} onClick={() => onSelectBlock('scale')}
          className="col-span-2 lg:col-span-2 2xl:col-span-1"
          footer="Theo dõi chỉ tiêu từng điểm thu"
        >
          {activePointCount} điểm · {activeStaffCount} NV · {receiptCount} BL
        </StatCard>
      </div>
    </div>
  );
};
