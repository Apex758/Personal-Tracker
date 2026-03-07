'use client';

import { useState } from 'react';
import type { YearlySummaryRow } from '@/lib/data';

const COLS: { key: keyof YearlySummaryRow; label: string; color: string }[] = [
  { key: 'Income',         label: 'Income',        color: '#00d4aa' },
  { key: 'Expense',        label: 'Expenses',       color: '#f06292' },
  { key: 'Frass',          label: 'Frass',          color: '#f5a623' },
  { key: 'Savings',        label: 'Savings',        color: '#7c6ef7' },
  { key: 'Debt',           label: 'Debt',           color: '#ef4444' },
  { key: 'Emergency Fund', label: 'Emerg. Fund',    color: '#38bdf8' },
  { key: 'net',            label: 'Net',            color: '#4ade80' },
];

const COL_STYLE: React.CSSProperties = { textAlign: 'right', padding: '8px 14px' };
const MONTH_COL: React.CSSProperties = { width: 90, padding: '8px 14px' };

function fmtVal(val: number, isNet: boolean) {
  if (val === 0) return <span style={{ color: 'var(--text-3)' }}>—</span>;
  const color = isNet ? (val >= 0 ? '#4ade80' : '#ef4444') : undefined;
  const prefix = isNet ? (val >= 0 ? '+' : '-') : '';
  return (
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', color, fontWeight: isNet ? 600 : undefined }}>
      {prefix}${Math.abs(val).toLocaleString()}
    </span>
  );
}

export function YearlySummary({ data }: { data: YearlySummaryRow[] }) {
  const [collapsed, setCollapsed] = useState(false);

  const totals = COLS.reduce((acc, col) => {
    acc[String(col.key)] = data.reduce((s, r) => s + (r[col.key] as number), 0);
    return acc;
  }, {} as Record<string, number>);

  const colGroup = (
    <colgroup>
      <col style={{ width: 90 }} />
      {COLS.map((col) => <col key={String(col.key)} />)}
    </colgroup>
  );

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px 12px', borderBottom: '1px solid var(--border)',
      }}>
        <div>
          <p className="eyebrow">Finance</p>
          <p className="section-title">Yearly Summary</p>
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 14px', borderRadius: 99,
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            color: 'var(--text-3)', fontSize: '0.78rem', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {collapsed ? '↓ Show months' : '↑ Totals only'}
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>

        {/* Column headers — always visible */}
        <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
          {colGroup}
          <thead>
            <tr>
              <th style={MONTH_COL}>Month</th>
              {COLS.map((col) => (
                <th key={String(col.key)} style={{ ...COL_STYLE, color: col.color }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
        </table>

        {/* Month rows — smooth animated collapse */}
        <div style={{
          overflow: 'hidden',
          maxHeight: collapsed ? 0 : '800px',
          opacity: collapsed ? 0 : 1,
          transition: 'max-height 0.4s ease, opacity 0.3s ease',
        }}>
          <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
            {colGroup}
            <tbody>
              {data.map((row) => {
                const hasData = COLS.some((c) => c.key !== 'net' && (row[c.key] as number) > 0);
                return (
                  <tr key={row.month} style={{ opacity: hasData ? 1 : 0.3 }}>
                    <td style={{ ...MONTH_COL, fontWeight: 600, color: 'var(--text)', fontSize: '0.82rem' }}>
                      {row.month.slice(0, 3)}
                    </td>
                    {COLS.map((col) => (
                      <td key={String(col.key)} style={COL_STYLE}>
                        {fmtVal(row[col.key] as number, col.key === 'net')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals footer — always visible */}
        <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
          {colGroup}
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--border-strong)', background: 'var(--surface-3)' }}>
              <td style={{ ...MONTH_COL, fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text)' }}>
                Total
              </td>
              {COLS.map((col) => {
                const val = totals[String(col.key)] ?? 0;
                const isNet = col.key === 'net';
                const color = isNet ? (val >= 0 ? '#4ade80' : '#ef4444') : col.color;
                const prefix = isNet ? (val >= 0 ? '+' : '-') : '';
                return (
                  <td key={String(col.key)} style={COL_STYLE}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color, fontWeight: 700 }}>
                      {val !== 0 ? `${prefix}$${Math.abs(val).toLocaleString()}` : '—'}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>

      </div>
    </div>
  );
}