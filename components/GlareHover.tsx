'use client';

import { useEffect, useRef } from 'react';

interface GlareHoverProps {
  glareColor?: string;
  glareOpacity?: number;
  glareAngle?: number;
  glareSize?: number;
  transitionDuration?: number;
  playOnce?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

let injected = false;

function injectStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const style = document.createElement('style');
  style.textContent = `
    .gh-wrap {
      position: absolute;
      inset: 0;
      overflow: hidden;
      border-radius: inherit;
      pointer-events: none;
      z-index: 2;
    }
    .gh-wrap::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        var(--gh-angle),
        hsla(0,0%,0%,0) 60%,
        var(--gh-rgba) 70%,
        hsla(0,0%,0%,0),
        hsla(0,0%,0%,0) 100%
      );
      background-size: var(--gh-size) var(--gh-size), 100% 100%;
      background-repeat: no-repeat;
      background-position: -100% -100%, 0 0;
      transition: var(--gh-duration) ease;
    }
    .gh-active .gh-wrap::before {
      background-position: 100% 100%, 0 0;
    }
    .gh-once .gh-wrap::before {
      transition: none;
    }
    .gh-once.gh-active .gh-wrap::before {
      transition: var(--gh-duration) ease;
      background-position: 100% 100%, 0 0;
    }
  `;
  document.head.appendChild(style);
}

export function GlareHover({
  glareColor = '#ffffff',
  glareOpacity = 0.18,
  glareAngle = -30,
  glareSize = 300,
  transitionDuration = 700,
  playOnce = false,
  children,
  className = '',
  style = {},
}: GlareHoverProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectStyles();
  }, []);

  // Convert glareColor hex → rgba
  const hex = glareColor.replace('#', '');
  let rgba = glareColor;
  if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    rgba = `rgba(${r},${g},${b},${glareOpacity})`;
  } else if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    rgba = `rgba(${r},${g},${b},${glareOpacity})`;
  }

  const cssVars = {
    '--gh-angle': `${glareAngle}deg`,
    '--gh-duration': `${transitionDuration}ms`,
    '--gh-size': `${glareSize}%`,
    '--gh-rgba': rgba,
  } as React.CSSProperties;

  function handleEnter() {
    rootRef.current?.classList.add('gh-active');
  }
  function handleLeave() {
    rootRef.current?.classList.remove('gh-active');
  }

  return (
    <div
      ref={rootRef}
      className={`${playOnce ? 'gh-once' : ''} ${className}`}
      style={{ ...cssVars, ...style, position: 'relative' }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      <div className="gh-wrap" />
    </div>
  );
}
