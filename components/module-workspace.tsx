'use client';

import { useMemo, useState, useCallback } from 'react';
import { AiInsights } from '@/components/ai-insights';
import { AreaChartCard, BarChartCard } from '@/components/charts';
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

  // Build a quick chart from numeric data
  const chartData = useMemo(() => {
    const dateCol = module.columns.find((c) => c.type === 'date');
    const numCol = module.columns.find((c) => c.type === 'number');
    if (!dateCol || !numCol) return [];
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const label = String(r[dateCol.key] ?? '').slice(0, 7) || 'N/A';
      map.set(label, (map.get(label) ?? 0) + Number(r[numCol.key] || 0));
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([label, value]) => ({ label, value }));
  }, [rows, module.columns]);

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

      {/* Stat cards */}
      {numericTotals.length > 0 && (
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
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <div style={{ marginBottom: 14 }}>
          <AreaChartCard
            title={`${module.label} — trend`}
            data={chartData}
            color={accent}
          />
        </div>
      )}

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