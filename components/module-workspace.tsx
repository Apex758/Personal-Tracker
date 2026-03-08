'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import { AiInsights } from '@/components/ai-insights';
import { AreaChartCard, StackedAreaChartCard } from '@/components/charts';
import type { ModuleConfig, RecordShape } from '@/lib/types';
import { formatMoney, formatNumber, titleCase } from '@/lib/format';
import { useMonth } from '@/lib/month-context';
import { GlareHover } from '@/components/GlareHover';


const MONEY_KEYS = new Set(['amount', 'income', 'expense', 'budget', 'estimated_cost', 'actual_cost', 'target_budget', 'expected_price', 'actual_price', 'expected_income', 'actual_income']);
const ACCENT_MAP: Record<string, string> = {
  finance: '#00d4aa',
  lifestyle: '#f06292',
  skills: '#7c6ef7',
  work: '#f5a623',
  travel: '#38bdf8',
  wishlist: '#c084fc',
};

const MULTI_SERIES_MODULES = new Set(['lifestyle', 'finance', 'work', 'skills']);

const SERIES_PALETTE = [
  '#00d4aa', '#f06292', '#7c6ef7', '#f5a623',
  '#38bdf8', '#c084fc', '#4ade80', '#fb923c',
];

const PIVOT_CONFIG: Record<string, { groupBy: string; valueKey: string; labelKey?: string }> = {
  finance: { groupBy: 'financial_nature', valueKey: 'amount' },
  work:    { groupBy: 'status',           valueKey: 'hours' },
};

