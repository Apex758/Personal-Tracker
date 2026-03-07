'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, User } from 'lucide-react';
import { loadProfile } from '@/components/shell';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
] as const;

type TabId = typeof TABS[number]['id'];

function ProfileTab() {
  const [name, setName]     = useState('');
  const [bio, setBio]       = useState('');
  const [image, setImage]   = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/profile', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { setName(d.name || ''); setBio(d.bio || ''); setImage(d.image_url || ''); })
      .catch(() => {});
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, image_url: image }),
      });
      if (!res.ok) throw new Error();
      // Refresh the shell instantly
      await loadProfile();
      setStatus('saved');
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setStatus('idle'), 2500);
    }
  }

  const initial = name ? name[0].toUpperCase() : 'D';

  return (
    <div style={{ maxWidth: 480 }}>
      <p className="eyebrow" style={{ marginBottom: 4 }}>Your identity</p>
      <h2 className="section-title" style={{ marginBottom: 24 }}>Profile</h2>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            width: 96, height: 96, borderRadius: '50%', flexShrink: 0,
            background: image ? 'transparent' : 'linear-gradient(135deg, var(--teal), var(--violet))',
            border: '2px solid var(--border-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative', overflow: 'hidden',
          }}
        >
          {image
            ? <img src={image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color: '#fff' }}>{initial}</span>
          }
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
          >
            <Camera size={22} color="#fff" />
          </div>
        </div>

        <div>
          <button onClick={() => fileRef.current?.click()} className="btn btn-secondary" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Camera size={14} /> Upload photo
          </button>
          {image && (
            <button onClick={() => setImage('')} style={{ fontSize: '0.78rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'block' }}>
              Remove photo
            </button>
          )}
          <p className="muted small" style={{ marginTop: 6 }}>JPG, PNG or WebP.</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </div>

      {/* Fields */}
      <div className="field" style={{ marginBottom: 18 }}>
        <label>Display Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Delon Pierre" />
      </div>

      <div className="field" style={{ marginBottom: 28 }}>
        <label>Bio</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A short intro about yourself…" style={{ minHeight: 90 }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
          style={{
            background: status === 'saved' ? '#4ade80' : status === 'error' ? '#ef4444' : 'var(--teal)',
            borderColor: status === 'saved' ? '#4ade80' : status === 'error' ? '#ef4444' : 'var(--teal)',
            color: '#000', minWidth: 140, transition: 'background 0.3s, border-color 0.3s',
          }}
        >
          {saving ? 'Saving…' : status === 'saved' ? '✓ Saved!' : status === 'error' ? 'Error — retry' : 'Save Profile'}
        </button>
        <span className="muted small">Saved to Supabase</span>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  return (
    <div className="page">
      <div className="hero" style={{ paddingBottom: 20 }}>
        <div className="hero-meta">
          <p className="eyebrow">Personal HQ</p>
          <h1 className="page-title">Settings</h1>
          <p className="muted small" style={{ marginTop: 4 }}>Manage your profile and preferences.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Left tab list */}
        <div style={{ width: 200, flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 8 }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 12px',
                borderRadius: 'var(--radius-sm)', border: 'none',
                background: activeTab === id ? 'var(--teal-dim)' : 'transparent',
                color: activeTab === id ? 'var(--teal)' : 'var(--text-2)',
                fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer',
                textAlign: 'left', transition: 'background 0.15s, color 0.15s',
                position: 'relative',
              }}
            >
              {activeTab === id && (
                <span style={{ position: 'absolute', left: 0, top: '20%', height: '60%', width: 3, background: 'var(--teal)', borderRadius: '0 3px 3px 0' }} />
              )}
              <Icon size={16} strokeWidth={1.8} />
              {label}
            </button>
          ))}
        </div>

        {/* Right content */}
        <div className="card" style={{ flex: 1, minWidth: 0 }}>
          {activeTab === 'profile' && <ProfileTab />}
        </div>
      </div>
    </div>
  );
}