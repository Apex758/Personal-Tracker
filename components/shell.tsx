'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { modules } from '@/lib/modules';
import {
  LayoutDashboard,
  Wallet,
  Leaf,
  Target,
  Briefcase,
  Plane,
  Star,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';

const MODULE_ICONS: Record<string, LucideIcon> = {
  finance:   Wallet,
  lifestyle: Leaf,
  skills:    Target,
  work:      Briefcase,
  travel:    Plane,
  wishlist:  Star,
};

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    <>
      {isMobile && mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`sidebar${isExpanded ? ' expanded' : ''}`}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
      >
        {/* Brand */}
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

        {/* Nav */}
        <nav className="nav-section">
          <div className="nav-label">Overview</div>
          <NavItem
            href="/"
            active={pathname === '/'}
            icon={<LayoutDashboard size={20} strokeWidth={1.8} />}
            label="Dashboard"
          />

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

        {/* Footer */}
        <div className="sidebar-footer">
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
            <button className="hamburger" onClick={() => setMobileOpen(true)}>
              <Menu size={18} />
            </button>
          </div>
        )}
        <main className="content" onClick={handleMainClick}>
          {children}
        </main>
      </div>
    </>
  );
}

function NavItem({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link href={href} className={`nav-link${active ? ' active' : ''}`}>
      <span className="nav-icon">{icon}</span>
      <span className="nav-text">{label}</span>
    </Link>
  );
}