const FINANCE_NATURE_COLORS: Record<string, string> = {
  Income:           '#00d4aa',
  Expense:          '#f06292',
  Savings:          '#7c6ef7',
  Frass:            '#f5a623',
  Debt:             '#ef4444',
  'Emergency Fund': '#38bdf8',
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function autoEnrich(slug: string, payload: RecordShape): RecordShape {
  if (slug === 'finance' && payload.date) {
    const d = new Date(String(payload.date));
    if (!isNaN(d.getTime())) {
      payload = { ...payload, month: MONTHS[d.getMonth()] };
    }
  }
  return payload;
}

const HIDDEN_FORM_KEYS: Record<string, Set<string>> = {
  finance: new Set(['month']),
};

type EditState = Record<string, string | number | null>;

// ─── Lifestyle inline checkbox row ───────────────────────────────────────────
function LifestyleInlineAdd({
  module,
  accent,
  onSaved,
}: {
  module: ModuleConfig;
  accent: string;
  onSaved: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const numCols = module.columns.filter((c) => c.type === 'number');
  const noteCols = module.columns.filter((c) => c.type === 'textarea');

  function toggle(key: string) {
    setChecks((p) => ({ ...p, [key]: !p[key] }));
  }

  async function handleSave() {
    setSaving(true);
    const payload: RecordShape = { date };
    numCols.forEach((c) => { payload[c.key] = checks[c.key] ? 1 : null; });
    noteCols.forEach((c) => { payload[c.key] = null; });

    const res = await fetch(`/api/records/${module.slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMsg({ text: data.error || 'Save failed.', ok: false }); return; }
    setChecks({});
    setDate(today);
    setMsg({ text: 'Row added ✓', ok: true });
    setTimeout(() => setMsg(null), 2500);
    onSaved();
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="eyebrow">Add today's entry</span>
        {msg && (
          <span className={`msg ${msg.ok ? 'msg-ok' : 'msg-err'}`}>{msg.text}</span>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', background: 'var(--surface-2)', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>
                Date
              </th>
              {numCols.map((col) => (
                <th key={col.key} style={{ padding: '10px 10px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', background: 'var(--surface-2)', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>
                  {col.label}
                </th>
              ))}
              <th style={{ padding: '10px 14px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }} />
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* Date cell */}
              <td style={{ padding: '10px 14px', borderBottom: 'none', verticalAlign: 'middle' }}>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = accent)}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </td>

              {/* Checkbox cells */}
              {numCols.map((col) => (
                <td key={col.key} style={{ padding: '10px', textAlign: 'center', verticalAlign: 'middle', borderBottom: 'none' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!checks[col.key]}
                      onChange={() => toggle(col.key)}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 3,
                        accentColor: accent,
                        cursor: 'pointer',
                      }}
                    />
                  </label>
                </td>
              ))}

              {/* Save button */}
              <td style={{ padding: '10px 14px', verticalAlign: 'middle', borderBottom: 'none', whiteSpace: 'nowrap' }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ background: accent, borderColor: accent, color: '#000', padding: '7px 18px', fontSize: '0.82rem' }}
                >
                  {saving ? '…' : 'Save'}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ModuleWorkspace({ module, initialRows }: { module: ModuleConfig; initialRows: RecordShape[] }) {
  const [rows, setRows] = useState<RecordShape[]>(initialRows);
  const router = useRouter();

  const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear, MONTHS, YEAR_OPTIONS } = useMonth();

  const [allGoals, setAllGoals] = useState<Record<string, number>>({});
  useEffect(() => {
    try {
      const s = localStorage.getItem('finance_goals_v2');
      if (s) setAllGoals(JSON.parse(s));
    } catch {}
  }, []);

  function goalKey(nature: string) { return `${selectedYear}_${selectedMonth}_${nature}`; }

  const financeGoals = useMemo(() => {
    const map: Record<string, number> = {};
    FINANCE_NATURES_LIST.forEach(({ nature }) => {
      const v = allGoals[goalKey(nature)];
      if (v) map[nature] = v;
    });
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allGoals, selectedMonth, selectedYear]);

  function updateGoal(nature: string, value: number) {
    const next = { ...allGoals, [goalKey(nature)]: value };
    setAllGoals(next);
    try { localStorage.setItem('finance_goals_v2', JSON.stringify(next)); } catch {}
  }

  const [form, setForm] = useState<RecordShape>(() =>
    Object.fromEntries(module.columns.map((col) => [col.key, ''])),
  );

  useEffect(() => {
    if (module.slug !== 'finance') return;
    const monthIndex = MONTHS.indexOf(selectedMonth);
    const pad = String(monthIndex + 1).padStart(2, '0');
    const defaultDate = `${selectedYear}-${pad}-01`;
    setForm((f) => ({ ...f, date: defaultDate }));
  }, [selectedMonth, selectedYear, module.slug]);

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

  const numericCols = useMemo(
    () => module.columns.filter((c) => c.type === 'number'),
    [module.columns],
  );

  const dateCol = useMemo(
    () => module.columns.find((c) => c.type === 'date'),
    [module.columns],
  );

  const pivotCfg = PIVOT_CONFIG[module.slug];

  const displayRows = useMemo(() => {
    const dateCol = module.columns.find((c) => c.type === 'date');
    if (!dateCol) return rows;
    return rows.filter((r) => {
      const dateStr = String(r[dateCol.key] ?? '');
      if (!dateStr || dateStr === 'null') return true;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true;
      return d.getFullYear() === selectedYear &&
        d.toLocaleString('default', { month: 'long' }) === selectedMonth;
    });
  }, [rows, module, selectedMonth, selectedYear]);

  const { pivotData, pivotSeries } = useMemo(() => {
    if (!pivotCfg) return { pivotData: [], pivotSeries: [] };

    const { groupBy, valueKey } = pivotCfg;

    const categorySet = new Set<string>();
    rows.forEach((r) => {
      const cat = String(r[groupBy] ?? '').trim();
      if (cat) categorySet.add(cat);
    });
    const categories = Array.from(categorySet);

    const isFinance = module.slug === 'finance';
    const MONTHS_12 = ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06',
                       '2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'];

    const map = new Map<string, Record<string, number>>();

    if (isFinance) {
      MONTHS_12.forEach((m) => map.set(m, {}));
    }

    rows.forEach((r) => {
      const rawDate = String(r[dateCol?.key ?? 'date'] ?? '');
      if (!rawDate || rawDate === 'null') return;
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

  const { multiSeriesData, multiSeries } = useMemo(() => {
    if (pivotCfg || numericCols.length < 2 || !MULTI_SERIES_MODULES.has(module.slug)) {
      return { multiSeriesData: [], multiSeries: [] };
    }
    const map = new Map<string, Record<string, number>>();
    displayRows.forEach((r) => {
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
  }, [displayRows, pivotCfg, dateCol, numericCols, module.slug]);

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
    router.refresh();
  }

  function showMsg(text: string, ok: boolean) {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 3000);
  }

  async function saveRow() {
    const enriched = autoEnrich(module.slug, form);
    const res = await fetch(`/api/records/${module.slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enriched),
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
      const res = await fetch(`/api/records/${module.slug}/${editingId}`, {
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

  const collapsedKey = `table_collapsed_${module.slug}`;
  const [tableCollapsed, setTableCollapsed] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(collapsedKey);
      if (saved !== null) setTableCollapsed(saved === 'true');
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsedKey]);

  function toggleCollapsed(val: boolean) {
    setTableCollapsed(val);
    try { localStorage.setItem(collapsedKey, String(val)); } catch {}
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="hero">
        <div className="hero-meta">
          <p className="eyebrow">Module</p>
          <h1 className="page-title" style={{ color: accent }}>{module.label}</h1>
          <p className="muted small" style={{ maxWidth: 440, marginTop: 4 }}>{module.description}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {module.columns.some((c) => c.type === 'date') && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
          <div className="record-chip">
            <strong>{module.slug === 'finance' ? displayRows.length : rows.length}</strong> records
          </div>
        </div>
      </div>

      {/* Stat cards */}
      {module.slug === 'finance' ? (
        <FinanceStatCards
          rows={displayRows}
          accent={accent}
          goals={financeGoals}
          onGoalChange={updateGoal}
          monthLabel={`${selectedMonth} ${selectedYear}`}
        />
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

      {/* Chart */}
      {module.slug === 'finance' && pivotData.length > 0 ? (
        <div style={{ marginBottom: 14 }}>
          <FinanceChartCard data={pivotData} series={pivotSeries} goals={financeGoals} tall={tableCollapsed} />
        </div>
      ) : pivotCfg && pivotData.length > 0 ? (
        <div style={{ marginBottom: 14 }}>
          <StackedAreaChartCard title={`${module.label} — by month`} data={pivotData} series={pivotSeries} height={tableCollapsed ? 480 : undefined} />
        </div>
      ) : multiSeriesData.length > 1 ? (
        <div style={{ marginBottom: 14 }}>
          <StackedAreaChartCard title={`${module.label} — all series by date`} data={multiSeriesData} series={multiSeries} height={tableCollapsed ? 480 : undefined} />
        </div>
      ) : singleSeriesData.length > 1 ? (
        <div style={{ marginBottom: 14 }}>
          <AreaChartCard title={`${module.label} — trend`} data={singleSeriesData} color={accent} height={tableCollapsed ? 480 : undefined} />
        </div>
      ) : module.slug === 'skills' ? (
        <div style={{ marginBottom: 14 }}>
          <SkillsProgressChart rows={displayRows} accent={accent} />
        </div>
      ) : null}


      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center' }}>
        {!tableCollapsed && (['records', 'add', 'ai'] as const).map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? 'btn btn-primary' : 'btn btn-secondary'}
            style={activeTab === tab ? { background: accent, borderColor: accent, color: '#000' } : {}}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'records' ? `Records (${module.slug === 'finance' ? displayRows.length : rows.length})` : tab === 'add' ? 'Add Row' : 'AI Insights'}
          </button>
        ))}
        <button
          onClick={() => toggleCollapsed(!tableCollapsed)}
          style={{
            marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '6px 14px', borderRadius: 99,
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            color: 'var(--text-3)', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {tableCollapsed ? '↓ Expand table' : '↑ Collapse table'}
        </button>
        {message && !tableCollapsed && (
          <span className={`msg ${message.ok ? 'msg-ok' : 'msg-err'}`} style={{ alignSelf: 'center' }}>
            {message.text}
          </span>
        )}
      </div>

      {/* Collapsible content */}
      <div style={{
        overflow: 'hidden',
        maxHeight: tableCollapsed ? 0 : '2000px',
        opacity: tableCollapsed ? 0 : 1,
        transition: 'max-height 0.35s ease, opacity 0.25s ease',
        pointerEvents: tableCollapsed ? 'none' : undefined,
      }}>

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
                  {displayRows.length === 0 && (
                    <tr><td colSpan={module.columns.length + 1} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
                      No records for {module.slug === 'finance' ? `${selectedMonth} ${selectedYear}` : 'this module'}.
                    </td></tr>
                  )}
                  {displayRows.map((row) => {
                    const isEditing = editingId === row.id;
                    return (
                      <tr key={row.id || JSON.stringify(row)}>
                        {module.columns.map((col) => (
                          <td key={col.key}>
                            {isEditing ? renderEditCell(col) : (
                              <span title={String(row[col.key] ?? '')}>{String(row[col.key] ?? '')}</span>
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

        {/* Add Row */}
        {activeTab === 'add' && (
          module.slug === 'lifestyle' ? (
            /* ── Lifestyle: inline checkbox row ── */
            <LifestyleInlineAdd module={module} accent={accent} onSaved={refresh} />
          ) : (
            /* ── All other modules: standard form ── */
            <div className="card">
              <div className="card-header">
                <p className="section-title">Add a new record</p>
              </div>
              <div className="form-grid">
                {module.columns
                  .filter((col) => !HIDDEN_FORM_KEYS[module.slug]?.has(col.key))
                  .map((col) => (
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
                          {...(col.type === 'date' && (() => {
                            const monthIndex = MONTHS.indexOf(selectedMonth);
                            const pad = String(monthIndex + 1).padStart(2, '0');
                            const daysInMonth = new Date(selectedYear, monthIndex + 1, 0).getDate();
                            return {
                              min: `${selectedYear}-${pad}-01`,
                              max: `${selectedYear}-${pad}-${String(daysInMonth).padStart(2, '0')}`,
                            };
                          })())}
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
          )
        )}

        {/* AI Insights */}
        {activeTab === 'ai' && <AiInsights slug={module.slug} rows={rows} />}
      </div>
    </div>
  );
}

// ─── Finance Chart ────────────────────────────────────────────────────────────
const SHORT_MONTHS: Record<string, string> = {
  '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun',
  '07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec',
};
function fmtMonth(val: string) {
  if (/^\d{4}-\d{2}$/.test(val)) return SHORT_MONTHS[val.slice(5)] ?? val;
  return val;
}

const tooltipStyle = {
  contentStyle: { background: '#141820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12, color: '#f0f4ff', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' },
  itemStyle: { color: '#8892a4' },
  labelStyle: { color: '#f0f4ff', fontWeight: 700 },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
};

function FinanceChartCard({ data, series, goals, tall = false }: { data: Record<string, unknown>[]; series: { key: string; label: string; color: string }[]; goals: Record<string, number>; tall?: boolean }) {
  const [activeSeries, setActiveSeries] = useState<Set<string>>(() => new Set(series.map((s) => s.key)));
  const [activeGoals, setActiveGoals] = useState<Set<string>>(new Set());

  useEffect(() => { setActiveSeries(new Set(series.map((s) => s.key))); }, [series.map((s) => s.key).join(',')]);

  function toggleSeries(key: string) { setActiveSeries((prev) => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; }); }
  function toggleGoal(key: string) { setActiveGoals((prev) => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; }); }

  const seriesWithGoals = series.filter((s) => (goals[s.key] ?? 0) > 0);

  return (
    <div className="card">
      <div className="card-header" style={{ alignItems: 'flex-start' }}>
        <p className="section-title">Finance — by month</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', alignSelf: 'center', marginRight: 2 }}>Series:</span>
            {series.map((s) => {
              const on = activeSeries.has(s.key);
              return (
                <button key={s.key} onClick={() => toggleSeries(s.key)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: `1px solid ${on ? s.color : 'var(--border)'}`, background: on ? `${s.color}18` : 'transparent', color: on ? s.color : 'var(--text-3)', transition: 'all 0.15s' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: on ? s.color : 'var(--text-3)', display: 'inline-block' }} />
                  {s.label}
                </button>
              );
            })}
          </div>
          {seriesWithGoals.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', alignSelf: 'center', marginRight: 2 }}>Goals:</span>
              {seriesWithGoals.map((s) => {
                const on = activeGoals.has(s.key);
                return (
                  <button key={s.key} onClick={() => toggleGoal(s.key)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: `1px solid ${on ? s.color : 'var(--border)'}`, background: on ? `${s.color}10` : 'transparent', color: on ? s.color : 'var(--text-3)', transition: 'all 0.15s' }}>
                    <span style={{ width: 16, height: 2, borderTop: `2px dashed ${on ? s.color : 'var(--text-3)'}`, display: 'inline-block' }} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div style={{ height: tall ? 480 : 300, transition: 'height 0.3s ease' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`fcg-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0.04} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#4d5668' }} axisLine={false} tickLine={false} tickFormatter={fmtMonth} />
            <YAxis tick={{ fontSize: 11, fill: '#4d5668' }} axisLine={false} tickLine={false} />
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div style={{ ...tooltipStyle.contentStyle, padding: '10px 14px', minWidth: 140 }}>
                  <p style={{ color: '#f0f4ff', fontWeight: 700, marginBottom: 6, fontSize: 12 }}>{fmtMonth(String(label))}</p>
                  {payload.map((p: any) => (
                    <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ color: '#8892a4', fontSize: 11 }}>{p.name}</span>
                      <span style={{ color: '#f0f4ff', fontSize: 11, marginLeft: 'auto', fontWeight: 600 }}>{p.value}</span>
                    </div>
                  ))}
                </div>
              );
            }} />
            <Legend iconSize={8} iconType="circle" formatter={(value) => <span style={{ color: '#8892a4', fontSize: 11 }}>{value}</span>} />
            {series.map((s) => activeSeries.has(s.key) ? (
              <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} fill={`url(#fcg-${s.key})`} dot={false} activeDot={{ r: 4, fill: s.color, strokeWidth: 0 }} connectNulls />
            ) : null)}
            {series.map((s) => activeGoals.has(s.key) && (goals[s.key] ?? 0) > 0 ? (
              <ReferenceLine key={`goal-${s.key}`} y={goals[s.key]} stroke={s.color} strokeDasharray="6 3" strokeWidth={1.5} label={{ value: `${s.label} goal`, fill: s.color, fontSize: 10, position: 'insideTopRight' }} />
            ) : null)}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SkillsProgressChart({ rows, accent }: { rows: RecordShape[]; accent: string }) {
  const data = rows.slice(0, 12).map((r) => ({
    label: String(r.specific_skill ?? '').slice(0, 18) || 'Unnamed',
    current: Number(r.current_level ?? 0),
    target: Number(r.target_level ?? 0),
    hours: Number(r.hours_invested ?? 0),
  }));

  if (!data.length) return null;

  return (
    <div className="grid grid-2" style={{ gap: 14 }}>
      {/* Level: current vs target */}
      <div className="card">
        <div className="card-header">
          <p className="section-title">Current vs Target Level</p>
        </div>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#4d5668' }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#4d5668' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#141820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="current" name="Current" fill={accent} fillOpacity={0.85} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="target" name="Target" fill="rgba(255,255,255,0.12)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hours invested per skill */}
      <div className="card">
        <div className="card-header">
          <p className="section-title">Hours Invested</p>
        </div>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#4d5668' }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: '#4d5668' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#141820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="hours" name="Hours" fill="#38bdf8" fillOpacity={0.85} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatMini({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <GlareHover
      glareColor="#ffffff"
      glareOpacity={0.18}
      glareAngle={-30}
      glareSize={300}
      transitionDuration={700}
      className="stat-card"
    >
      <div className="stat-accent-bar" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ fontSize: '1.4rem' }}>{value}</div>
    </GlareHover>
  );
}

const FINANCE_NATURES_LIST = [
  { nature: 'Income',         label: 'Income',        color: '#00d4aa', lowerIsBetter: false },
  { nature: 'Expense',        label: 'Expenses',       color: '#f06292', lowerIsBetter: true  },
  { nature: 'Savings',        label: 'Savings',        color: '#7c6ef7', lowerIsBetter: false },
  { nature: 'Frass',          label: 'Frass',          color: '#f5a623', lowerIsBetter: true  },
  { nature: 'Debt',           label: 'Debt',           color: '#ef4444', lowerIsBetter: true  },
  { nature: 'Emergency Fund', label: 'Emergency Fund', color: '#38bdf8', lowerIsBetter: false },
];

function FinanceStatCards({ rows, accent, goals, onGoalChange, monthLabel }: { rows: RecordShape[]; accent: string; goals: Record<string, number>; onGoalChange: (nature: string, value: number) => void; monthLabel: string }) {
  const totals = useMemo(() => {
    const map: Record<string, number> = {};
    rows.forEach((r) => { const nature = String(r.financial_nature ?? '').trim(); const amount = Number(r.amount || 0); if (nature) map[nature] = (map[nature] ?? 0) + amount; });
    return map;
  }, [rows]);

  const [editingNature, setEditingNature] = useState<string | null>(null);
  const [draftGoal, setDraftGoal] = useState('');

  return (
    <div className="stat-grid" style={{ marginBottom: 14 }}>
      {FINANCE_NATURES_LIST.map(({ nature, label, color, lowerIsBetter }) => {
        const actual = totals[nature] ?? 0;
        const goal = goals[nature] ?? 0;
        const isEditing = editingNature === nature;
        const pct = goal > 0 ? (actual / goal) * 100 : 0;
        const displayPct = Math.min(pct, 100);
        let barColor: string;
        if (lowerIsBetter) { barColor = pct > 100 ? '#ef4444' : pct > 80 ? '#f5a623' : '#4ade80'; }
        else { barColor = pct >= 80 ? '#4ade80' : pct >= 40 ? '#f5a623' : '#ef4444'; }
        const statusLabel = goal > 0 ? lowerIsBetter ? pct > 100 ? `${(pct - 100).toFixed(0)}% over goal` : `${(100 - pct).toFixed(0)}% under goal` : pct > 100 ? `${(pct - 100).toFixed(0)}% over goal 🎉` : `${pct.toFixed(0)}% of goal` : null;

        return (
          <div key={nature} className="stat-card">
            <div className="stat-accent-bar" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{formatMoney(actual)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              {isEditing ? (
                <>
                  <input type="number" value={draftGoal} autoFocus onChange={(e) => setDraftGoal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { onGoalChange(nature, Number(draftGoal)); setEditingNature(null); } if (e.key === 'Escape') setEditingNature(null); }}
                    style={{ width: 90, padding: '2px 6px', fontSize: '0.75rem', background: 'var(--surface-3)', border: `1px solid ${color}`, borderRadius: 4, color: 'var(--text)' }} />
                  <button onClick={() => { onGoalChange(nature, Number(draftGoal)); setEditingNature(null); }} style={{ fontSize: '0.72rem', color, background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}>✓</button>
                  <button onClick={() => setEditingNature(null)} style={{ fontSize: '0.72rem', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}>✕</button>
                </>
              ) : (
                <button onClick={() => { setEditingNature(nature); setDraftGoal(String(goals[nature] ?? '')); }} style={{ fontSize: '0.72rem', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                  {goal > 0 ? `${monthLabel} goal: ${formatMoney(goal)} ✎` : <span style={{ color, opacity: 0.7 }}>+ Set {monthLabel} goal</span>}
                </button>
              )}
            </div>
            {goal > 0 && (
              <>
                <div style={{ marginTop: 8, height: 4, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${displayPct}%`, background: barColor, borderRadius: 99, transition: 'width 0.4s ease' }} />
                </div>
                {statusLabel && <div style={{ fontSize: '0.68rem', color: barColor, marginTop: 3, fontWeight: 600 }}>{statusLabel}</div>}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}