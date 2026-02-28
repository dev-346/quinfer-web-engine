
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';

const fullScreenRoutes = ['/quiz/take', '/quiz/join', '/about', '/insights/google-forms', '/activation'];

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreenRoute = fullScreenRoutes.some(route =>
    pathname.startsWith(route)
  );

  const [openMenu, setOpenMenu] = useState<null | 'window' | 'view' | 'help'>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // ✅ close popup when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Determine if we are running in an Electron environment
  const isElectron = typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined';

  // If we are on the web or a full-screen route, skip the Electron shell
  if (isFullScreenRoute || !isElectron) {
    return <div className="h-screen w-full overflow-y-auto">{children}</div>;
  }

  return (
    <>
      {/* ================= TITLE BAR (ELECTRON ONLY) ================= */}
      <div className="titlebar">
        <div className="app-left" ref={menuRef}>

          {/* WINDOW */}
          <div className="menu-wrapper">
            <button onClick={() => setOpenMenu(openMenu === 'window' ? null : 'window')}>
              Window
            </button>

            {openMenu === 'window' && (
              <div className="menu-dropdown">
                <div onClick={() => window.electronAPI.reload()}>Reload</div>
                <div onClick={() => window.electronAPI.close()}>Close</div>
              </div>
            )}
          </div>

          {/* VIEW */}
          <div className="menu-wrapper">
            <button onClick={() => setOpenMenu(openMenu === 'view' ? null : 'view')}>
              View
            </button>

            {openMenu === 'view' && (
              <div className="menu-dropdown">
                <div onClick={() => window.electronAPI.zoomReset()}>Actual Size</div>
                <div onClick={() => window.electronAPI.zoomIn()}>Zoom In</div>
                <div onClick={() => window.electronAPI.zoomOut()}>Zoom Out</div>
              </div>
            )}
          </div>

          {/* HELP */}
          <div className="menu-wrapper">
            <button onClick={() => setOpenMenu(openMenu === 'help' ? null : 'help')}>
              Help
            </button>

            {openMenu === 'help' && (
              <div className="menu-dropdown">
                <div onClick={() => window.electronAPI.openDocs()}>
                  Documentation
                </div>
                <div onClick={() => window.electronAPI.openAboutWindow()}>
                  About
                </div>
              </div>
            )}
          </div>
        </div>

        {/* WINDOW BUTTONS */}
        <div className="window-controls">
          <button onClick={() => window.electronAPI.minimize()} className="win-btn">─</button>
          <button onClick={() => window.electronAPI.maximize()} className="win-btn">☐</button>
          <button onClick={() => window.electronAPI.close()} className="win-btn close">✕</button>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="app-content">
        <AppShell>{children}</AppShell>
      </div>
    </>
  );
}
