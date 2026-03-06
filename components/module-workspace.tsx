'use client';

import { useMemo, useState } from 'react';
import { AiInsights } from '@/components/ai-insights';
import type { ModuleConfig, RecordShape } from '@/lib/types';
import { formatMoney, formatNumber, titleCase } from '@/lib/format';

export function ModuleWorkspace({ module, initialRows }: { module: ModuleConfig; initialRows: RecordShape[] }) {
  const [rows, setRows] = useState<RecordShape[]>(initialRows);
  const [form, setForm] = useState<RecordShape>(() => Object.fromEntries(module.columns.map((column) => [column.key, ''])));
  const [message, setMessage] = useState('');

  const totals = useMemo(() => {
    const numericColumns = module.columns.filter((column) => column.type === 'number');
    return Object.fromEntries(
      numericColumns.map((column) => [
        column.key,
        rows.reduce((sum, row) => sum + Number(row[column.key] || 0), 0),
      ]),
    );
  }, [module.columns, rows]);

  async function refresh() {
    const result = await fetch(`/api/records/${module.slug}`);
    const data = await result.json();
    setRows(data.rows || []);
  }

  async function saveRow() {
    setMessage('');
    const result = await fetch(`/api/records/${module.slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await result.json();
    if (!result.ok) {
      setMessage(data.error || 'Save failed.');
      return;
    }
    setMessage('Saved.');
    setForm(Object.fromEntries(module.columns.map((column) => [column.key, ''])));
    await refresh();
  }

  async function deleteRow(id?: string) {
    if (!id) return;
    const result = await fetch(`/api/records/${module.slug}?id=${id}`, { method: 'DELETE' });
    const data = await result.json();
    if (!result.ok) {
      setMessage(data.error || 'Delete failed.');
      return;
    }
    setMessage('Deleted.');
    await refresh();
  }

  return (
    <div className="stack">
      <section className="hero">
        <div>
          <p className="eyebrow">Module</p>
          <h2>{module.label}</h2>
          <p className="muted">{module.description}</p>
        </div>
        <div className="hero-chip" style={{ borderColor: module.accent }}>{rows.length} records</div>
      </section>

      <section className="grid grid-3">
        {Object.entries(totals).slice(0, 4).map(([key, value]) => (
          <div key={key} className="card stat-card">
            <p className="muted small">{titleCase(key)}</p>
            <h3>{String(key).includes('income') || String(key).includes('budget') || String(key).includes('price') || key === 'amount' || key === 'expense' ? formatMoney(Number(value)) : formatNumber(Number(value))}</h3>
          </div>
        ))}
      </section>

      <section className="grid grid-split">
        <div className="card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Quick add</p>
              <h3>Add or update information</h3>
            </div>
          </div>
          <div className="form-grid">
            {module.columns.map((column) => (
              <label key={column.key} className={column.type === 'textarea' ? 'field span-2' : 'field'}>
                <span>{column.label}</span>
                {column.type === 'select' ? (
                  <select value={String(form[column.key] ?? '')} onChange={(event) => setForm((current) => ({ ...current, [column.key]: event.target.value }))}>
                    <option value="">Select</option>
                    {column.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : column.type === 'textarea' ? (
                  <textarea value={String(form[column.key] ?? '')} onChange={(event) => setForm((current) => ({ ...current, [column.key]: event.target.value }))} />
                ) : (
                  <input
                    type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
                    value={String(form[column.key] ?? '')}
                    onChange={(event) => setForm((current) => ({ ...current, [column.key]: column.type === 'number' ? Number(event.target.value) : event.target.value }))}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="actions">
            <button className="button primary" onClick={saveRow}>Save row</button>
            {message ? <span className="muted small">{message}</span> : null}
          </div>
        </div>

        <AiInsights slug={module.slug} rows={rows} />
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Records</p>
            <h3>{module.label} table</h3>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {module.columns.map((column) => <th key={column.key}>{column.label}</th>)}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id || JSON.stringify(row)}>
                  {module.columns.map((column) => <td key={column.key}>{String(row[column.key] ?? '')}</td>)}
                  <td><button className="link-button" onClick={() => deleteRow(row.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
