import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { BauhausBackground } from './bauhaus-background';

function GridBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
      style={{
        backgroundImage: `
          linear-gradient(to right,  rgba(16,24,32,0.055) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(16,24,32,0.055) 1px, transparent 1px)
        `,
        backgroundSize: '44px 44px',
      }}
    />
  );
}

function GridBackgroundDark() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 hidden dark:block"
      aria-hidden="true"
      style={{
        backgroundImage: `
          linear-gradient(to right,  rgba(255,248,231,0.055) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,248,231,0.055) 1px, transparent 1px)
        `,
        backgroundSize: '44px 44px',
      }}
    />
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <div className="bauhaus-shell relative min-h-screen overflow-x-hidden">
      {isHome ? (
        <BauhausBackground />
      ) : (
        <>
          <GridBackground />
          <GridBackgroundDark />
        </>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
