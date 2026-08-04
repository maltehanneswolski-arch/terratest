import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { AnimatedThemeToggle } from '@/components/ui/animated-theme-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/',                  label: 'Home',              icon: 'ri-home-5-line',           accent: '#101820' },
  { href: '/game',              label: 'PopStack',          icon: 'ri-stack-line',            accent: '#ef4444' },
  { href: '/border-domino',     label: 'Border Domino',     icon: 'ri-map-2-line',            accent: '#16a34a' },
  { href: '/blind-ranking',     label: 'Blind Ranking',     icon: 'ri-layout-column-line',    accent: '#eab308' },
  { href: '/compass-quest',     label: 'Compass Quest',     icon: 'ri-navigation-line',       accent: '#e11d48' },
  { href: '/country-detective', label: 'Country Detective', icon: 'ri-spy-line',              accent: '#0891b2' },
  { href: '/borderline',        label: 'Borderline',        icon: 'ri-route-line',            accent: '#7c3aed' },
  { href: '/world-order',       label: 'World Order',       icon: 'ri-bar-chart-line',        accent: '#9333ea' },
  { type: 'divider' as const },
  { href: '/compass',           label: 'Dream Country',     icon: 'ri-compass-3-line',        accent: '#f43f5e' },
  { href: '/latitude-ladder',   label: 'Latitude Ladder',   icon: 'ri-sort-asc',              accent: '#eab308' },
  { href: '/elevation',         label: 'Elevation',         icon: 'ri-arrow-up-down-line',    accent: '#ea580c' },
  { href: '/daily-quiz',        label: 'Capital Clash',     icon: 'ri-trophy-line',           accent: '#eab308' },
  { href: '/stat-bluff',        label: 'Stat Bluff',        icon: 'ri-file-warning-line',     accent: '#c026d3' },
] as const;

type NavEntry = (typeof NAV_ITEMS)[number];

function isDivider(item: NavEntry): item is Extract<NavEntry, { type: 'divider' }> {
  return 'type' in item && item.type === 'divider';
}

function NavItem({
  href, label, icon, accent, active,
}: { href: string; label: string; icon: string; accent: string; active: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative flex shrink-0 flex-col items-center justify-center">
      <motion.a
        href={href}
        // The label lives only in the hover tooltip, which never reaches
        // keyboard or screen-reader users — so name the link directly and hide
        // the decorative glyph from the accessibility tree.
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        whileHover={{ scale: 1.2, y: -2 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
        className={cn(
          'flex h-10 w-10 items-center justify-center text-xl transition-colors duration-150',
          active ? 'opacity-100' : 'opacity-35 hover:opacity-100 focus-visible:opacity-100',
        )}
        style={hovered || active ? { color: accent } : {}}
      >
        <i className={icon} aria-hidden="true" />
      </motion.a>

      {active && (
        <span
          className="absolute -bottom-[11px] left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full"
          style={{ background: accent }}
        />
      )}

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 3, scale: 0.94 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute left-1/2 top-[calc(100%+12px)] z-[999] -translate-x-1/2 whitespace-nowrap border border-[#101820]/10 bg-[#fff8e7] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#101820] dark:border-[#fff8e7]/10 dark:bg-[#101820] dark:text-[#fff8e7]"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function GameNavbar({ currentPath }: { currentPath: string }) {
  return (
    <div className="sticky top-0 z-40 border-b border-[#101820]/8 bg-[#fff8e7]/90 backdrop-blur-md dark:border-[#fff8e7]/6 dark:bg-[#101820]/90">
      <div className="mx-auto px-4 py-3">
        <div className="flex items-center">
          {/* Balancing gutter, so the icon track sits optically centred. Dropped
              below md, where the width is needed for the icons themselves. */}
          <div className="hidden w-[80px] shrink-0 md:block" aria-hidden="true" />

          {/*
            The icon track needs ~749px. Below that it used to overflow a rigid
            row inside `overflow-x-hidden`, so six games and both toggles were
            silently cut off with no way to scroll to them. `min-w-0` lets this
            column actually shrink, and the inner track scrolls instead of
            clipping. From md up there is room for the full row, so overflow
            returns to visible and the hover tooltips are unclipped again.
          */}
          <div className="flex min-w-0 flex-1 items-center md:justify-center md:overflow-visible">
            <nav
              aria-label="Games"
              className="bauhaus-scrollbar -mb-[11px] flex w-full items-center gap-1 overflow-x-auto pb-[11px] md:w-auto md:overflow-x-visible"
            >
              {NAV_ITEMS.map((item, index) => {
                if (isDivider(item)) {
                  return (
                    <div
                      key={`divider-${index}`}
                      aria-hidden="true"
                      className="mx-2 h-7 w-px bg-[#101820]/12 dark:bg-[#fff8e7]/12"
                    />
                  );
                }

                return (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    accent={item.accent}
                    active={item.href === currentPath}
                  />
                );
              })}
            </nav>
          </div>

          {/* shrink-0 keeps the toggles on screen no matter how tight it gets */}
          <div className="flex shrink-0 items-center justify-end gap-1.5 pl-2 md:w-[80px] md:pl-0">
            <LanguageToggle />
            <AnimatedThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
