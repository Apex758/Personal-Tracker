'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, X, Dumbbell, TrendingUp, Calendar, User, Trash2, Activity, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import type { RecordShape } from '@/lib/types';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, BarChart, Bar, ComposedChart, Area,
} from 'recharts';
import { GlareHover } from '@/components/GlareHover';

// ─── Types ────────────────────────────────────────────────────────────────────

type GymRow = RecordShape & {
  date: string;
  exercise: string;
  category: string;
  sets: number;
  reps: number;
  weight_kg: number;
  duration_min: number;
  notes: string;
};

type SessionEntry = {
  id: string;
  exercise: string;
  category: string;
  sets: number;
  reps: number;
  weight_kg: number;
  notes: string;
};

type PlanExercise = {
  name: string;
  category: string;
  sets: number;
  reps: string;   // "8" or "6-12"
  weight: string; // "80kg" or "BW" or "RPE 8"
};

type TrainingDay = {
  day: string;    // "Monday", "Day 1", etc.
  focus: string;  // "Push", "Pull", "Full Body", etc.
  exercises: PlanExercise[];
};

type TrainingPlan = {
  id: string;
  name: string;
  duration: string;
  startDate: string;
  days: TrainingDay[];
  notes: string;
};

type BodyStat = {
  date: string;
  weight_kg: number;
  height_cm: number;
  bmi: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = '#f97316';

const DEFAULT_LIBRARY: Record<string, string[]> = {
  Push:     ['Bench Press', 'Incline Bench Press', 'Decline Bench Press', 'Overhead Press', 'Dips', 'Push-ups', 'Tricep Pushdown', 'Tricep Overhead Extension', 'Lateral Raises', 'Chest Flyes', 'Cable Crossover', 'Close Grip Bench'],
  Pull:     ['Pull-ups', 'Chin-ups', 'Barbell Row', 'Dumbbell Row', 'Lat Pulldown', 'Seated Cable Row', 'Face Pulls', 'Bicep Curl', 'Hammer Curl', 'Preacher Curl', 'Cable Curl', 'T-Bar Row'],
  Legs:     ['Squat', 'Front Squat', 'Deadlift', 'Romanian Deadlift', 'Sumo Deadlift', 'Leg Press', 'Lunges', 'Walking Lunges', 'Leg Curl', 'Leg Extension', 'Calf Raises', 'Hip Thrust', 'Bulgarian Split Squat', 'Hack Squat', 'Step-Ups'],
  Core:     ['Plank', 'Side Plank', 'Crunches', 'Leg Raises', 'Russian Twists', 'Ab Wheel', 'Dead Bug', 'Hanging Leg Raise', 'Cable Crunch', 'Pallof Press', 'Hollow Body Hold', 'Dragon Flag'],
  Cardio:   ['Running', 'Cycling', 'Jump Rope', 'Rowing Machine', 'HIIT Sprints', 'Swimming', 'Stair Climber', 'Elliptical', 'Battle Ropes'],
  Mobility: ['Hip Flexor Stretch', 'Hamstring Stretch', 'Shoulder Mobility', 'Thoracic Rotation', 'Ankle Mobility', 'Pigeon Pose', "World's Greatest Stretch", 'Cat-Cow', 'Spiderman Lunge'],
};

const CATEGORIES = Object.keys(DEFAULT_LIBRARY);
const PLAN_DURATIONS = ['Weekly', 'Monthly', '3-Month', '6-Month', 'Yearly'];
const TIME_RANGES = ['1W', '1M', '3M', '6M', '1Y', 'ALL'] as const;
type TimeRange = typeof TIME_RANGES[number];

const STORAGE = {
  library: 'gym_library_v2',
  plans:   'gym_plans_v2',
  body:    'gym_body_v2',
};

// ─── Utils ────────────────────────────────────────────────────────────────────

function calc1RM(weight: number, reps: number): number {
  if (!weight || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

function calcBMI(w: number, h: number): number {
  if (!w || !h) return 0;
  const hm = h / 100;
  return Math.round((w / (hm * hm)) * 10) / 10;
}

function bmiInfo(b: number): { label: string; color: string } {
  if (b < 18.5) return { label: 'Underweight', color: '#38bdf8' };
  if (b < 25)   return { label: 'Normal weight', color: '#4ade80' };
  if (b < 30)   return { label: 'Overweight',    color: '#f5a623' };
  return         { label: 'Obese',               color: '#ef4444' };
}

function filterRange(rows: GymRow[], range: TimeRange): GymRow[] {
  if (range === 'ALL') return rows;
  const days: Record<string, number> = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
  const cutoff = new Date(Date.now() - (days[range] ?? 30) * 86400000);
  return rows.filter((r) => {
    const d = new Date(String(r.date));
    return !isNaN(d.getTime()) && d >= cutoff;
  });
}

function fmtDate(str: string) {
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const TIP_STYLE = {
  contentStyle: { background: '#141820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12, color: '#f0f4ff' },
  itemStyle: { color: '#8892a4' },
  labelStyle: { color: '#f0f4ff', fontWeight: 700 },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
};

// ─── LOG TAB ──────────────────────────────────────────────────────────────────

function LogTab({ library, onSaved }: { library: Record<string, string[]>; onSaved: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [session, setSession] = useState<SessionEntry[]>([]);
  const [form, setForm]       = useState({ category: CATEGORIES[0], exercise: '', sets: 3, reps: 8, weight_kg: 0, notes: '' });
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<{ text: string; ok: boolean } | null>(null);

  // keep exercise in sync when category changes
  useEffect(() => {
    const list = library[form.category] ?? [];
    setForm((f) => ({ ...f, exercise: list[0] ?? '' }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.category]);

  const exerciseList = library[form.category] ?? [];
  const estimated1RM = calc1RM(form.weight_kg, form.reps);

  function addToSession() {
    if (!form.exercise) return;
    setSession((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, ...form }]);
  }

  async function saveSession() {
    if (!session.length) return;
    setSaving(true);
    let saved = 0;
    for (const entry of session) {
      const res = await fetch('/api/records/gym', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          exercise: entry.exercise,
          category: entry.category,
          sets: entry.sets,
          reps: entry.reps,
          weight_kg: entry.weight_kg,
          duration_min: null,
          notes: entry.notes,
        }),
      });
      if (res.ok) saved++;
    }
    setSaving(false);
    setSession([]);
    setMsg({ text: `${saved}/${session.length} exercises saved ✓`, ok: saved > 0 });
    setTimeout(() => setMsg(null), 4000);
    onSaved();
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <p className="eyebrow">Session — {today}</p>
            <p className="section-title">Log Workout</p>
          </div>
          {msg && <span className={`msg ${msg.ok ? 'msg-ok' : 'msg-err'}`}>{msg.text}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginBottom: 12 }}>
          <div className="field">
            <label>Category</label>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Exercise</label>
            <select value={form.exercise} onChange={(e) => setForm((f) => ({ ...f, exercise: e.target.value }))}>
              {exerciseList.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: 10, marginBottom: 14 }}>
          <div className="field">
            <label>Sets</label>
            <input type="number" min={1} value={form.sets} onChange={(e) => setForm((f) => ({ ...f, sets: Number(e.target.value) }))} />
          </div>
          <div className="field">
            <label>Reps</label>
            <input type="number" min={1} value={form.reps} onChange={(e) => setForm((f) => ({ ...f, reps: Number(e.target.value) }))} />
          </div>
          <div className="field">
            <label>Weight (kg)</label>
            <input type="number" min={0} step={0.5} value={form.weight_kg} onChange={(e) => setForm((f) => ({ ...f, weight_kg: Number(e.target.value) }))} />
          </div>
          <div className="field">
            <label>Notes</label>
            <input type="text" value={form.notes} placeholder="Optional" onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>

        {estimated1RM > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '6px 14px', borderRadius: 99, background: `rgba(249,115,22,0.12)`, border: '1px solid rgba(249,115,22,0.3)' }}>
            <TrendingUp size={13} style={{ color: ACCENT }} />
            <span style={{ fontSize: '0.78rem', color: ACCENT, fontWeight: 600 }}>
              Est. 1RM: <strong>{estimated1RM} kg</strong> <span style={{ fontWeight: 400, opacity: 0.7 }}>(Epley formula)</span>
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ background: ACCENT, borderColor: ACCENT, color: '#fff' }} onClick={addToSession} disabled={!form.exercise}>
            <Plus size={14} /> Add to Session
          </button>
          {session.length > 0 && (
            <button className="btn btn-primary" style={{ background: '#4ade80', borderColor: '#4ade80', color: '#000' }} onClick={saveSession} disabled={saving}>
              {saving ? 'Saving…' : `Save Session (${session.length} exercise${session.length !== 1 ? 's' : ''})`}
            </button>
          )}
          {session.length > 0 && (
            <button className="btn btn-secondary" onClick={() => setSession([])}><X size={14} /> Clear</button>
          )}
        </div>
      </div>

      {/* Session list */}
      {session.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Dumbbell size={15} style={{ color: ACCENT }} />
            <p className="section-title" style={{ fontSize: '0.88rem' }}>Today's Session — {session.length} exercise{session.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table>
              <thead>
                <tr>
                  {['Exercise', 'Category', 'Sets', 'Reps', 'Weight', 'Est. 1RM', 'Notes', ''].map((h) => (
                    <th key={h} style={{ background: 'var(--surface-2)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {session.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{e.exercise}</td>
                    <td><span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 99, background: 'rgba(249,115,22,0.1)', color: ACCENT }}>{e.category}</span></td>
                    <td style={{ textAlign: 'center' }}>{e.sets}</td>
                    <td style={{ textAlign: 'center' }}>{e.reps}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{e.weight_kg}kg</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: ACCENT, fontWeight: 700 }}>
                      {calc1RM(e.weight_kg, e.reps) > 0 ? `${calc1RM(e.weight_kg, e.reps)}kg` : '—'}
                    </td>
                    <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.notes || '—'}</td>
                    <td><button className="btn-danger" onClick={() => setSession((s) => s.filter((x) => x.id !== e.id))}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PROGRESS TAB ─────────────────────────────────────────────────────────────

function ProgressTab({ rows }: { rows: GymRow[] }) {
  const allExercises = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => { if (r.exercise) set.add(String(r.exercise)); });
    return Array.from(set).sort();
  }, [rows]);

  const [selectedEx, setSelectedEx]   = useState(allExercises[0] ?? '');
  const [range, setRange]             = useState<TimeRange>('3M');

  const chartData = useMemo(() => {
    if (!selectedEx) return [];
    const filtered = filterRange(rows.filter((r) => String(r.exercise) === selectedEx), range);
    const grouped = new Map<string, GymRow[]>();
    filtered.forEach((r) => {
      const d = String(r.date).slice(0, 10);
      if (!grouped.has(d)) grouped.set(d, []);
      grouped.get(d)!.push(r);
    });
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dayRows]) => {
        const maxWeight = Math.max(...dayRows.map((r) => Number(r.weight_kg) || 0));
        const maxReps   = dayRows.find((r) => Number(r.weight_kg) === maxWeight)?.reps ?? 1;
        const est1RM    = calc1RM(maxWeight, Number(maxReps));
        const volume    = dayRows.reduce((s, r) => s + (Number(r.sets) || 0) * (Number(r.reps) || 0) * (Number(r.weight_kg) || 0), 0);
        return { date: fmtDate(date), maxWeight, est1RM, volume: Math.round(volume) };
      });
  }, [rows, selectedEx, range]);

  if (allExercises.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-3)' }}>
        <TrendingUp size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
        <p style={{ fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>No workout data yet</p>
        <p className="small">Log your first session to see progressive overload charts.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Controls */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 220 }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)' }}>Exercise</label>
            <select
              value={selectedEx}
              onChange={(e) => setSelectedEx(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.875rem' }}
            >
              {allExercises.map((ex) => <option key={ex} value={ex}>{ex}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)' }}>Time Range</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {TIME_RANGES.map((r) => (
                <button key={r} onClick={() => setRange(r)} style={{
                  padding: '6px 12px', borderRadius: 7,
                  border: `1px solid ${range === r ? ACCENT : 'var(--border)'}`,
                  background: range === r ? `rgba(249,115,22,0.12)` : 'var(--surface-2)',
                  color: range === r ? ACCENT : 'var(--text-3)',
                  fontSize: '0.78rem', fontWeight: range === r ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s',
                }}>{r}</button>
              ))}
            </div>
          </div>
          {chartData.length > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 20 }}>
              {[
                { label: 'Max Weight', value: `${Math.max(...chartData.map((d) => d.maxWeight))} kg` },
                { label: 'Best 1RM',   value: `${Math.max(...chartData.map((d) => d.est1RM))} kg` },
                { label: 'Sessions',   value: chartData.length },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', color: ACCENT }}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
          No data for <strong style={{ color: 'var(--text)' }}>{selectedEx}</strong> in the selected range.
        </div>
      ) : (
        <>
          {/* Max Weight + 1RM chart */}
          <div className="grid grid-2">
            <div className="card">
              <p className="section-title" style={{ marginBottom: 12 }}>Max Weight per Session</p>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4d5668' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#4d5668' }} axisLine={false} tickLine={false} unit="kg" />
                    <Tooltip {...TIP_STYLE} formatter={(v: number) => [`${v} kg`, 'Weight']} />
                    <Line type="monotone" dataKey="maxWeight" name="Max Weight" stroke={ACCENT} strokeWidth={2.5} dot={{ fill: ACCENT, r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: ACCENT, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <p className="section-title" style={{ marginBottom: 12 }}>Estimated 1RM (Epley)</p>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4d5668' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#4d5668' }} axisLine={false} tickLine={false} unit="kg" />
                    <Tooltip {...TIP_STYLE} formatter={(v: number) => [`${v} kg`, 'Est. 1RM']} />
                    <defs>
                      <linearGradient id="orm-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c6ef7" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7c6ef7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="est1RM" name="Est. 1RM" stroke="#7c6ef7" strokeWidth={2.5} fill="url(#orm-grad)" dot={{ fill: '#7c6ef7', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#7c6ef7', strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Volume chart */}
          <div className="card">
            <p className="section-title" style={{ marginBottom: 4 }}>Training Volume (sets × reps × weight)</p>
            <p className="muted small" style={{ marginBottom: 12 }}>Total tonnage lifted per session — the primary driver of hypertrophy.</p>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4d5668' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#4d5668' }} axisLine={false} tickLine={false} />
                  <Tooltip {...TIP_STYLE} formatter={(v: number) => [`${v.toLocaleString()} kg`, 'Volume']} />
                  <Bar dataKey="volume" name="Volume" fill="#00d4aa" fillOpacity={0.8} radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── PLANS TAB ────────────────────────────────────────────────────────────────

