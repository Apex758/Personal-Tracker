'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { modules } from '@/lib/modules';
import { Dumbbell } from 'lucide-react';
import { MonthProvider } from '@/lib/month-context';
import {
  LayoutDashboard, Wallet, Leaf, Target, Briefcase, Plane, Star,
  ShoppingCart, Menu, X, Sun, Moon, ChefHat, Settings, Camera,
  type LucideIcon,
} from 'lucide-react';

const MODULE_ICONS: Record<string, LucideIcon> = {
  finance:   Wallet,
  grocery:   ShoppingCart,
  lifestyle: Leaf,
  skills:    Target,
  work:      Briefcase,
  travel:    Plane,
  wishlist:  Star,
  recipe:    ChefHat,
  gym:       Dumbbell,
};

// ─── Profile Settings Modal ───────────────────────────────────────────────────
function ProfileModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState('');
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem('phq-profile');
      if (p) { const parsed = JSON.parse(p); setName(parsed.name || ''); setBio(parsed.bio || ''); setImage(parsed.image || ''); }
    } catch {}
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    try { localStorage.setItem('phq-profile', JSON.stringify({ name, bio, image })); } catch {}
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)', zIndex: 200,
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 201, width: 'min(420px, 92vw)',
        background: 'var(--surface)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius)',
        padding: 28,
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 3 }}>
              Personalisation
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>
              Profile Settings
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)' }}>
            <X size={15} />
          </button>
        </div>

        {/* Avatar upload */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: 88, height: 88, borderRadius: '50%',
              background: image ? 'transparent' : 'linear-gradient(135deg, var(--teal), var(--violet))',
              border: '2px solid var(--border-strong)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', overflow: 'hidden',
              transition: 'opacity 0.2s',
            }}
            title="Click to upload photo"
          >
            {image
              ? <img src={image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: '#fff' }}>
                  {name ? name[0].toUpperCase() : 'D'}
                </span>
            }
            {/* Hover overlay */}
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.2s', borderRadius: '50%',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
            >
              <Camera size={20} color="#fff" />
            </div>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 8 }}>Click to upload photo</p>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          {image && (
            <button onClick={() => setImage('')} style={{ fontSize: '0.72rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>
              Remove photo
            </button>
          )}
        </div>

        {/* Name field */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 6 }}>
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Delon Pierre"
            style={{
              width: '100%', padding: '9px 12px',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.875rem',
              outline: 'none', transition: 'border-color 0.15s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--teal)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        {/* Bio field */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 6 }}>
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A short intro about yourself…"
            rows={3}
            style={{
              width: '100%', padding: '9px 12px',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.875rem',
              outline: 'none', resize: 'vertical', lineHeight: 1.6,
              transition: 'border-color 0.15s', fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--teal)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          style={{
            width: '100%', padding: '10px 0',
            background: saved ? '#4ade80' : 'linear-gradient(135deg, var(--teal), var(--violet))',
            border: 'none', borderRadius: 'var(--radius-sm)',
            color: '#000', fontWeight: 700, fontSize: '0.9rem',
            cursor: 'pointer', transition: 'background 0.3s',
            letterSpacing: '0.04em',
          }}
        >
          {saved ? '✓ Saved!' : 'Save Profile'}
        </button>
      </div>
    </>
  );
}

// ─── Profile Pill (sidebar footer) ───────────────────────────────────────────
function ProfilePill({ onOpen, expanded }: { onOpen: () => void; expanded: boolean }) {
  const [profile, setProfile] = useState({ name: '', bio: '', image: '' });

  useEffect(() => {
    function load() {
      try {
        const p = localStorage.getItem('phq-profile');
        if (p) setProfile(JSON.parse(p));
      } catch {}
    }
    load();
    window.addEventListener('phq-profile-updated', load);
    return () => window.removeEventListener('phq-profile-updated', load);
  }, []);

  const displayName = profile.name || 'Delon';
  const initial = displayName[0]?.toUpperCase() || 'D';

  return (
    <button
      onClick={onOpen}
      title="Profile settings"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 10px', borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)', background: 'var(--surface-2)',
        cursor: 'pointer', width: '100%', textAlign: 'left',
        transition: 'background 0.15s, border-color 0.15s',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-3)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
    >
      {/* Avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: profile.image ? 'transparent' : 'linear-gradient(135deg, var(--teal), var(--violet))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', border: '1px solid var(--border-strong)',
      }}>
        {profile.image
          ? <img src={profile.image} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.85rem', color: '#fff' }}>{initial}</span>
        }
      </div>

      {/* Name + settings icon — only visible when expanded */}
      <div style={{
        flex: 1, minWidth: 0,
        opacity: expanded ? 1 : 0,
        maxWidth: expanded ? 160 : 0,
        overflow: 'hidden',
        transition: 'opacity 0.18s, max-width 0.18s',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        whiteSpace: 'nowrap',
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {displayName}
          </div>
          {profile.bio && (
            <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile.bio.length > 28 ? profile.bio.slice(0, 28) + '…' : profile.bio}
            </div>
          )}
        </div>
        <Settings size={13} style={{ color: 'var(--text-3)', flexShrink: 0, marginLeft: 6 }} />
      </div>
    </button>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────
export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [profileOpen, setProfileOpen] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('phq-theme') as 'dark' | 'light' | null;
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('phq-theme', next); } catch {}
  };

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 820);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  function handleSidebarEnter() {
    if (isMobile) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setExpanded(true);
  }

  function handleSidebarLeave() {
    if (isMobile) return;
    hoverTimer.current = setTimeout(() => setExpanded(false), 160);
  }

  function handleMainClick() {
    if (!isMobile) setExpanded(false);
    if (isMobile && mobileOpen) setMobileOpen(false);
  }

  const isExpanded = isMobile ? mobileOpen : expanded;

  return (
    <MonthProvider>
      {isMobile && mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}

      <aside
        className={`sidebar${isExpanded ? ' expanded' : ''}`}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
      >
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="brand-icon">D</div>
            <div className="brand-text">
              <div className="brand-name">Personal HQ</div>
              <div className="brand-sub">Delon's tracker</div>
            </div>
          </div>
          {isMobile && (
            <button className="collapse-btn" onClick={() => setMobileOpen(false)}>
              <X size={14} />
            </button>
          )}
        </div>

        <nav className="nav-section">
          <div className="nav-label">Overview</div>
          <NavItem href="/" active={pathname === '/'} icon={<LayoutDashboard size={20} strokeWidth={1.8} />} label="Dashboard" />
          <div className="nav-label" style={{ marginTop: 10 }}>Modules</div>
          {modules.map((module) => {
            const Icon = MODULE_ICONS[module.slug];
            return (
              <NavItem
                key={module.slug}
                href={`/module/${module.slug}`}
                active={pathname === `/module/${module.slug}`}
                icon={Icon ? <Icon size={20} strokeWidth={1.8} /> : null}
                label={module.label}
              />
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            <span className="theme-toggle-icon">
              {theme === 'dark' ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
            </span>
            <span className="theme-toggle-label">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </span>
          </button>

          {/* Profile / Settings pill — replaces the old status dot */}
          <ProfilePill onOpen={() => setProfileOpen(true)} expanded={isExpanded} />
        </div>
      </aside>

      <div className="app-root">
        {isMobile && (
          <div className="mobile-topbar">
            <div className="mobile-brand">
              <div className="brand-icon" style={{ width: 28, height: 28, fontSize: 12, borderRadius: 8 }}>D</div>
              Personal HQ
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={toggleTheme}
                style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button className="hamburger" onClick={() => setMobileOpen(true)}>
                <Menu size={18} />
              </button>
            </div>
          </div>
        )}
        <main className="content" onClick={handleMainClick}>
          {children}
        </main>
      </div>
    </MonthProvider>
  );
}

function NavItem({ href, active, icon, label }: { href: string; active: boolean; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className={`nav-link${active ? ' active' : ''}`}>
      <span className="nav-icon">{icon}</span>
      <span className="nav-text">{label}</span>
    </Link>
  );
}