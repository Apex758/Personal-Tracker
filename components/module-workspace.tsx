'use client';

import { useMemo, useState, useCallback } from 'react';
import { AiInsights } from '@/components/ai-insights';
import { AreaChartCard, StackedAreaChartCard } from '@/components/charts';
import type { ModuleConfig, RecordShape } from '@/lib/types';
import { formatMoney, formatNumber, titleCase } from '@/lib/format';

const MONEY_KEYS = new Set(['amount', 'income', 'expense', 'budget', 'estimated_cost', 'actual_cost', 'target_budget', 'expected_price', 'actual_price', 'expected_income', 'actual_income']);
const ACCENT_MAP: Record<string, string> = {
  finance: '#00d4aa',
  lifestyle: '#f06292',
  skills: '#7c6ef7',
  work: '#f5a623',
  travel: '#38bdf8',
  wishlist: '#c084fc',
};

// Modules where we want a multi-series stacked chart
const MULTI_SERIES_MODULES = new Set(['lifestyle', 'finance', 'work', 'skills']);

const SERIES_PALETTE = [
  '#00d4aa', '#f06292', '#7c6ef7', '#f5a623',
  '#38bdf8', '#c084fc', '#4ade80', '#fb923c',
];

const PIVOT_CONFIG: Record<string, { groupBy: string; valueKey: string; labelKey?: string }> = {
  finance: { groupBy: 'financial_nature', valueKey: 'amount' }, // no labelKey → uses date slice
  work:    { groupBy: 'status',           valueKey: 'hours' },
};

// Fixed color per financial_nature category so they're consistent
const FINANCE_NATURE_COLORS: Record<string, string> = {
  Income:         '#00d4aa',
  Expense:        '#f06292',
  Savings:        '#7c6ef7',
  Frass:          '#f5a623',
  Debt:           '#ef4444',
  'Emergency Fund': '#38bdf8',
};

type EditState = Record<string, string | number | null>;

