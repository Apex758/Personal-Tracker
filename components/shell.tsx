'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { modules } from '@/lib/modules';

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 820;
      setIsMobile(mobile);

      if (!mobile) {
        setMobileOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div
      className={`app-shell ${
        desktopCollapsed ? 'desktop-collapsed' : ''
      }`}
    >
      {isMobile && mobileOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${
          isMobile ? (mobileOpen ? 'open' : '') : desktopCollapsed ? 'collapsed' : ''
        }`}
      >
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <p className="eyebrow">Personal HQ</p>
            {!desktopCollapsed || isMobile ? <h1>Delon’s tracker</h1> : null}
            {!desktopCollapsed || isMobile ? (
              <p className="muted sidebar-muted">
                One place for money, habits, skills, work, travel, and lifestyle purchases.
              </p>
            ) : null}
          </div>

          {!isMobile && (
            <button
              className="menu-button"
              onClick={() => setDesktopCollapsed((prev) => !prev)}
            >
              {desktopCollapsed ? '→' : '←'}
            </button>
          )}

          {isMobile && (
            <button
              className="menu-button"
              onClick={() => setMobileOpen(false)}
            >
              ✕
            </button>
          )}
        </div>

        <nav className="nav-list">
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
            {desktopCollapsed && !isMobile ? 'D' : 'Dashboard'}
          </Link>

          {modules.map((module) => {
            const href = `/module/${module.slug}`;
            const active = pathname === href;

            return (
              <Link
                key={module.slug}
                href={href}
                className={`nav-link ${active ? 'active' : ''}`}
                onClick={() => {
                  if (isMobile) setMobileOpen(false);
                }}
              >
                {desktopCollapsed && !isMobile
                  ? module.label.charAt(0)
                  : module.label}
              </Link>
            );
          })}
        </nav>

        {(!desktopCollapsed || isMobile) && (
          <div className="card compact sidebar-card">
            <div className="badge">Recommended setup</div>
            <p className="muted small sidebar-muted">
              Host the app on Vercel and store live data in Supabase. Keep the workbook as your import template.
            </p>
          </div>
        )}
      </aside>

      <main
        className="content"
        onClick={() => {
          if (isMobile && mobileOpen) {
            setMobileOpen(false);
          }
        }}
      >
        {isMobile && (
          <div className="mobile-topbar">
            <button
              className="menu-button"
              onClick={(e) => {
                e.stopPropagation();
                setMobileOpen(true);
              }}
            >
              ☰ Menu
            </button>
          </div>
        )}

        {children}
      </main>
    </div>
  );
}