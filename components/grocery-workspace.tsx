'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useMonth } from '@/lib/month-context';
import { ChevronRight, ChevronLeft, Plus, X, Copy, ClipboardPaste } from 'lucide-react';
import type { RecordShape } from '@/lib/types';

type GroceryRow = RecordShape & {
  category: string;
  item: string;
  goal_amount: number;
  actual_amount: number;
  notes?: string;
};

const CATEGORY_ORDER = ['Protein','Carbs','Fats','Vegetables & Fruit','Flavor','Toiletries','Extra'];

const CATEGORY_ACCENTS: Record<string, string> = {
  'Protein':'#00d4aa','Carbs':'#f5a623','Fats':'#7c6ef7',
  'Vegetables & Fruit':'#4ade80','Flavor':'#f06292','Toiletries':'#38bdf8','Extra':'#c084fc',
};

function num(v: unknown) { return Number(v) || 0; }

type SavedTemplate = {
  name: string;
  savedAt: string;
  items: Array<{ category: string; item: string; goal_amount: number; actual_amount: number; notes: string }>;
};

export function GroceryWorkspace({ initialRows }: { initialRows: RecordShape[] }) {
  const [rows, setRows] = useState<GroceryRow[]>(initialRows as GroceryRow[]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<GroceryRow>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [form, setForm] = useState({ category: CATEGORY_ORDER[0], item: '', goal_amount: '', actual_amount: '', notes: '' });

  // Template state
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const templateMenuRef = useRef<HTMLDivElement>(null);

  const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear, MONTHS, YEAR_OPTIONS } = useMonth();

  // Load templates from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('grocery_templates');
      if (saved) setTemplates(JSON.parse(saved));
    } catch {}
  }, []);

  // Close template menu on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (templateMenuRef.current && !templateMenuRef.current.contains(e.target as Node)) {
        setShowTemplateMenu(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const displayRows = useMemo(() => {
    return rows.filter((r) => {
      const raw = String(r.date ?? '');
      if (!raw || raw === 'null') return true;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return true;
      return d.getFullYear() === selectedYear &&
        d.toLocaleString('default', { month: 'long' }) === selectedMonth;
    });
  }, [rows, selectedMonth, selectedYear]);

  // Panel collapse state
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('grocery_panel_collapsed');
      if (saved !== null) setPanelCollapsed(saved === 'true');
    } catch {}
  }, []);

  function togglePanel() {
    const next = !panelCollapsed;
    setPanelCollapsed(next);
    try { localStorage.setItem('grocery_panel_collapsed', String(next)); } catch {}
  }

  function showMsg(text: string, ok: boolean) { setMessage({ text, ok }); setTimeout(() => setMessage(null), 3000); }

  async function refresh() {
    const res = await fetch('/api/records/grocery');
    const data = await res.json();
    setRows((data.rows || []) as GroceryRow[]);
  }

  async function saveRow() {
    const monthIndex = MONTHS.indexOf(selectedMonth);
    const pad = String(monthIndex + 1).padStart(2, '0');
    const date = `${selectedYear}-${pad}-01`;

    const res = await fetch('/api/records/grocery', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, category: form.category, item: form.item, goal_amount: Number(form.goal_amount)||0, actual_amount: Number(form.actual_amount)||0, notes: form.notes }),
    });
    const data = await res.json();
    if (!res.ok) { showMsg(data.error||'Save failed.', false); return; }
    showMsg('Item added ✓', true);
    setForm({ category: CATEGORY_ORDER[0], item:'', goal_amount:'', actual_amount:'', notes:'' });
    await refresh();
  }

  async function deleteRow(id?: string) {
    if (!id) return;
    const res = await fetch(`/api/records/grocery?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { showMsg(data.error||'Delete failed.', false); return; }
    showMsg('Deleted.', true);
    await refresh();
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    try {
      const payload = { ...draft } as Record<string, unknown>;
      delete payload.id; delete payload.created_at; delete payload.updated_at;
      const res = await fetch(`/api/records/grocery_entries/${editingId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { showMsg(data.error||'Update failed.', false); return; }
      showMsg('Updated ✓', true); setEditingId(null); setDraft({});
      await refresh();
    } finally { setSaving(false); }
  }

  // ─── Template functions ────────────────────────────────────────────────────

  function saveTemplate() {
    if (!templateName.trim()) return;
    const items = displayRows.map((r) => ({
      category: String(r.category || ''),
      item: String(r.item || ''),
      goal_amount: num(r.goal_amount),
      actual_amount: 0, // reset actuals when saving template
      notes: String(r.notes || ''),
    }));
    const newTemplate: SavedTemplate = {
      name: templateName.trim(),
      savedAt: new Date().toLocaleDateString(),
      items,
    };
    const updated = [newTemplate, ...templates.filter(t => t.name !== newTemplate.name)];
    setTemplates(updated);
    try { localStorage.setItem('grocery_templates', JSON.stringify(updated)); } catch {}
    setShowSaveDialog(false);
    setTemplateName('');
    showMsg(`Saved as "${newTemplate.name}" ✓`, true);
  }

  async function pasteTemplate(template: SavedTemplate) {
    setShowTemplateMenu(false);
    const monthIndex = MONTHS.indexOf(selectedMonth);
    const pad = String(monthIndex + 1).padStart(2, '0');
    const date = `${selectedYear}-${pad}-01`;

    let count = 0;
    for (const item of template.items) {
      const res = await fetch('/api/records/grocery', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, category: item.category, item: item.item, goal_amount: item.goal_amount, actual_amount: 0, notes: item.notes }),
      });
      if (res.ok) count++;
    }
    await refresh();
    showMsg(`Pasted ${count} items from "${template.name}" ✓`, true);
  }

  function deleteTemplate(name: string) {
    const updated = templates.filter(t => t.name !== name);
    setTemplates(updated);
    try { localStorage.setItem('grocery_templates', JSON.stringify(updated)); } catch {}
  }

  const grouped = useMemo(() => {
    const map = new Map<string, GroceryRow[]>();
    CATEGORY_ORDER.forEach((cat) => map.set(cat, []));
    displayRows.forEach((r) => { const cat = r.category||'Extra'; if (!map.has(cat)) map.set(cat,[]); map.get(cat)!.push(r); });
    return map;
  }, [displayRows]);

  const grandGoal = useMemo(() => displayRows.reduce((s,r) => s+num(r.goal_amount),0), [displayRows]);
  const grandActual = useMemo(() => displayRows.reduce((s,r) => s+num(r.actual_amount),0), [displayRows]);
  const grandVariance = grandGoal - grandActual;
  const budgetPct = grandGoal > 0 ? Math.min((grandActual/grandGoal)*100,100) : 0;

  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div className="hero">
        <div className="hero-meta">
          <p className="eyebrow">Module</p>
          <h1 className="page-title" style={{ color:'#4ade80' }}>Grocery Budget</h1>
          <p className="muted small" style={{ maxWidth:440, marginTop:4 }}>Each month keeps its own list. Save any month as a template to reuse it.</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          {/* Month / Year pickers */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding:'6px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text)', fontSize:'0.85rem', cursor:'pointer' }}
          >
            {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ padding:'6px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text)', fontSize:'0.85rem', cursor:'pointer' }}
          >
            {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          {/* Template controls */}
          <button
            onClick={() => { setTemplateName(`${selectedMonth} ${selectedYear}`); setShowSaveDialog(true); }}
            disabled={displayRows.length === 0}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'6px 14px', borderRadius:8, cursor:'pointer',
              border:'1px solid var(--border)', background:'var(--surface-2)',
              color: displayRows.length === 0 ? 'var(--text-3)' : 'var(--text)',
              fontSize:'0.82rem', fontWeight:600, transition:'all 0.15s',
            }}
            title="Save current list as template"
          >
            <Copy size={14} /> Save as template
          </button>

          <div style={{ position:'relative' }} ref={templateMenuRef}>
            <button
              onClick={() => setShowTemplateMenu(v => !v)}
              disabled={templates.length === 0}
              style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'6px 14px', borderRadius:8, cursor:'pointer',
                border:`1px solid ${templates.length > 0 ? '#4ade80' : 'var(--border)'}`,
                background: templates.length > 0 ? 'rgba(74,222,128,0.08)' : 'var(--surface-2)',
                color: templates.length > 0 ? '#4ade80' : 'var(--text-3)',
                fontSize:'0.82rem', fontWeight:600, transition:'all 0.15s',
              }}
              title="Paste a saved template into this month"
            >
              <ClipboardPaste size={14} /> Paste template {templates.length > 0 && `(${templates.length})`}
            </button>

            {showTemplateMenu && templates.length > 0 && (
              <div style={{
                position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:50,
                background:'var(--surface)', border:'1px solid var(--border)',
                borderRadius:10, minWidth:220, boxShadow:'0 8px 32px rgba(0,0,0,0.3)',
                overflow:'hidden',
              }}>
                <div style={{ padding:'8px 14px 6px', fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-3)', borderBottom:'1px solid var(--border)' }}>
                  Saved templates
                </div>
                {templates.map((t) => (
                  <div key={t.name} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 10px', borderBottom:'1px solid var(--border)' }}>
                    <button
                      onClick={() => pasteTemplate(t)}
                      style={{
                        flex:1, textAlign:'left', background:'none', border:'none',
                        cursor:'pointer', color:'var(--text)', fontSize:'0.84rem', padding:'2px 4px',
                        borderRadius:6, transition:'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <div style={{ fontWeight:600 }}>{t.name}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-3)' }}>{t.items.length} items · saved {t.savedAt}</div>
                    </button>
                    <button onClick={() => deleteTemplate(t.name)} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', padding:'4px', borderRadius:4, fontSize:'0.75rem' }} title="Delete template">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save template dialog */}
      {showSaveDialog && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:100,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <div style={{
            background:'var(--surface)', border:'1px solid var(--border)',
            borderRadius:14, padding:28, width:340, boxShadow:'0 16px 48px rgba(0,0,0,0.4)',
          }}>
            <p style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.1rem', marginBottom:16 }}>Save as Template</p>
            <p className="muted small" style={{ marginBottom:14 }}>Saves {displayRows.length} items. Actuals reset to 0 so you start fresh each month.</p>
            <div className="field" style={{ marginBottom:18 }}>
              <label>Template name</label>
              <input
                autoFocus
                type="text"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter') saveTemplate(); if(e.key==='Escape') setShowSaveDialog(false); }}
                placeholder="e.g. Standard weekly shop"
              />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowSaveDialog(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                style={{ background:'#4ade80', borderColor:'#4ade80', color:'#000' }}
                onClick={saveTemplate}
                disabled={!templateName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="stat-grid" style={{ marginBottom:14 }}>
        <div className="stat-card">
          <div className="stat-accent-bar" style={{ background:'linear-gradient(90deg,#4ade80,transparent)' }} />
          <div className="stat-label">Budget Goal</div>
          <div className="stat-value" style={{ fontSize:'1.4rem' }}>XCD {grandGoal.toFixed(0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-accent-bar" style={{ background:'linear-gradient(90deg,#f5a623,transparent)' }} />
          <div className="stat-label">Actual Spend</div>
          <div className="stat-value" style={{ fontSize:'1.4rem', color:grandActual>grandGoal?'#ef4444':undefined }}>XCD {grandActual.toFixed(0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-accent-bar" style={{ background:`linear-gradient(90deg,${grandVariance>=0?'#4ade80':'#ef4444'},transparent)` }} />
          <div className="stat-label">Remaining</div>
          <div className="stat-value" style={{ fontSize:'1.4rem', color:grandVariance>=0?'#4ade80':'#ef4444' }}>
            XCD {Math.abs(grandVariance).toFixed(0)}
            <span style={{ fontSize:'0.75rem',marginLeft:4,color:'var(--text-3)' }}>{grandVariance>=0?'under':'over'}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-accent-bar" style={{ background:'linear-gradient(90deg,#38bdf8,transparent)' }} />
          <div className="stat-label">Budget Used</div>
          <div className="stat-value" style={{ fontSize:'1.4rem' }}>{budgetPct.toFixed(0)}%</div>
          <div style={{ marginTop:8,height:4,background:'var(--surface-3)',borderRadius:99,overflow:'hidden' }}>
            <div style={{ height:'100%',width:`${budgetPct}%`,background:budgetPct>90?'#ef4444':budgetPct>70?'#f5a623':'#4ade80',borderRadius:99,transition:'width 0.4s ease' }} />
          </div>
        </div>
      </div>

      {message && <div className={`msg ${message.ok?'msg-ok':'msg-err'}`} style={{ marginBottom:12 }}>{message.text}</div>}

      {/* Empty state for this month */}
      {displayRows.length === 0 && (
        <div style={{
          padding:'32px 24px', textAlign:'center', color:'var(--text-3)',
          background:'var(--surface-2)', borderRadius:'var(--radius)',
          border:'1px dashed var(--border)', marginBottom:14,
        }}>
          <div style={{ fontSize:'1.5rem', marginBottom:8 }}>🛒</div>
          <p style={{ fontWeight:600, color:'var(--text-2)', marginBottom:4 }}>No items for {selectedMonth} {selectedYear}</p>
          <p className="small">Add items below, or paste a saved template to get started.</p>
        </div>
      )}

      {/* ─── SPLIT LAYOUT ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: panelCollapsed ? '1fr 48px' : '1fr 360px',
        gap: 12,
        transition: 'grid-template-columns 0.32s cubic-bezier(0.4,0,0.2,1)',
        alignItems: 'start',
      }}>

        {/* LEFT: Table */}
        {displayRows.length > 0 && (
          <div className="card" style={{ padding:0, overflow:'hidden', minWidth: 0 }}>
            <div className="table-wrap" style={{ maxHeight: 560, borderRadius: 'var(--radius)', border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width:160 }}>Category</th>
                    <th>Item</th>
                    <th style={{ textAlign:'right',width:110 }}>Goal (XCD)</th>
                    <th style={{ textAlign:'right',width:110 }}>Actual (XCD)</th>
                    <th style={{ textAlign:'right',width:90 }}>Variance</th>
                    <th style={{ width:96 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(grouped.entries()).map(([cat, catRows]) => {
                    if (!catRows.length) return null;
                    const catGoal = catRows.reduce((s,r)=>s+num(r.goal_amount),0);
                    const catActual = catRows.reduce((s,r)=>s+num(r.actual_amount),0);
                    const catVar = catGoal - catActual;
                    const accent = CATEGORY_ACCENTS[cat]||'#00d4aa';
                    return [
                      ...catRows.map((row) => {
                        const isEditing = editingId===row.id;
                        const variance = num(row.goal_amount)-num(row.actual_amount);
                        return (
                          <tr key={row.id}>
                            <td><span className="badge" style={{ background:`${accent}18`,color:accent,fontSize:'0.7rem' }}>{cat}</span></td>
                            <td style={{ fontWeight:500,color:'var(--text)' }}>
                              {isEditing
                                ? <input type="text" value={String(draft.item??'')} onChange={(e)=>setDraft((p)=>({...p,item:e.target.value}))} style={{ minWidth:120 }} />
                                : row.item}
                            </td>
                            <td style={{ textAlign:'right' }}>
                              {isEditing
                                ? <input type="number" value={String(draft.goal_amount??0)} onChange={(e)=>setDraft((p)=>({...p,goal_amount:Number(e.target.value)}))} style={{ minWidth:70,textAlign:'right' }} />
                                : num(row.goal_amount)>0?num(row.goal_amount).toFixed(0):<span style={{ color:'var(--text-3)' }}>—</span>}
                            </td>
                            <td style={{ textAlign:'right' }}>
                              {isEditing
                                ? <input type="number" value={String(draft.actual_amount??0)} onChange={(e)=>setDraft((p)=>({...p,actual_amount:Number(e.target.value)}))} style={{ minWidth:70,textAlign:'right' }} />
                                : num(row.actual_amount)>0?num(row.actual_amount).toFixed(0):<span style={{ color:'var(--text-3)' }}>—</span>}
                            </td>
                            <td style={{ textAlign:'right',color:variance>=0?'#4ade80':'#ef4444',fontFamily:'monospace',fontSize:'0.82rem' }}>
                              {num(row.goal_amount)||num(row.actual_amount)?(variance>=0?'+':'')+variance.toFixed(0):<span style={{ color:'var(--text-3)' }}>—</span>}
                            </td>
                            <td>
                              <div className="td-actions">
                                {isEditing
                                  ? <><button className="btn-save" onClick={saveEdit} disabled={saving}>{saving?'…':'Save'}</button><button className="btn-cancel" onClick={()=>{setEditingId(null);setDraft({});}}>✕</button></>
                                  : <><button className="btn-edit" onClick={()=>{setEditingId(row.id??null);setDraft({...row});}}>Edit</button><button className="btn-danger" onClick={()=>deleteRow(row.id)}>✕</button></>
                                }
                              </div>
                            </td>
                          </tr>
                        );
                      }),
                      <tr key={`sub-${cat}`} style={{ background:'var(--surface-2)' }}>
                        <td colSpan={2} style={{ fontWeight:700,fontSize:'0.75rem',textTransform:'uppercase',letterSpacing:'0.06em',color:accent }}>{cat} Subtotal</td>
                        <td style={{ textAlign:'right',fontWeight:700,fontFamily:'monospace',color:'var(--text)',fontSize:'0.82rem' }}>{catGoal>0?catGoal.toFixed(0):'—'}</td>
                        <td style={{ textAlign:'right',fontWeight:700,fontFamily:'monospace',color:'var(--text)',fontSize:'0.82rem' }}>{catActual>0?catActual.toFixed(0):'—'}</td>
                        <td style={{ textAlign:'right',fontWeight:700,fontFamily:'monospace',color:catVar>=0?'#4ade80':'#ef4444',fontSize:'0.82rem' }}>{catGoal||catActual?(catVar>=0?'+':'')+catVar.toFixed(0):'—'}</td>
                        <td />
                      </tr>,
                    ];
                  })}
                  {/* Grand total row */}
                  <tr style={{ background:'var(--surface-3)',borderTop:'2px solid var(--border-strong)' }}>
                    <td colSpan={2} style={{ fontWeight:800,fontSize:'0.86rem',textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text)' }}>TOTAL</td>
                    <td style={{ textAlign:'right',fontWeight:800,fontFamily:'monospace',fontSize:'0.92rem',color:'#4ade80' }}>{grandGoal.toFixed(0)}</td>
                    <td style={{ textAlign:'right',fontWeight:800,fontFamily:'monospace',fontSize:'0.92rem',color:grandActual>grandGoal?'#ef4444':'var(--text)' }}>{grandActual.toFixed(0)}</td>
                    <td style={{ textAlign:'right',fontWeight:800,fontFamily:'monospace',fontSize:'0.92rem',color:grandVariance>=0?'#4ade80':'#ef4444' }}>{(grandVariance>=0?'+':'')+grandVariance.toFixed(0)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* If no rows, left column still takes space so panel sits right */}
        {displayRows.length === 0 && <div />}

        {/* RIGHT: Add Item Panel + collapse toggle */}
        <div style={{ display:'flex', flexDirection:'column', gap:8, minWidth:0 }}>

          {/* Collapse toggle button */}
          <button
            onClick={togglePanel}
            title={panelCollapsed ? 'Expand add panel' : 'Collapse add panel'}
            style={{
              alignSelf: panelCollapsed ? 'center' : 'flex-end',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text-2)', cursor: 'pointer',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              transition: 'all 0.2s', flexShrink: 0,
            }}
          >
            {panelCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          {/* Panel content */}
          <div style={{
            overflow: 'hidden',
            maxHeight: panelCollapsed ? 0 : '900px',
            opacity: panelCollapsed ? 0 : 1,
            transition: 'max-height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease',
            pointerEvents: panelCollapsed ? 'none' : undefined,
          }}>
            <div className="card" style={{ padding: '18px 16px' }}>
              <div className="card-header" style={{ marginBottom: 14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <Plus size={16} color="#4ade80" />
                  <p className="section-title" style={{ fontSize:'0.95rem' }}>Add Item</p>
                </div>
                <span style={{ fontSize:'0.72rem', color:'var(--text-3)', fontWeight:600 }}>{selectedMonth} {selectedYear}</span>
              </div>

              <div className="field" style={{ marginBottom: 10 }}>
                <label>Category</label>
                <select value={form.category} onChange={(e)=>setForm((f)=>({...f,category:e.target.value}))}>
                  {CATEGORY_ORDER.map((c)=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="field" style={{ marginBottom: 10 }}>
                <label>Item Name</label>
                <input
                  type="text"
                  value={form.item}
                  onChange={(e)=>setForm((f)=>({...f,item:e.target.value}))}
                  placeholder="e.g. Chicken Thighs"
                  onKeyDown={(e)=>{ if(e.key==='Enter' && form.item.trim()) saveRow(); }}
                />
              </div>

              <div className="field" style={{ marginBottom: 10 }}>
                <label>Goal Amount (XCD)</label>
                <input type="number" value={form.goal_amount} onChange={(e)=>setForm((f)=>({...f,goal_amount:e.target.value}))} placeholder="0" />
              </div>

              <div className="field" style={{ marginBottom: 10 }}>
                <label>Actual Amount (XCD)</label>
                <input type="number" value={form.actual_amount} onChange={(e)=>setForm((f)=>({...f,actual_amount:e.target.value}))} placeholder="0" />
              </div>

              <div className="field" style={{ marginBottom: 16 }}>
                <label>Notes</label>
                <input type="text" value={form.notes} onChange={(e)=>setForm((f)=>({...f,notes:e.target.value}))} placeholder="Optional" />
              </div>

              {form.category && (
                <div style={{
                  display:'flex', alignItems:'center', gap:8, marginBottom:14,
                  padding:'8px 10px', borderRadius:8,
                  background:`${CATEGORY_ACCENTS[form.category]||'#00d4aa'}14`,
                  border:`1px solid ${CATEGORY_ACCENTS[form.category]||'#00d4aa'}30`,
                }}>
                  <span style={{ width:8,height:8,borderRadius:'50%',background:CATEGORY_ACCENTS[form.category]||'#00d4aa',flexShrink:0 }} />
                  <span style={{ fontSize:'0.76rem',color:CATEGORY_ACCENTS[form.category]||'#00d4aa',fontWeight:600 }}>{form.category}</span>
                </div>
              )}

              <div style={{ display:'flex', gap:8 }}>
                <button
                  className="btn btn-primary"
                  style={{ background:'#4ade80',borderColor:'#4ade80',color:'#000',flex:1 }}
                  onClick={saveRow}
                  disabled={!form.item.trim()}
                >
                  <Plus size={14} /> Add
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding:'9px 12px' }}
                  onClick={()=>setForm({category:CATEGORY_ORDER[0],item:'',goal_amount:'',actual_amount:'',notes:''})}
                  title="Clear form"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Collapsed pill label */}
          {panelCollapsed && (
            <div
              onClick={togglePanel}
              style={{
                writingMode: 'vertical-rl', textOrientation: 'mixed',
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: '#4ade80', cursor: 'pointer',
                padding: '12px 6px', borderRadius: 8,
                background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                textAlign: 'center', userSelect: 'none',
              }}
            >
              Add Item
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}