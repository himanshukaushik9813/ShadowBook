'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import AppSidebar, { AppMobileBar } from '../../components/app/AppSidebar';
import AppWorkspaceHeader from '../../components/app/AppWorkspaceHeader';
import { AppWorkspaceProvider } from '../../components/app/AppWorkspaceContext';

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = mobileSidebarOpen ? 'hidden' : previousOverflow || '';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSidebarOpen]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  return (
    <AppWorkspaceProvider>
      <div className="min-h-screen bg-[#050505] text-white">
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,9,8,0.08),rgba(5,5,5,0))]" />
          <div className="sb-grid-bg opacity-[0.035]" />
        </div>

        <AppSidebar
          mobileOpen={mobileSidebarOpen}
          onNavigate={() => setMobileSidebarOpen(false)}
          onClose={() => setMobileSidebarOpen(false)}
        />

        <main className="min-h-screen lg:ml-[260px]">
          <div className="mx-auto w-full max-w-[1400px] px-6 py-6 space-y-6">
            <div className="relative z-[2] min-w-0 space-y-6">
              <AppMobileBar onOpenMenu={() => setMobileSidebarOpen(true)} />
              <AppWorkspaceHeader />
              {children}
            </div>
          </div>
        </main>
      </div>
    </AppWorkspaceProvider>
  );
}
