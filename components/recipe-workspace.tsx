'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Plus, ChevronDown, ChevronRight, Clock, Users, ChefHat,
  Timer, UtensilsCrossed, Pencil, X, Check, ImagePlus, Link,
  PanelLeftClose, PanelLeftOpen, FlipHorizontal,
} from 'lucide-react';
import type { RecordShape } from '@/lib/types';

type Recipe = RecordShape & {
  id: string;
  name: string;
  category: string;
  image_url: string;
  prep_time: string;
  cook_time: string;
  servings: number;
  ingredients: string;
  instructions: string;
  notes: string;
};

const BLANK_RECIPE = {
  name: '', category: '', image_url: '',
  prep_time: '', cook_time: '', servings: 4,
  ingredients: '', instructions: '', notes: '',
};

const CATEGORY_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Desserts', 'Snacks', 'Drinks', 'Beverages'];

const DEMO_RECIPES: Recipe[] = [
  {
    id: 'demo-1', name: 'Classic Pancakes', category: 'Breakfast',
    image_url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
    prep_time: '10 min', cook_time: '15 min', servings: 4,
    ingredients: '• 1 1/2 cups all-purpose flour\n• 3 1/2 tsp baking powder\n• 1 tbsp sugar\n• 1/4 tsp salt\n• 1 1/4 cups milk\n• 1 egg\n• 3 tbsp melted butter',
    instructions: '1. Mix flour, baking powder, sugar and salt in a large bowl.\n2. Make a well in the center and pour in milk, egg and melted butter.\n3. Mix until smooth.\n4. Heat a lightly oiled griddle over medium-high heat.\n5. Pour batter onto griddle using approximately 1/4 cup for each pancake.\n6. Brown on both sides and serve hot.',
    notes: 'Serve with maple syrup and fresh berries',
  },
  {
    id: 'demo-2', name: 'Grilled Chicken Salad', category: 'Lunch',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    prep_time: '15 min', cook_time: '20 min', servings: 2,
    ingredients: '• 2 chicken breasts\n• Mixed greens\n• Cherry tomatoes\n• Cucumber\n• Olive oil\n• Lemon juice\n• Salt and pepper',
    instructions: '1. Season chicken breasts with salt, pepper and olive oil.\n2. Grill chicken for 6-7 minutes per side until cooked through.\n3. Let chicken rest for 5 minutes, then slice.\n4. Arrange mixed greens on plates.\n5. Top with sliced chicken, cherry tomatoes and cucumber.\n6. Drizzle with olive oil and lemon juice.',
    notes: '',
  },
  {
    id: 'demo-3', name: 'Spaghetti Carbonara', category: 'Dinner',
    image_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
    prep_time: '10 min', cook_time: '20 min', servings: 4,
    ingredients: '• 400g spaghetti\n• 200g pancetta\n• 4 egg yolks\n• 100g pecorino cheese\n• Black pepper\n• Salt',
    instructions: '1. Cook spaghetti according to package directions.\n2. Cut pancetta into small cubes and fry until crispy.\n3. Mix egg yolks with grated pecorino and black pepper.\n4. Drain pasta, reserving 1 cup pasta water.\n5. Add hot pasta to pancetta pan, remove from heat.\n6. Quickly stir in egg mixture, adding pasta water as needed.\n7. Serve immediately with extra cheese and pepper.',
    notes: 'Use guanciale instead of pancetta for authentic flavor',
  },
  {
    id: 'demo-4', name: 'Chocolate Brownies', category: 'Desserts',
    image_url: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400',
    prep_time: '15 min', cook_time: '25 min', servings: 12,
    ingredients: '• 200g dark chocolate\n• 175g butter\n• 325g sugar\n• 3 eggs\n• 1 tsp vanilla extract\n• 100g flour\n• 50g cocoa powder',
    instructions: '1. Preheat oven to 180°C/350°F.\n2. Melt chocolate and butter together.\n3. Stir in sugar, then eggs and vanilla.\n4. Fold in flour and cocoa powder.\n5. Pour into lined baking tin.\n6. Bake for 25 minutes.\n7. Cool before cutting into squares.',
    notes: 'Add walnuts for extra texture',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sortCategories(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
}

function paginateSteps(text: string): string[] {
  return [text.trim() || ''];
}

const fieldBase: React.CSSProperties = {
  width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-xs)', color: 'var(--text)', padding: '6px 10px',
  fontSize: '0.875rem', fontFamily: 'inherit', lineHeight: 1.6, outline: 'none',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{
        display: 'block', fontSize: '0.7rem', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        color: 'var(--text-3)', marginBottom: 5,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Image Drop Zone ──────────────────────────────────────────────────────────

function ImageDropZone({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState(value.startsWith('data:') ? '' : value);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => { onChange(e.target?.result as string); setUrlInput(''); };
    reader.readAsDataURL(file);
  }, [onChange]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }, [loadFile]);

  const applyUrl = () => { if (urlInput.trim()) onChange(urlInput.trim()); setUrlMode(false); };

  if (value) {
    return (
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <img src={value} alt="Recipe" style={{
          width: '100%', height: 160, objectFit: 'cover',
          borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'block',
        }} />
        <div
          className="img-overlay"
          style={{
            position: 'absolute', inset: 0, borderRadius: 'var(--radius-sm)',
            background: 'rgba(0,0,0,0)', transition: 'background 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.45)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0)')}
        >
          <button onClick={() => fileRef.current?.click()} className="overlay-btn" style={{
            opacity: 0, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
            fontSize: '0.78rem', fontWeight: 600, backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', gap: 5, transition: 'opacity 0.2s',
          }}>
            <ImagePlus size={13} /> Replace
          </button>
          <button onClick={(e) => { e.stopPropagation(); onChange(''); setUrlInput(''); }} className="overlay-btn" style={{
            opacity: 0, background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.5)',
            color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
            fontSize: '0.78rem', fontWeight: 600, backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', gap: 5, transition: 'opacity 0.2s',
          }}>
            <X size={13} /> Remove
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
        <style>{`.img-overlay:hover .overlay-btn { opacity: 1 !important; }`}</style>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {!urlMode ? (
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileRef.current?.click()}
          style={{
            height: 110, border: `2px dashed ${dragging ? 'var(--accent-recipe)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)', background: dragging ? 'rgba(249,115,22,0.06)' : 'var(--surface-2)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s',
            color: dragging ? 'var(--accent-recipe)' : 'var(--text-3)',
          }}
        >
          <ImagePlus size={24} strokeWidth={1.5} />
          <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>
            {dragging ? 'Drop to upload' : 'Drag & drop or click to browse'}
          </div>
          <button onClick={(e) => { e.stopPropagation(); setUrlMode(true); }} style={{
            background: 'none', border: '1px solid var(--border)', color: 'var(--text-3)',
            borderRadius: 6, padding: '3px 10px', fontSize: '0.72rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Link size={11} /> Paste URL instead
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input autoFocus type="url" value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyUrl(); if (e.key === 'Escape') setUrlMode(false); }}
            placeholder="https://…" style={{ ...fieldBase, flex: 1 }} />
          <button onClick={applyUrl} style={{
            background: 'var(--accent-recipe)', color: '#fff', border: 'none',
            borderRadius: 'var(--radius-xs)', padding: '7px 14px',
            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Check size={13} /> Apply
          </button>
          <button onClick={() => setUrlMode(false)} style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            color: 'var(--text-2)', borderRadius: 'var(--radius-xs)', padding: '7px 10px', cursor: 'pointer',
          }}>
            <X size={13} />
          </button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
    </div>
  );
}

// ─── Pagination bar ───────────────────────────────────────────────────────────

function PaginationBar({ current, total, onChange }: {
  current: number; total: number; onChange: (p: number) => void;
}) {
  if (total <= 1) return null;
  return (
    <div style={{
      flexShrink: 0,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      gap: 6, padding: '10px 20px',
      borderTop: '1px solid var(--border)',
      background: 'var(--surface)',
    }}>
      <button
        className="btn btn-secondary"
        style={{ padding: '4px 14px', fontSize: '0.8rem' }}
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
      >
        ← Prev
      </button>
      {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => onChange(p)} style={{
          width: 30, height: 30, borderRadius: 'var(--radius-xs)',
          border: p === current ? 'none' : '1px solid var(--border)',
          background: p === current ? 'var(--accent-recipe)' : 'var(--surface-2)',
          color: p === current ? '#fff' : 'var(--text-2)',
          fontSize: '0.8rem', fontWeight: p === current ? 700 : 400,
          cursor: 'pointer', transition: 'all 0.15s',
        }}>
          {p}
        </button>
      ))}
      <button
        className="btn btn-secondary"
        style={{ padding: '4px 14px', fontSize: '0.8rem' }}
        onClick={() => onChange(current + 1)}
        disabled={current === total}
      >
        Next →
      </button>
    </div>
  );
}

// ─── Pantry / Ingredient Bank ────────────────────────────────────────────────

const DEFAULT_BANK_CATEGORIES = [
  'Proteins', 'Carbs', 'Dairy', 'Vegetables', 'Fruits',
  'Herbs & Spices', 'Condiments', 'Oils & Fats', 'Pantry Staples',
];

const DEFAULT_BANK: Record<string, string[]> = {
  'Proteins':       ['Chicken breast', 'Eggs', 'Tuna', 'Salmon', 'Ground beef', 'Shrimp', 'Pancetta', 'Bacon'],
  'Carbs':          ['Spaghetti', 'Rice', 'Bread', 'Flour', 'Oats', 'Potato', 'Pasta'],
  'Dairy':          ['Milk', 'Butter', 'Heavy cream', 'Pecorino cheese', 'Parmesan', 'Mozzarella', 'Yogurt'],
  'Vegetables':     ['Garlic', 'Onion', 'Tomato', 'Spinach', 'Broccoli', 'Zucchini', 'Cherry tomatoes', 'Cucumber'],
  'Fruits':         ['Lemon', 'Lime', 'Orange', 'Banana', 'Avocado', 'Berries'],
  'Herbs & Spices': ['Salt', 'Black pepper', 'Cumin', 'Paprika', 'Oregano', 'Basil', 'Thyme', 'Chili flakes'],
  'Condiments':     ['Olive oil', 'Soy sauce', 'Vinegar', 'Mustard', 'Honey', 'Hot sauce'],
  'Oils & Fats':    ['Olive oil', 'Butter', 'Coconut oil', 'Vegetable oil'],
  'Pantry Staples': ['Baking powder', 'Sugar', 'Brown sugar', 'Cornstarch', 'Vanilla extract'],
};

type PantryState = {
  available: Record<string, string[]>;
  bank: Record<string, string[]>;
};

const CACHE_KEY = 'recipe_pantry_v1';

function readCache(): PantryState | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeCache(state: PantryState) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(state)); } catch {}
}

function PantryView() {
  const [pantry, setPantry] = useState<PantryState>({ available: {}, bank: { ...DEFAULT_BANK } });
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount: show cache immediately, then fetch from Supabase
  useEffect(() => {
    const cached = readCache();
    if (cached) setPantry(mergeBankDefaults(cached));

    fetch('/api/pantry', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: { available?: Record<string, string[]>; bank?: Record<string, string[]> }) => {
        const merged = mergeBankDefaults({
          available: data.available ?? {},
          bank: data.bank && Object.keys(data.bank).length > 0 ? data.bank : { ...DEFAULT_BANK },
        });
        setPantry(merged);
        writeCache(merged);
      })
      .catch(() => { /* keep cache */ });
  }, []);

  function mergeBankDefaults(state: PantryState): PantryState {
    // Ensure default categories always exist
    const bank = { ...DEFAULT_BANK, ...state.bank };
    return { ...state, bank };
  }

  // Debounced save to Supabase, immediate cache write
  function update(next: PantryState) {
    setPantry(next);
    writeCache(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSyncing(true);
      fetch('/api/pantry', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
        .then((r) => r.json())
        .then((d) => {
          setSyncMsg(d.ok ? { text: 'Saved ✓', ok: true } : { text: d.error || 'Save failed', ok: false });
          setTimeout(() => setSyncMsg(null), 2000);
        })
        .catch(() => setSyncMsg({ text: 'Offline — saved locally', ok: false }))
        .finally(() => setSyncing(false));
    }, 800);
  }
  const [activeCategory, setActiveCategory] = useState(DEFAULT_BANK_CATEGORIES[0]);
  const [newItem, setNewItem] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  const allCategories = useMemo(() => {
    const bankCats = Object.keys(pantry.bank);
    const order = [...DEFAULT_BANK_CATEGORIES];
    bankCats.forEach((c) => { if (!order.includes(c)) order.push(c); });
    return order.filter((c) => bankCats.includes(c));
  }, [pantry.bank]);

  const availableCategories = useMemo(
    () => Object.keys(pantry.available).filter((c) => (pantry.available[c]?.length ?? 0) > 0),
    [pantry.available],
  );



  function addToAvailable(category: string, item: string) {
    const current = pantry.available[category] ?? [];
    if (current.includes(item)) return;
    update({ ...pantry, available: { ...pantry.available, [category]: [...current, item] } });
  }

  function removeFromAvailable(category: string, item: string) {
    const next = (pantry.available[category] ?? []).filter((i) => i !== item);
    update({ ...pantry, available: { ...pantry.available, [category]: next } });
  }

  function addToBank() {
    const trimmed = newItem.trim();
    if (!trimmed || !activeCategory) return;
    const current = pantry.bank[activeCategory] ?? [];
    if (current.includes(trimmed)) { setNewItem(''); return; }
    update({ ...pantry, bank: { ...pantry.bank, [activeCategory]: [...current, trimmed] } });
    setNewItem('');
  }

  function removeFromBank(category: string, item: string) {
    const next = (pantry.bank[category] ?? []).filter((i) => i !== item);
    update({ ...pantry, bank: { ...pantry.bank, [category]: next } });
  }

  function addCategory() {
    const trimmed = newCategory.trim();
    if (!trimmed || pantry.bank[trimmed] !== undefined) return;
    update({ ...pantry, bank: { ...pantry.bank, [trimmed]: [] } });
    setActiveCategory(trimmed);
    setNewCategory('');
    setAddingCategory(false);
  }

  const isInAvailable = (cat: string, item: string) =>
    (pantry.available[cat] ?? []).includes(item);

  const totalAvailable = Object.values(pantry.available).flat().length;

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>

      {/* ── LEFT: My Pantry ── */}
      <div style={{
        width: 210, flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--surface-2)',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 14px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <div style={{
            fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.12em', color: 'var(--accent-recipe)', marginBottom: 2,
          }}>
            🧺 My Pantry
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {totalAvailable} ingredient{totalAvailable !== 1 ? 's' : ''} on hand
            {syncing && <span style={{ fontSize: '0.65rem', color: 'var(--accent-recipe)', opacity: 0.8 }}>syncing…</span>}
            {syncMsg && <span style={{ fontSize: '0.65rem', color: syncMsg.ok ? '#4ade80' : '#f5a623' }}>{syncMsg.text}</span>}
          </div>
        </div>

        {/* Available list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {availableCategories.length === 0 && (
            <div style={{
              color: 'var(--text-3)', fontSize: '0.78rem',
              textAlign: 'center', marginTop: 28, lineHeight: 1.8,
            }}>
              Nothing here yet.<br />
              Hit <strong style={{ color: 'var(--accent-recipe)' }}>+</strong> on any ingredient<br />
              in the bank →
            </div>
          )}
          {availableCategories.map((cat) => (
            <div key={cat} style={{ marginBottom: 14 }}>
              <div style={{
                fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 5,
              }}>
                {cat}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {(pantry.available[cat] ?? []).map((item) => (
                  <div key={item} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '4px 8px', borderRadius: 6,
                    background: 'rgba(249,115,22,0.1)',
                    border: '1px solid rgba(249,115,22,0.2)',
                    fontSize: '0.79rem', color: 'var(--text)',
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ color: 'var(--accent-recipe)', fontSize: '0.7rem' }}>✓</span>
                      {item}
                    </span>
                    <button
                      onClick={() => removeFromAvailable(cat, item)}
                      style={{
                        background: 'none', border: 'none', color: 'var(--text-3)',
                        cursor: 'pointer', padding: '0 2px', fontSize: '0.7rem', lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >✕</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Clear all */}
        {totalAvailable > 0 && (
          <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <button
              onClick={() => update({ ...pantry, available: {} })}
              style={{
                width: '100%', background: 'none', border: '1px solid var(--border)',
                color: 'var(--text-3)', borderRadius: 6, padding: '5px',
                fontSize: '0.72rem', cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.borderColor = '#ef4444'; (e.target as HTMLButtonElement).style.color = '#ef4444'; }}
              onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.target as HTMLButtonElement).style.color = 'var(--text-3)'; }}
            >
              Clear pantry
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT: Ingredient Bank ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>

        {/* Category tab bar */}
        <div style={{
          flexShrink: 0, padding: '10px 16px 0',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'flex-end', gap: 0,
          overflowX: 'auto',
        }}>
          <div style={{
            fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.12em', color: 'var(--text-3)', whiteSpace: 'nowrap',
            alignSelf: 'center', marginRight: 10, paddingBottom: 4,
          }}>
            🏦 Ingredient Bank
          </div>
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 13px', whiteSpace: 'nowrap',
                borderRadius: '7px 7px 0 0',
                border: '1px solid var(--border)',
                borderBottom: activeCategory === cat ? '1px solid var(--surface)' : '1px solid var(--border)',
                background: activeCategory === cat ? 'var(--surface)' : 'var(--surface-2)',
                color: activeCategory === cat ? 'var(--accent-recipe)' : 'var(--text-3)',
                fontSize: '0.74rem', fontWeight: activeCategory === cat ? 700 : 400,
                cursor: 'pointer', marginBottom: -1, marginRight: 2,
                transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              {cat}
              {(() => {
                const count = (pantry.available[cat] ?? []).length;
                return count > 0 ? (
                  <span style={{
                    marginLeft: 5, background: 'var(--accent-recipe)', color: '#fff',
                    borderRadius: 99, padding: '1px 5px', fontSize: '0.62rem', fontWeight: 700,
                  }}>{count}</span>
                ) : null;
              })()}
            </button>
          ))}
          {/* Add category button */}
          {addingCategory ? (
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', paddingBottom: 4, marginLeft: 4 }}>
              <input
                autoFocus
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addCategory(); if (e.key === 'Escape') setAddingCategory(false); }}
                placeholder="Category name"
                style={{
                  padding: '4px 8px', fontSize: '0.74rem', borderRadius: 6,
                  border: '1px solid var(--accent-recipe)', background: 'var(--surface-2)',
                  color: 'var(--text)', outline: 'none', width: 130,
                }}
              />
              <button onClick={addCategory} style={{
                background: 'var(--accent-recipe)', border: 'none', color: '#fff',
                borderRadius: 6, padding: '4px 10px', fontSize: '0.72rem', cursor: 'pointer',
              }}>Add</button>
              <button onClick={() => setAddingCategory(false)} style={{
                background: 'none', border: '1px solid var(--border)', color: 'var(--text-3)',
                borderRadius: 6, padding: '4px 8px', fontSize: '0.72rem', cursor: 'pointer',
              }}>✕</button>
            </div>
          ) : (
            <button
              onClick={() => setAddingCategory(true)}
              style={{
                padding: '6px 10px', borderRadius: '7px 7px 0 0', flexShrink: 0,
                border: '1px dashed var(--border)', background: 'transparent',
                color: 'var(--text-3)', fontSize: '0.72rem', cursor: 'pointer', marginLeft: 4,
              }}
              title="Add new category"
            >
              + Category
            </button>
          )}
        </div>

        {/* Bank items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {(pantry.bank[activeCategory] ?? []).map((item) => {
              const inPantry = isInAvailable(activeCategory, item);
              return (
                <div
                  key={item}
                  onClick={() => inPantry ? removeFromAvailable(activeCategory, item) : addToAvailable(activeCategory, item)}
                  title={inPantry ? 'Click to remove from pantry' : 'Click to add to pantry'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 99,
                    background: inPantry ? 'rgba(249,115,22,0.13)' : 'var(--surface-2)',
                    border: `1px solid ${inPantry ? 'rgba(249,115,22,0.4)' : 'var(--border)'}`,
                    fontSize: '0.8rem',
                    color: inPantry ? 'var(--accent-recipe)' : 'var(--text-2)',
                    transition: 'all 0.15s',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <span
                    onClick={() => inPantry ? removeFromAvailable(activeCategory, item) : addToAvailable(activeCategory, item)}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >{item}</span>
                  {/* Remove from bank */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFromBank(activeCategory, item); }}
                    title="Remove from bank"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-3)', padding: '0 2px', fontSize: '0.62rem',
                      opacity: 0.5, lineHeight: 1,
                    }}
                  >✕</button>
                </div>
              );
            })}
            {(pantry.bank[activeCategory] ?? []).length === 0 && (
              <div style={{ color: 'var(--text-3)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                No items in <strong>{activeCategory}</strong> yet — add one below ↓
              </div>
            )}
          </div>
        </div>

        {/* Add ingredient to bank */}
        <div style={{
          flexShrink: 0, padding: '10px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: 8, alignItems: 'center',
          background: 'var(--surface)',
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
            Add to <span style={{ color: 'var(--accent-recipe)', fontWeight: 700 }}>{activeCategory}</span>:
          </div>
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addToBank(); }}
            placeholder="e.g. Parmesan, Garlic cloves…"
            style={{
              flex: 1, padding: '6px 10px', fontSize: '0.82rem',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xs)', color: 'var(--text)', outline: 'none',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent-recipe)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
          <button
            onClick={addToBank}
            disabled={!newItem.trim()}
            style={{
              background: newItem.trim() ? 'var(--accent-recipe)' : 'var(--surface-3)',
              border: 'none', color: newItem.trim() ? '#fff' : 'var(--text-3)',
              borderRadius: 'var(--radius-xs)', padding: '6px 16px',
              fontSize: '0.82rem', fontWeight: 600, cursor: newItem.trim() ? 'pointer' : 'default',
              transition: 'all 0.15s',
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RecipeWorkspace({ initialRows }: { initialRows: RecordShape[] }) {
  const [recipes, setRecipes] = useState<Recipe[]>(
    initialRows.length > 0 ? (initialRows as Recipe[]) : DEMO_RECIPES
  );
  const [mode, setMode] = useState<'view' | 'new' | 'edit'>('view');
  const [selectedId, setSelectedId] = useState<string | null>(recipes[0]?.id || null);
  const [draft, setDraft] = useState<typeof BLANK_RECIPE>(BLANK_RECIPE);
  const [currentPage, setCurrentPage] = useState(1);
  const [tocOpen, setTocOpen] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set([recipes[0]?.category || 'Breakfast'])
  );

  const recipesByCategory = useMemo(() => {
    const grouped: Record<string, Recipe[]> = {};
    recipes.forEach((r) => {
      const cat = r.category || 'Uncategorized';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(r);
    });
    return grouped;
  }, [recipes]);

  const tocCategories = useMemo(
    () => sortCategories(Object.keys(recipesByCategory)),
    [recipesByCategory]
  );

  const allCategories = useMemo(() => {
    const extra = Object.keys(recipesByCategory).filter((c) => !CATEGORY_ORDER.includes(c));
    return [...CATEGORY_ORDER, ...extra.sort()];
  }, [recipesByCategory]);

  const selectedRecipe = recipes.find((r) => r.id === selectedId) ?? null;

  const pages = useMemo(
    () => paginateSteps(selectedRecipe?.instructions ?? ''),
    [selectedRecipe]
  );
  const totalPages = pages.length;

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  function handleRecipeClick(id: string) {
    setSelectedId(id); setMode('view'); setCurrentPage(1); setIsFlipped(false);
  }

  function handleAddNew() { setDraft({ ...BLANK_RECIPE }); setMode('new'); setIsFlipped(false); }

  function handleEdit() {
    if (!selectedRecipe) return;
    setDraft({ ...selectedRecipe }); setMode('edit'); setIsFlipped(false);
  }

  function handleCancel() {
    setMode('view');
    if (!selectedId && recipes.length > 0) setSelectedId(recipes[0].id);
  }

  async function handleSave() {
    if (mode === 'new') {
      const newRecipe = { ...draft, id: `recipe-${Date.now()}` } as Recipe;
      setRecipes((prev) => [newRecipe, ...prev]);
      setSelectedId(newRecipe.id);
      if (newRecipe.category) setExpandedCategories((prev) => new Set([...prev, newRecipe.category]));
      try { await fetch('/api/records/recipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) }); } catch {}
    } else if (mode === 'edit' && selectedId) {
      setRecipes((prev) => prev.map((r) => r.id === selectedId ? { ...draft, id: selectedId } as Recipe : r));
      try { await fetch(`/api/records/recipe/${selectedId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) }); } catch {}
    }
    setMode('view');
  }

  function set(key: string, value: string | number) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  const isEditing = mode === 'edit' || mode === 'new';
  const showImage = currentPage === 1 && Boolean(selectedRecipe?.image_url);

  return (
    <div className="page">
      {/* Page header */}
      <div className="hero" style={{ paddingBottom: 20 }}>
        <div className="hero-meta">
          <p className="eyebrow">Module</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="page-title" style={{ color: 'var(--accent-recipe)' }}>Recipe Book</h1>
            <div className="record-chip"><strong>{recipes.length}</strong> recipes</div>
          </div>
          <p className="muted small" style={{ maxWidth: 440, marginTop: 4 }}>
            Your personal cookbook with all your favorite recipes organized by category.
          </p>
        </div>
      </div>

      <div className="card" style={{
        padding: 0,
        overflow: 'hidden',
        height: 'calc(100vh - 230px)',
        minHeight: 500,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

          {/* ── TOC (collapsible) ── */}
          <div style={{
            width: tocOpen ? 220 : 0,
            flexShrink: 0,
            borderRight: tocOpen ? '1px solid var(--border)' : 'none',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            transition: 'width 0.22s ease',
          }}>
            <div style={{
              width: 220, flexShrink: 0, height: '100%',
              display: 'flex', flexDirection: 'column',
              padding: '20px 10px', overflowY: 'auto',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)',
                }}>
                  <ChefHat size={16} style={{ color: 'var(--accent-recipe)' }} />
                  Contents
                </div>
                <button onClick={handleAddNew} style={{
                  background: 'var(--accent-recipe)', color: '#fff', border: 'none',
                  borderRadius: 'var(--radius-xs)', padding: '5px 10px',
                  fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <Plus size={12} /> New
                </button>
              </div>

              {mode === 'new' && (
                <div style={{
                  padding: '6px 10px', fontSize: '0.8rem', borderRadius: 'var(--radius-xs)',
                  background: 'var(--accent-recipe)', color: '#fff', marginBottom: 8, fontStyle: 'italic',
                }}>
                  + New recipe…
                </div>
              )}

              {tocCategories.map((category) => (
                <div key={category} style={{ marginBottom: 2 }}>
                  <button onClick={() => toggleCategory(category)} style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '7px 10px', background: 'var(--surface-2)',
                    borderRadius: 'var(--radius-xs)', cursor: 'pointer',
                    border: 'none', width: '100%', textAlign: 'left',
                    color: 'var(--text)', fontWeight: 600, fontSize: '0.82rem', marginBottom: 2,
                  }}>
                    <span style={{ color: 'var(--accent-recipe)', display: 'flex' }}>
                      {expandedCategories.has(category) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </span>
                    {category}
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 400 }}>
                      {recipesByCategory[category]?.length ?? 0}
                    </span>
                  </button>
                  {expandedCategories.has(category) && (
                    <div style={{ marginLeft: 14, marginBottom: 4 }}>
                      {(recipesByCategory[category] ?? []).map((recipe) => {
                        const isActive = mode !== 'new' && selectedId === recipe.id;
                        return (
                          <button key={recipe.id} onClick={() => handleRecipeClick(recipe.id)} style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            padding: '5px 10px', fontSize: '0.8rem', cursor: 'pointer',
                            borderRadius: 'var(--radius-xs)', border: 'none',
                            background: isActive ? 'var(--accent-recipe)' : 'none',
                            color: isActive ? '#fff' : 'var(--text-2)',
                            marginBottom: 1, transition: 'background 0.15s, color 0.15s',
                          }}>
                            {recipe.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right panel ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>

            {isEditing ? (
              /* ══ EDIT / NEW ══ */
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '28px 36px' }}>
                <input
                  value={draft.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Recipe title"
                  style={{
                    ...fieldBase, textAlign: 'center', fontSize: '1.4rem',
                    fontFamily: 'Georgia, serif', fontWeight: 700,
                    letterSpacing: '1px', textTransform: 'uppercase',
                    border: 'none', borderBottom: '1px solid var(--border)',
                    borderRadius: 0, background: 'transparent',
                    paddingBottom: 12, marginBottom: 20, width: '100%',
                  }}
                />
                <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: '2 1 140px' }}>
                    <Field label="Category">
                      <select value={draft.category} onChange={(e) => set('category', e.target.value)} style={fieldBase}>
                        <option value="">Select…</option>
                        {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div style={{ flex: '1 1 90px' }}>
                    <Field label="Prep Time">
                      <input style={fieldBase} value={draft.prep_time} onChange={(e) => set('prep_time', e.target.value)} placeholder="10 min" />
                    </Field>
                  </div>
                  <div style={{ flex: '1 1 90px' }}>
                    <Field label="Cook Time">
                      <input style={fieldBase} value={draft.cook_time} onChange={(e) => set('cook_time', e.target.value)} placeholder="20 min" />
                    </Field>
                  </div>
                  <div style={{ flex: '0 0 72px' }}>
                    <Field label="Serves">
                      <input style={fieldBase} type="number" value={draft.servings} onChange={(e) => set('servings', Number(e.target.value))} />
                    </Field>
                  </div>
                </div>
                <Field label="Photo">
                  <ImageDropZone value={draft.image_url} onChange={(url) => set('image_url', url)} />
                </Field>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ width: 180, flexShrink: 0 }}>
                    <Field label="Ingredients">
                      <textarea style={{ ...fieldBase, resize: 'vertical', minHeight: 150 }}
                        value={draft.ingredients} onChange={(e) => set('ingredients', e.target.value)}
                        placeholder={"• 1 cup flour\n• 2 eggs\n…"} />
                    </Field>
                    <Field label="Notes">
                      <textarea style={{ ...fieldBase, resize: 'vertical', minHeight: 70 }}
                        value={draft.notes} onChange={(e) => set('notes', e.target.value)}
                        placeholder="Tips, substitutions…" />
                    </Field>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Field label="Instructions">
                      <textarea style={{ ...fieldBase, resize: 'vertical', minHeight: 240 }}
                        value={draft.instructions} onChange={(e) => set('instructions', e.target.value)}
                        placeholder={"1. Preheat oven…\n2. Mix ingredients…"} />
                    </Field>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={handleCancel}><X size={14} /> Cancel</button>
                  <button
                    className="btn btn-primary"
                    style={{ background: 'var(--accent-recipe)', borderColor: 'var(--accent-recipe)', color: '#fff' }}
                    onClick={handleSave}
                  >
                    <Check size={14} /> {mode === 'new' ? 'Add Recipe' : 'Save Changes'}
                  </button>
                </div>
              </div>

            ) : selectedRecipe ? (
              /* ══ VIEW (front) or PANTRY (back) ══ */
              <>
                {/* Animated container */}
                <div style={{
                  flex: 1, minHeight: 0,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* ── FRONT: recipe detail ── */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    opacity: isFlipped ? 0 : 1,
                    transform: isFlipped ? 'translateX(-24px)' : 'translateX(0)',
                    transition: 'opacity 0.22s ease, transform 0.22s ease',
                    pointerEvents: isFlipped ? 'none' : 'auto',
                    overflow: 'hidden',
                  }}>
                    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '28px 36px' }}>
                      {/* Title row */}
                      <div style={{ position: 'relative', marginBottom: 20 }}>
                        <button
                          onClick={() => setTocOpen((v) => !v)}
                          title={tocOpen ? 'Hide contents' : 'Show contents'}
                          style={{
                            position: 'absolute', top: 0, left: 0,
                            background: 'none', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-xs)', padding: '5px 8px',
                            color: 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center',
                          }}
                        >
                          {tocOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
                        </button>
                        <h1 style={{
                          textAlign: 'center', letterSpacing: '2px', textTransform: 'uppercase',
                          borderBottom: '1px solid var(--border)', paddingBottom: 16,
                          fontFamily: 'Georgia, serif', fontSize: '1.7rem', fontWeight: 700, color: 'var(--text)',
                        }}>
                          {selectedRecipe.name}
                        </h1>
                        {/* Right side buttons */}
                        <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => setIsFlipped(true)}
                            title="Flip to Pantry"
                            style={{
                              background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)',
                              borderRadius: 'var(--radius-xs)', padding: '5px 10px',
                              color: 'var(--accent-recipe)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 5,
                              fontSize: '0.75rem', fontWeight: 600,
                            }}
                          >
                            <FlipHorizontal size={13} /> Pantry
                          </button>
                          <button onClick={handleEdit} className="btn btn-secondary"
                            style={{ padding: '5px 12px', fontSize: '0.78rem' }}>
                            <Pencil size={12} /> Edit
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 32, height: 'calc(100% - 80px)' }}>
                        {/* Ingredients */}
                        <div style={{ width: 180, flexShrink: 0, overflow: 'hidden' }}>
                          <h3 style={{
                            fontFamily: 'Georgia, serif', fontSize: '1rem', marginBottom: 12,
                            color: 'var(--accent-recipe)', borderBottom: `2px solid var(--accent-recipe)`, paddingBottom: 5,
                          }}>
                            Ingredients
                          </h3>
                          <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-2)', lineHeight: 1.75, fontSize: '0.855rem' }}>
                            {selectedRecipe.ingredients}
                          </div>
                          {selectedRecipe.notes ? (
                            <>
                              <hr style={{ border: 'none', borderTop: '2px dotted var(--border)', margin: '16px 0' }} />
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>
                                <strong style={{ color: 'var(--text)' }}>Notes: </strong>{selectedRecipe.notes}
                              </div>
                            </>
                          ) : null}
                        </div>

                        {/* Right column */}
                        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                          {/* Meta row */}
                          <div style={{
                            flexShrink: 0,
                            display: 'flex', justifyContent: 'space-around',
                            borderBottom: '1px dotted var(--border)',
                            paddingBottom: 12, marginBottom: 14, textAlign: 'center',
                          }}>
                            {selectedRecipe.prep_time && (
                              <div style={{ borderRight: '1px dotted var(--border)', paddingRight: 16, flex: 1 }}>
                                <Timer size={16} style={{ margin: '0 auto 4px', display: 'block', color: 'var(--accent-recipe)' }} />
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text)' }}>Prep</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-2)' }}>{selectedRecipe.prep_time}</div>
                              </div>
                            )}
                            {selectedRecipe.cook_time && (
                              <div style={{ borderRight: '1px dotted var(--border)', paddingRight: 16, flex: 1 }}>
                                <Clock size={16} style={{ margin: '0 auto 4px', display: 'block', color: 'var(--accent-recipe)' }} />
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text)' }}>Cook</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-2)' }}>{selectedRecipe.cook_time}</div>
                              </div>
                            )}
                            {selectedRecipe.servings && (
                              <div style={{ flex: 1 }}>
                                <Users size={16} style={{ margin: '0 auto 4px', display: 'block', color: 'var(--accent-recipe)' }} />
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text)' }}>Serves</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-2)' }}>{selectedRecipe.servings}</div>
                              </div>
                            )}
                          </div>

                          {showImage && (
                            <img
                              src={selectedRecipe.image_url} alt={selectedRecipe.name}
                              style={{
                                flexShrink: 0,
                                width: '100%', height: 180, objectFit: 'cover',
                                objectPosition: 'center', marginBottom: 14,
                                borderRadius: 'var(--radius-sm)',
                              }}
                            />
                          )}

                          <h3 style={{
                            flexShrink: 0,
                            fontFamily: 'Georgia, serif', fontSize: '1rem', marginBottom: 10,
                            color: 'var(--accent-recipe)', borderBottom: `2px solid var(--accent-recipe)`, paddingBottom: 5,
                            display: 'flex', alignItems: 'baseline', gap: 8,
                          }}>
                            Preparation
                            {totalPages > 1 && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 400, fontFamily: 'var(--font-body)', color: 'var(--text-3)' }}>
                                page {currentPage} of {totalPages}
                              </span>
                            )}
                          </h3>

                          <div style={{
                            flex: 1, minHeight: 0, overflowY: 'auto',
                            whiteSpace: 'pre-wrap', color: 'var(--text-2)',
                            lineHeight: 1.8, fontSize: '0.875rem',
                          }}>
                            {pages[currentPage - 1]}
                          </div>
                        </div>
                      </div>
                    </div>
                    <PaginationBar current={currentPage} total={totalPages} onChange={setCurrentPage} />
                  </div>

                  {/* ── BACK: pantry view ── */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    opacity: isFlipped ? 1 : 0,
                    transform: isFlipped ? 'translateX(0)' : 'translateX(24px)',
                    transition: 'opacity 0.22s ease, transform 0.22s ease',
                    pointerEvents: isFlipped ? 'auto' : 'none',
                  }}>
                    {/* Back header */}
                    <div style={{
                      flexShrink: 0,
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 16px', borderBottom: '1px solid var(--border)',
                      background: 'var(--surface)',
                    }}>
                      <button
                        onClick={() => setIsFlipped(false)}
                        style={{
                          background: 'var(--surface-2)', border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-xs)', padding: '5px 12px',
                          color: 'var(--text-2)', cursor: 'pointer', fontSize: '0.78rem',
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}
                      >
                        <FlipHorizontal size={13} /> Back to recipe
                      </button>
                      <div style={{ height: 20, width: 1, background: 'var(--border)' }} />
                      <span style={{
                        fontFamily: 'var(--font-display)', fontWeight: 700,
                        fontSize: '0.88rem', color: 'var(--accent-recipe)',
                      }}>
                        Pantry Manager
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginLeft: 2 }}>
                        — track what you have, build your ingredient bank
                      </span>
                    </div>

                    {/* Pantry content */}
                    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                      <PantryView />
                    </div>
                  </div>
                </div>
              </>

            ) : (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)',
              }}>
                <UtensilsCrossed size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
                <p>Select a recipe or click <strong>New</strong> to add one</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}