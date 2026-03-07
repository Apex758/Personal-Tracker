'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
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

export function GroceryWorkspace({ initialRows }: { initialRows: RecordShape[] }) {
  const [rows, setRows] = useState<GroceryRow[]>(initialRows as GroceryRow[]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<GroceryRow>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle'|'syncing'|'synced'|'error'>('idle');
  const [form, setForm] = useState({ category: CATEGORY_ORDER[0], item: '', goal_amount: '', actual_amount: '', notes: '' });

  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const grandActual = useMemo(() => rows.reduce((s, r) => s + num(r.actual_amount), 0), [rows]);

  // Auto-sync to Finance 1.5s after actual totals change (skip first render)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (!grandActual) return;
    setSyncStatus('syncing');
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const res = await fetch('/api/records/finance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: today, financial_nature: 'Expense', account_type: '',
            category: 'Groceries', payment_method: '', project: '',
            amount: grandActual,
            month: new Date().toLocaleString('default', { month: 'long' }),
            notes: 'Auto-synced from Grocery Budget',
          }),
        });
        setSyncStatus(res.ok ? 'synced' : 'error');
      } catch { setSyncStatus('error'); }
      setTimeout(() => setSyncStatus('idle'), 3000);
    }, 1500);
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  }, [grandActual]);

  function showMsg(text: string, ok: boolean) { setMessage({ text, ok }); setTimeout(() => setMessage(null), 3000); }

  async function refresh() {
    const res = await fetch('/api/records/grocery');
    const data = await res.json();
    setRows((data.rows || []) as GroceryRow[]);
  }

  async function saveRow() {
    const res = await fetch('/api/records/grocery', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: form.category, item: form.item, goal_amount: Number(form.goal_amount)||0, actual_amount: Number(form.actual_amount)||0, notes: form.notes }),
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

  const grouped = useMemo(() => {
    const map = new Map<string, GroceryRow[]>();
    CATEGORY_ORDER.forEach((cat) => map.set(cat, []));
    rows.forEach((r) => { const cat = r.category||'Extra'; if (!map.has(cat)) map.set(cat,[]); map.get(cat)!.push(r); });
    return map;
  }, [rows]);

  const grandGoal = useMemo(() => rows.reduce((s,r) => s+num(r.goal_amount),0), [rows]);
  const grandVariance = grandGoal - grandActual;
  const budgetPct = grandGoal > 0 ? Math.min((grandActual/grandGoal)*100,100) : 0;

  const syncBanner = { idle:null, syncing:{text:'Syncing to Finance…',color:'#f5a623'}, synced:{text:'✓ Finance updated',color:'#4ade80'}, error:{text:'⚠ Sync failed',color:'#ef4444'} }[syncStatus];

  return (
    <div className="page">
      <div className="hero">
        <div className="hero-meta">
          <p className="eyebrow">Module</p>
          <h1 className="page-title" style={{ color:'#4ade80' }}>Grocery Budget</h1>
          <p className="muted small" style={{ maxWidth:440, marginTop:4 }}>Actual totals sync to Finance automatically when you make changes.</p>
        </div>
        {syncBanner && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:99, background:`${syncBanner.color}18`, border:`1px solid ${syncBanner.color}40` }}>
            {syncStatus==='syncing' && <span style={{ width:8,height:8,borderRadius:'50%',background:syncBanner.color,display:'inline-block',animation:'pulse 1s infinite' }} />}
            <span style={{ fontSize:'0.82rem', color:syncBanner.color, fontWeight:600 }}>{syncBanner.text}</span>
          </div>
        )}
      </div>

      <div className="stat-grid" style={{ marginBottom:14 }}>
        <div className="stat-card">
          <div className="stat-accent-bar" style={{ background:'linear-gradient(90deg,#4ade80,transparent)' }} />
          <div className="stat-label">Budget Goal</div>
          <div className="stat-value" style={{ fontSize:'1.4rem' }}>XCD {grandGoal.toFixed(0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-accent-bar" style={{ background:'linear-gradient(90deg,#f5a623,transparent)' }} />
          <div className="stat-label">Actual Spend</div>
          <div className="stat-value" style={{ fontSize:'1.4rem', color:grandActual>grandGoal?'#ef4444':'#f0f4ff' }}>XCD {grandActual.toFixed(0)}</div>
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

      <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:14 }}>
        <div className="table-wrap" style={{ maxHeight:600 }}>
          <table>
            <thead>
              <tr>
                <th style={{ width:160 }}>Category</th><th>Item</th>
                <th style={{ textAlign:'right',width:120 }}>Goal (XCD)</th>
                <th style={{ textAlign:'right',width:120 }}>Actual (XCD)</th>
                <th style={{ textAlign:'right',width:100 }}>Variance</th>
                <th style={{ width:100 }}>Actions</th>
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
                          {isEditing ? <input type="text" value={String(draft.item??'')} onChange={(e)=>setDraft((p)=>({...p,item:e.target.value}))} style={{ minWidth:140 }} /> : row.item}
                        </td>
                        <td style={{ textAlign:'right' }}>
                          {isEditing ? <input type="number" value={String(draft.goal_amount??0)} onChange={(e)=>setDraft((p)=>({...p,goal_amount:Number(e.target.value)}))} style={{ minWidth:80,textAlign:'right' }} /> : num(row.goal_amount)>0?num(row.goal_amount).toFixed(0):<span style={{ color:'var(--text-3)' }}>—</span>}
                        </td>
                        <td style={{ textAlign:'right' }}>
                          {isEditing ? <input type="number" value={String(draft.actual_amount??0)} onChange={(e)=>setDraft((p)=>({...p,actual_amount:Number(e.target.value)}))} style={{ minWidth:80,textAlign:'right' }} /> : num(row.actual_amount)>0?num(row.actual_amount).toFixed(0):<span style={{ color:'var(--text-3)' }}>—</span>}
                        </td>
                        <td style={{ textAlign:'right',color:variance>=0?'#4ade80':'#ef4444',fontFamily:'monospace',fontSize:'0.82rem' }}>
                          {num(row.goal_amount)||num(row.actual_amount)?(variance>=0?'+':'')+variance.toFixed(0):<span style={{ color:'var(--text-3)' }}>—</span>}
                        </td>
                        <td>
                          <div className="td-actions">
                            {isEditing
                              ? <><button className="btn-save" onClick={saveEdit} disabled={saving}>{saving?'…':'Save'}</button><button className="btn-cancel" onClick={()=>{setEditingId(null);setDraft({});}}>Cancel</button></>
                              : <><button className="btn-edit" onClick={()=>{setEditingId(row.id??null);setDraft({...row});}}>Edit</button><button className="btn-danger" onClick={()=>deleteRow(row.id)}>✕</button></>
                            }
                          </div>
                        </td>
                      </tr>
                    );
                  }),
                  <tr key={`sub-${cat}`} style={{ background:'var(--surface-2)' }}>
                    <td colSpan={2} style={{ fontWeight:700,fontSize:'0.78rem',textTransform:'uppercase',letterSpacing:'0.06em',color:accent }}>{cat} Subtotal</td>
                    <td style={{ textAlign:'right',fontWeight:700,fontFamily:'monospace',color:'var(--text)' }}>{catGoal>0?catGoal.toFixed(0):'—'}</td>
                    <td style={{ textAlign:'right',fontWeight:700,fontFamily:'monospace',color:'var(--text)' }}>{catActual>0?catActual.toFixed(0):'—'}</td>
                    <td style={{ textAlign:'right',fontWeight:700,fontFamily:'monospace',color:catVar>=0?'#4ade80':'#ef4444' }}>{catGoal||catActual?(catVar>=0?'+':'')+catVar.toFixed(0):'—'}</td>
                    <td />
                  </tr>,
                ];
              })}
              <tr style={{ background:'var(--surface-3)',borderTop:'2px solid var(--border-strong)' }}>
                <td colSpan={2} style={{ fontWeight:800,fontSize:'0.88rem',textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text)' }}>TOTAL</td>
                <td style={{ textAlign:'right',fontWeight:800,fontFamily:'monospace',fontSize:'0.95rem',color:'#4ade80' }}>{grandGoal.toFixed(0)}</td>
                <td style={{ textAlign:'right',fontWeight:800,fontFamily:'monospace',fontSize:'0.95rem',color:grandActual>grandGoal?'#ef4444':'var(--text)' }}>{grandActual.toFixed(0)}</td>
                <td style={{ textAlign:'right',fontWeight:800,fontFamily:'monospace',fontSize:'0.95rem',color:grandVariance>=0?'#4ade80':'#ef4444' }}>{(grandVariance>=0?'+':'')+grandVariance.toFixed(0)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><p className="section-title">Add Item</p></div>
        <div className="form-grid">
          <div className="field">
            <label>Category</label>
            <select value={form.category} onChange={(e)=>setForm((f)=>({...f,category:e.target.value}))}>
              {CATEGORY_ORDER.map((c)=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Item Name</label>
            <input type="text" value={form.item} onChange={(e)=>setForm((f)=>({...f,item:e.target.value}))} placeholder="e.g. Chicken Thighs" />
          </div>
          <div className="field">
            <label>Goal Amount (XCD)</label>
            <input type="number" value={form.goal_amount} onChange={(e)=>setForm((f)=>({...f,goal_amount:e.target.value}))} placeholder="0" />
          </div>
          <div className="field">
            <label>Actual Amount (XCD)</label>
            <input type="number" value={form.actual_amount} onChange={(e)=>setForm((f)=>({...f,actual_amount:e.target.value}))} placeholder="0" />
          </div>
          <div className="field span-2">
            <label>Notes</label>
            <input type="text" value={form.notes} onChange={(e)=>setForm((f)=>({...f,notes:e.target.value}))} placeholder="Optional" />
          </div>
        </div>
        <div style={{ display:'flex',gap:10,marginTop:16 }}>
          <button className="btn btn-primary" style={{ background:'#4ade80',borderColor:'#4ade80',color:'#000' }} onClick={saveRow} disabled={!form.item.trim()}>Add Item</button>
          <button className="btn btn-secondary" onClick={()=>setForm({category:CATEGORY_ORDER[0],item:'',goal_amount:'',actual_amount:'',notes:''})}>Clear</button>
        </div>
      </div>
    </div>
  );
}