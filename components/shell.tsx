'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { modules } from '@/lib/modules';
import { Dumbbell } from 'lucide-react';
import { MonthProvider } from '@/lib/month-context';
import {
  LayoutDashboard, Wallet, Leaf, Target, Briefcase, Plane, Star,
  ShoppingCart, Menu, X, Sun, Moon, ChefHat, Settings,
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

const MODULE_ACCENTS: Record<string, string> = {
  finance:   '#00d4aa',
  grocery:   '#4ade80',
  lifestyle: '#f06292',
  skills:    '#7c6ef7',
  work:      '#f5a623',
  travel:    '#38bdf8',
  wishlist:  '#c084fc',
  recipe:    '#f97316',
  gym:       '#f97316',
};

type Profile = { name: string; bio: string; image_url: string };

// Shared in-memory cache so all instances update instantly
let cachedProfile: Profile = { name: '', bio: '', image_url: '' };
const listeners = new Set<() => void>();

function notifyAll() { listeners.forEach((fn) => fn()); }

export async function loadProfile(): Promise<Profile> {
  try {
    const res = await fetch('/api/profile', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      cachedProfile = data;
      notifyAll();
      return data;
    }
  } catch {}
  return cachedProfile;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [profile, setProfile] = useState<Profile>(cachedProfile);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load profile on mount
  useEffect(() => { loadProfile().then(setProfile); }, []);

  // Re-render whenever another component saves the profile
  useEffect(() => {
    const handler = () => setProfile({ ...cachedProfile });
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

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
  const isSettings = pathname?.startsWith('/settings');
  const displayName = profile.name || 'Personal HQ';
  const initial = displayName[0]?.toUpperCase() || 'P';

  return (
    <MonthProvider>
      {isMobile && mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`sidebar${isExpanded ? ' expanded' : ''}`}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
      >
        {/* ── Brand / profile ── */}
        <div className="sidebar-top">
          <div className="sidebar-brand">
            {/* Avatar circle */}
            <div className="brand-icon" style={{
              background: profile.image_url
                ? 'transparent'
                : 'linear-gradient(135deg, var(--teal), var(--violet))',
              padding: 0, overflow: 'hidden',
            }}>
              {profile.image_url
                ? <img src={profile.image_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', color: '#fff' }}>{initial}</span>
              }
            </div>

            {/* Name — replaces the hardcoded "Personal HQ / Delon's tracker" */}
            <div className="brand-text">
              <div className="brand-name">{displayName}</div>
              {profile.bio && (
                <div className="brand-sub" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile.bio}
                </div>
              )}
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
                accent={MODULE_ACCENTS[module.slug]}
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

          <Link href="/settings" className={`nav-link${isSettings ? ' active' : ''}`} style={{ marginTop: 2 }}>
            <span className="nav-icon">
              <Settings size={20} strokeWidth={1.8} />
            </span>
            <span className="nav-text">Settings</span>
          </Link>
        </div>
      </aside>

      <div className="app-root">
        {isMobile && (
          <div className="mobile-topbar">
            <div className="mobile-brand">
              <div className="brand-icon" style={{ width: 28, height: 28, fontSize: 12, borderRadius: 8, padding: 0, overflow: 'hidden' }}>
                {profile.image_url
                  ? <img src={profile.image_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initial
                }
              </div>
              {displayName}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={toggleTheme} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

function NavItem({ href, active, icon, label, accent }: { href: string; active: boolean; icon: React.ReactNode; label: string; accent?: string }) {
  const color = accent ?? 'var(--teal)';
  return (
    <Link
      href={href}
      className={`nav-link${active ? ' active' : ''}`}
      style={active ? {
        background: `${color}18`,
        color: color,
      } : undefined}
    >
      {active && (
        <span style={{
          position: 'absolute', left: 0, top: '20%', height: '60%',
          width: 3, background: color, borderRadius: '0 3px 3px 0',
        }} />
      )}
      <span className="nav-icon">{icon}</span>
      <span className="nav-text">{label}</span>
    </Link>
  );
}