export function ModuleWorkspace({ module, initialRows }: { module: ModuleConfig; initialRows: RecordShape[] }) {
  const [rows, setRows] = useState<RecordShape[]>(initialRows);
  const [form, setForm] = useState<RecordShape>(() =>
    Object.fromEntries(module.columns.map((col) => [col.key, ''])),
  );
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditState>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'records' | 'add' | 'ai'>('records');

  const accent = ACCENT_MAP[module.slug] || '#00d4aa';

  const totals = useMemo(() => {
    const numCols = module.columns.filter((c) => c.type === 'number');
    return Object.fromEntries(
      numCols.map((c) => [c.key, rows.reduce((s, r) => s + Number(r[c.key] || 0), 0)]),
    );
  }, [module.columns, rows]);

  // All numeric columns (excluding obviously useless ones)
  const numericCols = useMemo(
    () => module.columns.filter((c) => c.type === 'number'),
    [module.columns],
  );

  const dateCol = useMemo(
    () => module.columns.find((c) => c.type === 'date'),
    [module.columns],
  );

  // ── Module-specific pivot configs ────────────────────────────────────────
  // For modules where a single amount col should be pivoted by a category col
  const pivotCfg = PIVOT_CONFIG[module.slug];

  // Pivot chart: group rows by date/label, split into series by a categorical col
  const { pivotData, pivotSeries } = useMemo(() => {
    if (!pivotCfg) return { pivotData: [], pivotSeries: [] };

    const { groupBy, valueKey, labelKey } = pivotCfg;

    // Collect all category values for series
    const categorySet = new Set<string>();
    rows.forEach((r) => {
      const cat = String(r[groupBy] ?? '').trim();
      if (cat) categorySet.add(cat);
    });
    const categories = Array.from(categorySet);

    // Group by YYYY-MM from the date column — skip rows with no date
    const map = new Map<string, Record<string, number>>();
    rows.forEach((r) => {
      const rawDate = String(r[dateCol?.key ?? 'date'] ?? '');
      if (!rawDate || rawDate === 'null') return; // skip dateless rows
      const label = rawDate.length >= 7 ? rawDate.slice(0, 7) : rawDate;
      const cat = String(r[groupBy] ?? '').trim() || 'Other';
      const val = Number(r[valueKey] || 0);
      if (!map.has(label)) map.set(label, {});
      const entry = map.get(label)!;
      entry[cat] = (entry[cat] ?? 0) + val;
    });

    const sorted = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));

    const data = sorted.map(([label, vals]) => ({ label, ...vals }));
    const series = categories.map((cat, i) => ({
      key: cat,
      label: cat,
      color: (module.slug === 'finance' && FINANCE_NATURE_COLORS[cat])
        ? FINANCE_NATURE_COLORS[cat]
        : SERIES_PALETTE[i % SERIES_PALETTE.length],
    }));

    return { pivotData: data, pivotSeries: series };
  }, [rows, pivotCfg, dateCol]);

  // Multi-numeric-col stacked chart (lifestyle: many numeric cols per date row)
  const { multiSeriesData, multiSeries } = useMemo(() => {
    if (pivotCfg || numericCols.length < 2 || !MULTI_SERIES_MODULES.has(module.slug)) {
      return { multiSeriesData: [], multiSeries: [] };
    }
    const map = new Map<string, Record<string, number>>();
    rows.forEach((r) => {
      const label = String(r[dateCol?.key ?? 'date'] ?? '').slice(0, 10) || 'N/A';
      if (!map.has(label)) map.set(label, {});
      const entry = map.get(label)!;
      numericCols.forEach((col) => {
        entry[col.key] = (entry[col.key] ?? 0) + Number(r[col.key] || 0);
      });
    });
    const cols = module.slug === 'lifestyle' ? [...numericCols].reverse() : numericCols;
    const data = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, vals]) => ({ label, ...vals }));
    const series = cols.map((col, i) => ({
      key: col.key,
      label: col.label,
      color: SERIES_PALETTE[i % SERIES_PALETTE.length],
    }));
    return { multiSeriesData: data, multiSeries: series };
  }, [rows, pivotCfg, dateCol, numericCols, module.slug]);

  // Fallback single-series
  const singleSeriesData = useMemo(() => {
    if (pivotCfg || multiSeriesData.length) return [];
    if (!dateCol || !numericCols[0]) return [];
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const label = String(r[dateCol.key] ?? '').slice(0, 7) || 'N/A';
      map.set(label, (map.get(label) ?? 0) + Number(r[numericCols[0].key] || 0));
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10)
      .map(([label, value]) => ({ label, value }));
  }, [rows, pivotCfg, multiSeriesData, dateCol, numericCols]);

  async function refresh() {
    const res = await fetch(`/api/records/${module.slug}`);
    const data = await res.json();
    setRows(data.rows || []);
  }

  function showMsg(text: string, ok: boolean) {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 3000);
  }

  async function saveRow() {
    const res = await fetch(`/api/records/${module.slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { showMsg(data.error || 'Save failed.', false); return; }
    showMsg('Row added ✓', true);
    setForm(Object.fromEntries(module.columns.map((c) => [c.key, ''])));
    await refresh();
  }

  async function deleteRow(id?: string) {
    if (!id) return;
    const res = await fetch(`/api/records/${module.slug}?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { showMsg(data.error || 'Delete failed.', false); return; }
    showMsg('Deleted.', true);
    await refresh();
  }

  function startEdit(row: RecordShape) {
    setEditingId(row.id ?? null);
    setEditDraft({ ...row });
  }

  function cancelEdit() { setEditingId(null); setEditDraft({}); }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    try {
      const payload = { ...editDraft };
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;
      const res = await fetch(`/api/records/${module.table}/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { showMsg(data.error || 'Update failed.', false); return; }
      showMsg('Updated ✓', true);
      cancelEdit();
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  const renderEditCell = useCallback((col: typeof module.columns[0]) => {
    const val = editDraft[col.key] ?? '';
    const onChange = (v: string | number) => setEditDraft((p) => ({ ...p, [col.key]: v }));
    if (col.type === 'select' && col.options) {
      return (
        <select value={String(val)} onChange={(e) => onChange(e.target.value)} style={{ minWidth: 90 }}>
          <option value="">—</option>
          {col.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    return (
      <input
        type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
        value={String(val)}
        onChange={(e) => onChange(col.type === 'number' ? Number(e.target.value) : e.target.value)}
        style={{ minWidth: 80 }}
      />
    );
  }, [editDraft]);

  const numericTotals = Object.entries(totals).slice(0, 4);

  return (
    <div className="page">
      {/* Header */}
      <div className="hero">
        <div className="hero-meta">
          <p className="eyebrow">Module</p>
          <h1 className="page-title" style={{ color: accent }}>{module.label}</h1>
          <p className="muted small" style={{ maxWidth: 440, marginTop: 4 }}>{module.description}</p>
        </div>
        <div className="record-chip">
          <strong>{rows.length}</strong> records
        </div>
      </div>

      {/* Stat cards — finance gets per-nature breakdown, others get numeric totals */}
      {module.slug === 'finance' ? (
        <FinanceStatCards rows={rows} accent={accent} />
      ) : numericTotals.length > 0 ? (
        <div className="stat-grid" style={{ marginBottom: 14 }}>
          {numericTotals.map(([key, val]) => (
            <StatMini
              key={key}
              label={titleCase(key)}
              value={MONEY_KEYS.has(key) ? formatMoney(Number(val)) : formatNumber(Number(val))}
              accent={accent}
            />
          ))}
        </div>
      ) : null}

      {/* Chart — pivot > multi-series > single */}
      {pivotCfg && pivotData.length > 0 ? (
        <div style={{ marginBottom: 14 }}>
          <StackedAreaChartCard
            title={`${module.label} — by month`}
            data={pivotData}
            series={pivotSeries}
          />
        </div>
      ) : multiSeriesData.length > 1 ? (
        <div style={{ marginBottom: 14 }}>
          <StackedAreaChartCard
            title={`${module.label} — all series by date`}
            data={multiSeriesData}
            series={multiSeries}
          />
        </div>
      ) : singleSeriesData.length > 1 ? (
        <div style={{ marginBottom: 14 }}>
          <AreaChartCard
            title={`${module.label} — trend`}
            data={singleSeriesData}
            color={accent}
          />
        </div>
      ) : null}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {(['records', 'add', 'ai'] as const).map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? 'btn btn-primary' : 'btn btn-secondary'}
            style={activeTab === tab ? { background: accent, borderColor: accent, color: '#000' } : {}}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'records' ? `Records (${rows.length})` : tab === 'add' ? 'Add Row' : 'AI Insights'}
          </button>
        ))}
        {message && (
          <span className={`msg ${message.ok ? 'msg-ok' : 'msg-err'}`} style={{ marginLeft: 'auto', alignSelf: 'center' }}>
            {message.text}
          </span>
        )}
      </div>

      {/* Records Table */}
      {activeTab === 'records' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap" style={{ maxHeight: 520 }}>
            <table>
              <thead>
                <tr>
                  {module.columns.map((col) => <th key={col.key}>{col.label}</th>)}
                  <th style={{ width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={module.columns.length + 1} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>No records yet. Add your first row above.</td></tr>
                )}
                {rows.map((row) => {
                  const isEditing = editingId === row.id;
                  return (
                    <tr key={row.id || JSON.stringify(row)}>
                      {module.columns.map((col) => (
                        <td key={col.key}>
                          {isEditing ? renderEditCell(col) : (
                            <span title={String(row[col.key] ?? '')}>
                              {String(row[col.key] ?? '')}
                            </span>
                          )}
                        </td>
                      ))}
                      <td>
                        <div className="td-actions">
                          {isEditing ? (
                            <>
                              <button className="btn-save" onClick={saveEdit} disabled={saving}>{saving ? '…' : 'Save'}</button>
                              <button className="btn-cancel" onClick={cancelEdit}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button className="btn-edit" onClick={() => startEdit(row)}>Edit</button>
                              <button className="btn-danger" onClick={() => deleteRow(row.id)}>✕</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Row Form */}
      {activeTab === 'add' && (
        <div className="card">
          <div className="card-header">
            <p className="section-title">Add a new record</p>
          </div>
          <div className="form-grid">
            {module.columns.map((col) => (
              <div key={col.key} className={`field${col.type === 'textarea' ? ' span-2' : ''}`}>
                <label>{col.label}</label>
                {col.type === 'select' ? (
                  <select value={String(form[col.key] ?? '')} onChange={(e) => setForm((f) => ({ ...f, [col.key]: e.target.value }))}>
                    <option value="">Select…</option>
                    {col.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : col.type === 'textarea' ? (
                  <textarea value={String(form[col.key] ?? '')} onChange={(e) => setForm((f) => ({ ...f, [col.key]: e.target.value }))} />
                ) : (
                  <input
                    type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                    value={String(form[col.key] ?? '')}
                    onChange={(e) => setForm((f) => ({ ...f, [col.key]: col.type === 'number' ? Number(e.target.value) : e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
            <button className="btn btn-primary" style={{ background: accent, borderColor: accent, color: '#000' }} onClick={saveRow}>
              Save Record
            </button>
            <button className="btn btn-secondary" onClick={() => setForm(Object.fromEntries(module.columns.map((c) => [c.key, ''])))}>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* AI Insights */}
      {activeTab === 'ai' && <AiInsights slug={module.slug} rows={rows} />}
    </div>
  );
}

function StatMini({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="stat-card">
      <div className="stat-accent-bar" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ fontSize: '1.4rem' }}>{value}</div>
    </div>
  );
}

const FINANCE_NATURES = [
  { nature: 'Income',         label: 'Income',         color: '#00d4aa' },
  { nature: 'Expense',        label: 'Expenses',        color: '#f06292' },
  { nature: 'Savings',        label: 'Savings',         color: '#7c6ef7' },
  { nature: 'Debt',           label: 'Debt',            color: '#ef4444' },
  { nature: 'Emergency Fund', label: 'Emergency Fund',  color: '#38bdf8' },
  { nature: 'Frass',          label: 'Monthly Goals',   color: '#f5a623' },
];

function FinanceStatCards({ rows, accent }: { rows: RecordShape[]; accent: string }) {
  const totals = useMemo(() => {
    const map: Record<string, number> = {};
    rows.forEach((r) => {
      const nature = String(r.financial_nature ?? '').trim();
      const amount = Number(r.amount || 0);
      if (nature) map[nature] = (map[nature] ?? 0) + amount;
    });
    return map;
  }, [rows]);

  return (
    <div className="stat-grid" style={{ marginBottom: 14 }}>
      {FINANCE_NATURES.map(({ nature, label, color }) => (
        <StatMini
          key={nature}
          label={label}
          value={formatMoney(totals[nature] ?? 0)}
          accent={color}
        />
      ))}
    </div>
  );
}