function PlansTab({ library }: { library: Record<string, string[]> }) {
  const [plans, setPlans]         = useState<TrainingPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [creating, setCreating]   = useState(false);
  const [viewing, setViewing]     = useState<string | null>(null);

  const [draft, setDraft] = useState<Omit<TrainingPlan, 'id'>>({
    name: '', duration: 'Weekly', startDate: new Date().toISOString().slice(0, 10),
    days: [{ day: 'Monday', focus: 'Push', exercises: [] }], notes: '',
  });

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE.plans);
      if (s) setPlans(JSON.parse(s));
      const a = localStorage.getItem('gym_active_plan');
      if (a) setActivePlanId(a);
    } catch {}
  }, []);

  function save(updated: TrainingPlan[]) {
    setPlans(updated);
    try { localStorage.setItem(STORAGE.plans, JSON.stringify(updated)); } catch {}
  }

  function savePlan() {
    if (!draft.name.trim()) return;
    const newPlan: TrainingPlan = { ...draft, id: `plan-${Date.now()}` };
    save([...plans, newPlan]);
    setCreating(false);
    setDraft({ name: '', duration: 'Weekly', startDate: new Date().toISOString().slice(0, 10), days: [{ day: 'Monday', focus: 'Push', exercises: [] }], notes: '' });
  }

  function deletePlan(id: string) {
    save(plans.filter((p) => p.id !== id));
    if (activePlanId === id) {
      setActivePlanId(null);
      try { localStorage.removeItem('gym_active_plan'); } catch {}
    }
    if (viewing === id) setViewing(null);
  }

  function setActive(id: string) {
    const next = activePlanId === id ? null : id;
    setActivePlanId(next);
    try { if (next) localStorage.setItem('gym_active_plan', next); else localStorage.removeItem('gym_active_plan'); } catch {}
  }

  function addDay() {
    setDraft((d) => ({ ...d, days: [...d.days, { day: `Day ${d.days.length + 1}`, focus: 'Push', exercises: [] }] }));
  }

  function removeDay(i: number) {
    setDraft((d) => ({ ...d, days: d.days.filter((_, idx) => idx !== i) }));
  }

  function addExercise(dayIdx: number) {
    const allEx = Object.values(library).flat();
    const ex = allEx[0] ?? '';
    const cat = Object.keys(library).find((k) => library[k].includes(ex)) ?? '';
    setDraft((d) => {
      const days = [...d.days];
      days[dayIdx] = { ...days[dayIdx], exercises: [...days[dayIdx].exercises, { name: ex, category: cat, sets: 3, reps: '8', weight: 'BW' }] };
      return { ...d, days };
    });
  }

  function removeExercise(dayIdx: number, exIdx: number) {
    setDraft((d) => {
      const days = [...d.days];
      days[dayIdx] = { ...days[dayIdx], exercises: days[dayIdx].exercises.filter((_, i) => i !== exIdx) };
      return { ...d, days };
    });
  }

  function updateExercise(dayIdx: number, exIdx: number, key: keyof PlanExercise, value: string | number) {
    setDraft((d) => {
      const days = [...d.days];
      const exs = [...days[dayIdx].exercises];
      exs[exIdx] = { ...exs[exIdx], [key]: value };
      days[dayIdx] = { ...days[dayIdx], exercises: exs };
      return { ...d, days };
    });
  }

  const viewedPlan = plans.find((p) => p.id === viewing) ?? null;

  if (creating) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <p className="section-title">Create Training Plan</p>
            <button className="btn btn-secondary" onClick={() => setCreating(false)}><X size={14} /> Cancel</button>
          </div>
          <div className="form-grid" style={{ gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="field"><label>Plan Name</label><input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Push Pull Legs" /></div>
            <div className="field"><label>Duration</label>
              <select value={draft.duration} onChange={(e) => setDraft((d) => ({ ...d, duration: e.target.value }))}>
                {PLAN_DURATIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="field"><label>Start Date</label><input type="date" value={draft.startDate} onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))} /></div>
          </div>
          <div className="field" style={{ marginBottom: 18 }}><label>Notes</label><input value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} placeholder="Goals, context…" /></div>

          {/* Training days */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {draft.days.map((day, di) => (
              <div key={di} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input value={day.day} onChange={(e) => setDraft((d) => { const days = [...d.days]; days[di] = { ...days[di], day: e.target.value }; return { ...d, days }; })} style={{ padding: '4px 8px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '0.85rem', width: 110 }} />
                  <input value={day.focus} onChange={(e) => setDraft((d) => { const days = [...d.days]; days[di] = { ...days[di], focus: e.target.value }; return { ...d, days }; })} placeholder="Focus (e.g. Push)" style={{ padding: '4px 8px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '0.85rem', width: 120 }} />
                  <button onClick={() => addExercise(di)} style={{ marginLeft: 'auto', background: ACCENT, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={11} /> Exercise</button>
                  {draft.days.length > 1 && <button onClick={() => removeDay(di)} className="btn-danger" style={{ padding: '3px 7px' }}>✕</button>}
                </div>
                {day.exercises.length > 0 && (
                  <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {day.exercises.map((ex, ei) => (
                      <div key={ei} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <select value={ex.name} onChange={(e) => { const name = e.target.value; const cat = Object.keys(library).find((k) => library[k].includes(name)) ?? ''; updateExercise(di, ei, 'name', name); updateExercise(di, ei, 'category', cat); }} style={{ flex: '2 1 160px', padding: '5px 8px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '0.82rem' }}>
                          {CATEGORIES.map((cat) => <optgroup key={cat} label={cat}>{(library[cat] ?? []).map((e) => <option key={e} value={e}>{e}</option>)}</optgroup>)}
                        </select>
                        <input type="number" value={ex.sets} onChange={(e) => updateExercise(di, ei, 'sets', Number(e.target.value))} min={1} placeholder="Sets" style={{ width: 56, padding: '5px 8px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '0.82rem' }} />
                        <input value={ex.reps} onChange={(e) => updateExercise(di, ei, 'reps', e.target.value)} placeholder="Reps" style={{ width: 70, padding: '5px 8px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '0.82rem' }} />
                        <input value={ex.weight} onChange={(e) => updateExercise(di, ei, 'weight', e.target.value)} placeholder="Weight" style={{ width: 80, padding: '5px 8px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '0.82rem' }} />
                        <button onClick={() => removeExercise(di, ei)} className="btn-danger" style={{ padding: '3px 7px', fontSize: '0.7rem' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn btn-secondary" onClick={addDay}><Plus size={14} /> Add Day</button>
            <button className="btn btn-primary" style={{ background: ACCENT, borderColor: ACCENT, color: '#fff', marginLeft: 'auto' }} onClick={savePlan} disabled={!draft.name.trim()}>Save Plan</button>
          </div>
        </div>
      </div>
    );
  }

  if (viewedPlan) {
    const endDate = (() => {
      const d = new Date(viewedPlan.startDate);
      const weeks = { 'Weekly': 1, 'Monthly': 4, '3-Month': 13, '6-Month': 26, 'Yearly': 52 }[viewedPlan.duration] ?? 4;
      d.setDate(d.getDate() + weeks * 7);
      return d.toISOString().slice(0, 10);
    })();

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <button className="btn btn-secondary" onClick={() => setViewing(null)}>← Back</button>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: ACCENT }}>{viewedPlan.name}</h2>
            <span style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(249,115,22,0.12)', color: ACCENT, fontSize: '0.75rem', fontWeight: 700 }}>{viewedPlan.duration}</span>
            {activePlanId === viewedPlan.id && <span style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(74,222,128,0.12)', color: '#4ade80', fontSize: '0.75rem', fontWeight: 700 }}>Active</span>}
          </div>
          <p className="muted small">{viewedPlan.startDate} → {endDate} · {viewedPlan.days.length} training day{viewedPlan.days.length !== 1 ? 's' : ''}{viewedPlan.notes && ` · ${viewedPlan.notes}`}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {viewedPlan.days.map((day, i) => (
            <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>{day.day}</div>
                  <div style={{ fontSize: '0.72rem', color: ACCENT, fontWeight: 600 }}>{day.focus}</div>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}</span>
              </div>
              {day.exercises.length > 0 ? (
                <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {day.exercises.map((ex, ei) => (
                    <div key={ei} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{ex.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{ex.category}</div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-2)' }}>
                        <div>{ex.sets}×{ex.reps}</div>
                        <div style={{ color: ACCENT }}>{ex.weight}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.8rem' }}>Rest day</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p className="eyebrow">Training Plans</p>
          <p className="section-title">Weekly, Monthly &amp; Long-Term</p>
        </div>
        <button className="btn btn-primary" style={{ background: ACCENT, borderColor: ACCENT, color: '#fff' }} onClick={() => setCreating(true)}>
          <Plus size={14} /> New Plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-3)' }}>
          <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>No plans yet</p>
          <p className="small">Create a training plan to structure your workouts over time.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {plans.map((plan) => (
            <div key={plan.id} className="card" style={{ cursor: 'pointer', transition: 'border-color 0.15s', borderColor: activePlanId === plan.id ? '#4ade80' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(249,115,22,0.1)', color: ACCENT, fontSize: '0.7rem', fontWeight: 700 }}>{plan.duration}</span>
                    {activePlanId === plan.id && <span style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(74,222,128,0.12)', color: '#4ade80', fontSize: '0.7rem', fontWeight: 700 }}>Active</span>}
                  </div>
                </div>
                <button onClick={() => deletePlan(plan.id)} className="btn-danger" style={{ padding: '4px 7px', fontSize: '0.75rem' }}>✕</button>
              </div>
              <p className="muted small" style={{ marginBottom: 10 }}>
                {plan.days.length} day{plan.days.length !== 1 ? 's' : ''} · starts {plan.startDate}
                {plan.notes && <><br />{plan.notes}</>}
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.78rem', padding: '6px' }} onClick={() => setViewing(plan.id)}>View Plan</button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '0.78rem', padding: '6px', borderColor: activePlanId === plan.id ? '#4ade80' : undefined, color: activePlanId === plan.id ? '#4ade80' : undefined }}
                  onClick={() => setActive(plan.id)}
                >
                  {activePlanId === plan.id ? 'Deactivate' : 'Set Active'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── LIBRARY TAB ──────────────────────────────────────────────────────────────

function LibraryTab({ library, setLibrary }: { library: Record<string, string[]>; setLibrary: (l: Record<string, string[]>) => void }) {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [newExercise, setNewExercise]       = useState('');
  const [newCategory, setNewCategory]       = useState('');
  const [addingCat, setAddingCat]           = useState(false);

  const allCategories = useMemo(() => {
    const base = [...CATEGORIES];
    Object.keys(library).forEach((k) => { if (!base.includes(k)) base.push(k); });
    return base;
  }, [library]);

  function addExercise() {
    const trimmed = newExercise.trim();
    if (!trimmed) return;
    const current = library[activeCategory] ?? [];
    if (current.includes(trimmed)) { setNewExercise(''); return; }
    const updated = { ...library, [activeCategory]: [...current, trimmed] };
    setLibrary(updated);
    try { localStorage.setItem(STORAGE.library, JSON.stringify(updated)); } catch {}
    setNewExercise('');
  }

  function removeExercise(cat: string, ex: string) {
    const updated = { ...library, [cat]: (library[cat] ?? []).filter((e) => e !== ex) };
    setLibrary(updated);
    try { localStorage.setItem(STORAGE.library, JSON.stringify(updated)); } catch {}
  }

  function addCategory() {
    const trimmed = newCategory.trim();
    if (!trimmed || library[trimmed]) return;
    const updated = { ...library, [trimmed]: [] };
    setLibrary(updated);
    try { localStorage.setItem(STORAGE.library, JSON.stringify(updated)); } catch {}
    setActiveCategory(trimmed);
    setNewCategory('');
    setAddingCat(false);
  }

  function resetToDefaults() {
    setLibrary({ ...DEFAULT_LIBRARY });
    try { localStorage.removeItem(STORAGE.library); } catch {}
  }

  const exercises = library[activeCategory] ?? [];
  const totalExercises = Object.values(library).flat().length;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: 480 }}>
      <div style={{ display: 'flex', height: '100%' }}>
        {/* Category sidebar */}
        <div style={{ width: 180, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: ACCENT, marginBottom: 2 }}>Exercise Library</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{totalExercises} exercises</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {allCategories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                background: activeCategory === cat ? `rgba(249,115,22,0.12)` : 'transparent',
                color: activeCategory === cat ? ACCENT : 'var(--text-2)',
                fontWeight: activeCategory === cat ? 700 : 400, fontSize: '0.84rem',
                marginBottom: 2, transition: 'all 0.15s',
              }}>
                {cat}
                <span style={{ float: 'right', fontSize: '0.72rem', color: activeCategory === cat ? ACCENT : 'var(--text-3)', opacity: 0.7 }}>
                  {(library[cat] ?? []).length}
                </span>
              </button>
            ))}
          </div>
          <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
            {addingCat ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <input autoFocus value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addCategory(); if (e.key === 'Escape') setAddingCat(false); }} placeholder="Category name" style={{ padding: '5px 8px', background: 'var(--surface-3)', border: `1px solid ${ACCENT}`, borderRadius: 6, color: 'var(--text)', fontSize: '0.78rem', outline: 'none', width: '100%' }} />
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={addCategory} style={{ flex: 1, background: ACCENT, border: 'none', color: '#fff', borderRadius: 5, padding: '4px', fontSize: '0.72rem', cursor: 'pointer' }}>Add</button>
                  <button onClick={() => setAddingCat(false)} style={{ flex: 1, background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-3)', borderRadius: 5, padding: '4px', fontSize: '0.72rem', cursor: 'pointer' }}>✕</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingCat(true)} style={{ width: '100%', background: 'none', border: '1px dashed var(--border)', color: 'var(--text-3)', borderRadius: 6, padding: '5px', fontSize: '0.72rem', cursor: 'pointer' }}>+ Category</button>
            )}
          </div>
        </div>

        {/* Exercise list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{activeCategory}</div>
            <button onClick={resetToDefaults} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-3)', borderRadius: 6, padding: '4px 10px', fontSize: '0.72rem', cursor: 'pointer' }}>Reset to defaults</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {exercises.map((ex) => (
                <div key={ex} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 99,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  fontSize: '0.82rem', color: 'var(--text-2)',
                }}>
                  {ex}
                  <button onClick={() => removeExercise(activeCategory, ex)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 0, fontSize: '0.65rem', lineHeight: 1 }}>✕</button>
                </div>
              ))}
              {exercises.length === 0 && (
                <div style={{ color: 'var(--text-3)', fontSize: '0.82rem', fontStyle: 'italic' }}>No exercises in {activeCategory} — add one below ↓</div>
              )}
            </div>
          </div>
          <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={newExercise}
              onChange={(e) => setNewExercise(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addExercise(); }}
              placeholder={`Add exercise to ${activeCategory}…`}
              style={{ flex: 1, padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: '0.875rem', outline: 'none' }}
              onFocus={(e) => (e.target.style.borderColor = ACCENT)}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
            <button
              onClick={addExercise}
              disabled={!newExercise.trim()}
              style={{ background: newExercise.trim() ? ACCENT : 'var(--surface-3)', color: newExercise.trim() ? '#fff' : 'var(--text-3)', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: '0.875rem', fontWeight: 600, cursor: newExercise.trim() ? 'pointer' : 'default', transition: 'all 0.15s' }}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BODY TAB ─────────────────────────────────────────────────────────────────

function BodyTab() {
  const [history, setHistory] = useState<BodyStat[]>([]);
  const [weight, setWeight]   = useState('');
  const [height, setHeight]   = useState('');
  const [msg, setMsg]         = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE.body);
      if (s) {
        const data: BodyStat[] = JSON.parse(s);
        setHistory(data);
        if (data.length > 0) {
          const last = data[data.length - 1];
          setHeight(String(last.height_cm));
        }
      }
    } catch {}
  }, []);

  const latest = history[history.length - 1] ?? null;
  const currentBMI = weight && height ? calcBMI(Number(weight), Number(height)) : (latest?.bmi ?? 0);
  const bmiData = bmiInfo(currentBMI);

  function logStat() {
    const w = Number(weight);
    const h = Number(height);
    if (!w || !h) return;
    const b = calcBMI(w, h);
    const entry: BodyStat = { date: new Date().toISOString().slice(0, 10), weight_kg: w, height_cm: h, bmi: b };
    const updated = [...history, entry];
    setHistory(updated);
    try { localStorage.setItem(STORAGE.body, JSON.stringify(updated)); } catch {}
    setMsg({ text: `Logged ✓ BMI: ${b}`, ok: true });
    setWeight('');
    setTimeout(() => setMsg(null), 3000);
  }

  const weightChartData = history.map((s) => ({ date: fmtDate(s.date), weight: s.weight_kg, bmi: s.bmi }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Input + BMI display */}
      <div className="grid grid-2">
        <div className="card">
          <p className="eyebrow" style={{ marginBottom: 4 }}>Log Body Stats</p>
          <p className="section-title" style={{ marginBottom: 18 }}>Weight &amp; Height</p>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="field">
              <label>Weight (kg)</label>
              <input type="number" min={30} max={300} step={0.1} value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={latest ? String(latest.weight_kg) : '70'} />
            </div>
            <div className="field">
              <label>Height (cm)</label>
              <input type="number" min={100} max={250} step={0.5} value={height} onChange={(e) => setHeight(e.target.value)} placeholder={latest ? String(latest.height_cm) : '175'} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn-primary" style={{ background: ACCENT, borderColor: ACCENT, color: '#fff' }} onClick={logStat} disabled={!weight || !height}>
              Log Stats
            </button>
            {msg && <span className={`msg ${msg.ok ? 'msg-ok' : 'msg-err'}`}>{msg.text}</span>}
          </div>
        </div>

        {/* BMI card */}
        <GlareHover glareColor="#ffffff" glareOpacity={0.18} glareAngle={-30} glareSize={300} transitionDuration={700} className="stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="stat-accent-bar" style={{ background: `linear-gradient(90deg, ${bmiData.color}, transparent)` }} />
          <div className="stat-label" style={{ marginBottom: 8 }}>Body Mass Index</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
            <div style={{ fontFamily: 'monospace', fontSize: '2.8rem', fontWeight: 800, lineHeight: 1, color: bmiData.color }}>
              {currentBMI || '—'}
            </div>
            {currentBMI > 0 && (
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: bmiData.color }}>{bmiData.label}</div>
            )}
          </div>
          <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{
              height: '100%',
              width: currentBMI > 0 ? `${Math.min((currentBMI / 40) * 100, 100)}%` : '0%',
              background: `linear-gradient(90deg, #38bdf8 0%, #4ade80 46%, #f5a623 62%, #ef4444 80%)`,
              borderRadius: 99, transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-3)' }}>
            <span>Under 18.5</span><span>18.5–24.9</span><span>25–29.9</span><span>30+</span>
          </div>
          {latest && (
            <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-3)' }}>
              Last logged: {latest.weight_kg}kg @ {latest.height_cm}cm · {latest.date}
            </div>
          )}
        </GlareHover>
      </div>

      {/* History charts */}
      {weightChartData.length > 1 && (
        <div className="grid grid-2">
          <div className="card">
            <p className="section-title" style={{ marginBottom: 12 }}>Weight History</p>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4d5668' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#4d5668' }} axisLine={false} tickLine={false} unit="kg" />
                  <Tooltip {...TIP_STYLE} formatter={(v: number) => [`${v} kg`, 'Weight']} />
                  <Line type="monotone" dataKey="weight" stroke={ACCENT} strokeWidth={2.5} dot={{ fill: ACCENT, r: 4, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <p className="section-title" style={{ marginBottom: 12 }}>BMI History</p>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4d5668' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#4d5668' }} axisLine={false} tickLine={false} domain={[15, 35]} />
                  <Tooltip {...TIP_STYLE} formatter={(v: number) => [v, 'BMI']} />
                  <Line type="monotone" dataKey="bmi" stroke="#7c6ef7" strokeWidth={2.5} dot={{ fill: '#7c6ef7', r: 4, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* History table */}
      {history.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p className="section-title" style={{ fontSize: '0.88rem' }}>Body Stats History</p>
            <button onClick={() => { setHistory([]); try { localStorage.removeItem(STORAGE.body); } catch {} }} style={{ background: 'none', border: '1px solid var(--border)', color: '#ef4444', borderRadius: 6, padding: '4px 10px', fontSize: '0.72rem', cursor: 'pointer' }}>Clear history</button>
          </div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0, boxShadow: 'none', maxHeight: 260 }}>
            <table>
              <thead>
                <tr>{['Date', 'Weight', 'Height', 'BMI', 'Category'].map((h) => <th key={h} style={{ background: 'var(--surface-2)' }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {[...history].reverse().map((s, i) => {
                  const info = bmiInfo(s.bmi);
                  return (
                    <tr key={i}>
                      <td>{s.date}</td>
                      <td style={{ fontFamily: 'monospace' }}>{s.weight_kg} kg</td>
                      <td style={{ fontFamily: 'monospace' }}>{s.height_cm} cm</td>
                      <td style={{ fontFamily: 'monospace', color: info.color, fontWeight: 700 }}>{s.bmi}</td>
                      <td><span style={{ padding: '2px 8px', borderRadius: 99, background: `${info.color}18`, color: info.color, fontSize: '0.72rem', fontWeight: 600 }}>{info.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN WORKSPACE ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'log',      label: 'Log Workout', icon: Dumbbell },
  { id: 'progress', label: 'Progress',    icon: TrendingUp },
  { id: 'plans',    label: 'Plans',       icon: Calendar },
  { id: 'library',  label: 'Library',     icon: BookOpen },
  { id: 'body',     label: 'Body Stats',  icon: User },
] as const;

type TabId = typeof TABS[number]['id'];

export function GymWorkspace({ initialRows }: { initialRows: RecordShape[] }) {
  const [rows, setRows]       = useState<GymRow[]>(initialRows as GymRow[]);
  const [activeTab, setActiveTab] = useState<TabId>('log');
  const [library, setLibrary] = useState<Record<string, string[]>>({ ...DEFAULT_LIBRARY });

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE.library);
      if (s) {
        const saved = JSON.parse(s);
        // Merge saved with defaults to always have default categories
        const merged: Record<string, string[]> = { ...DEFAULT_LIBRARY };
        Object.keys(saved).forEach((k) => {
          if (merged[k]) {
            // Merge: keep defaults + add saved custom ones
            const combined = [...new Set([...merged[k], ...saved[k]])];
            merged[k] = combined;
          } else {
            merged[k] = saved[k];
          }
        });
        setLibrary(merged);
      }
    } catch {}
  }, []);

  async function refresh() {
    try {
      const res = await fetch('/api/records/gym');
      const data = await res.json();
      setRows((data.rows ?? []) as GymRow[]);
    } catch {}
  }

  // Summary stats
  const totalSessions = useMemo(() => {
    const dates = new Set(rows.map((r) => String(r.date).slice(0, 10)));
    return dates.size;
  }, [rows]);

  const totalVolume = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.sets) || 0) * (Number(r.reps) || 0) * (Number(r.weight_kg) || 0), 0),
    [rows],
  );

  const uniqueExercises = useMemo(() => new Set(rows.map((r) => r.exercise)).size, [rows]);

  const thisWeekSessions = useMemo(() => {
    const cutoff = new Date(Date.now() - 7 * 86400000);
    const dates = new Set(rows.filter((r) => new Date(String(r.date)) >= cutoff).map((r) => String(r.date).slice(0, 10)));
    return dates.size;
  }, [rows]);

  return (
    <div className="page">
      {/* Header */}
      <div className="hero">
        <div className="hero-meta">
          <p className="eyebrow">Module</p>
          <h1 className="page-title" style={{ color: ACCENT }}>Gym &amp; Calisthenics</h1>
          <p className="muted small" style={{ maxWidth: 440, marginTop: 4 }}>
            Track exercises, progressive overload, training plans, and body composition.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid" style={{ marginBottom: 14 }}>
        {[
          { label: 'Total Sessions',  value: totalSessions,    helper: 'All time',          accent: ACCENT },
          { label: 'This Week',       value: thisWeekSessions, helper: 'Sessions logged',    accent: '#f5a623' },
          { label: 'Exercises Logged', value: uniqueExercises, helper: 'Unique movements',   accent: '#7c6ef7' },
          { label: 'Total Volume',    value: `${Math.round(totalVolume / 1000)}t`, helper: 'sets × reps × weight', accent: '#00d4aa' },
        ].map(({ label, value, helper, accent }) => (
          <GlareHover key={label} glareColor="#ffffff" glareOpacity={0.18} glareAngle={-30} glareSize={300} transitionDuration={700} className="stat-card">
            <div className="stat-accent-bar" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ fontSize: '1.6rem' }}>{value}</div>
            <div className="stat-helper">{helper}</div>
          </GlareHover>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 16px',
            border: 'none', borderBottom: `2px solid ${activeTab === id ? ACCENT : 'transparent'}`,
            background: 'transparent',
            color: activeTab === id ? ACCENT : 'var(--text-3)',
            fontSize: '0.86rem', fontWeight: activeTab === id ? 700 : 400,
            cursor: 'pointer', transition: 'all 0.15s', borderRadius: '6px 6px 0 0',
          }}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'log'      && <LogTab library={library} onSaved={refresh} />}
      {activeTab === 'progress' && <ProgressTab rows={rows} />}
      {activeTab === 'plans'    && <PlansTab library={library} />}
      {activeTab === 'library'  && <LibraryTab library={library} setLibrary={setLibrary} />}
      {activeTab === 'body'     && <BodyTab />}
    </div>
  );
}
