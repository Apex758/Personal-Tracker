'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { modules } from '@/lib/modules';
import { Dumbbell } from 'lucide-react';
import { MonthProvider } from '@/lib/month-context';
import {
  LayoutDashboard,
  Wallet,
  Leaf,
  Target,
  Briefcase,
  Plane,
  Star,
  ShoppingCart,
  Menu,
  X,
  Sun,
  Moon,
  ChefHat,
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

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
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

          <div className="sidebar-status">
            <span className="status-dot" />
            <span className="status-text">Vercel + Supabase</span>
          </div>
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
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
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