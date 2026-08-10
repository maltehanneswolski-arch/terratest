import { useTranslation } from 'react-i18next';
import { BauhausBackground } from '@/components/ui/bauhaus-background';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { AnimatedThemeToggle } from '@/components/ui/animated-theme-toggle';

const DAILY_GAMES = [
  {
    href: '/game',
    label: 'PopStack',
    icon: 'ri-stack-line',
    accent: '#ef4444',
    descriptionKey: 'popStackDescription',
  },
  {
    href: '/border-domino',
    label: 'Border Domino',
    icon: 'ri-map-2-line',
    accent: '#16a34a',
    descriptionKey: 'borderDominoDescription',
  },
  {
    href: '/blind-ranking',
    label: 'Blind Ranking',
    icon: 'ri-layout-column-line',
    accent: '#eab308',
    descriptionKey: 'blindRankingDescription',
  },
  {
    href: '/compass-quest',
    label: 'Compass Quest',
    icon: 'ri-navigation-line',
    accent: '#e11d48',
    descriptionKey: 'compassQuestDescription',
  },
  {
    href: '/country-detective',
    label: 'Country Detective',
    icon: 'ri-spy-line',
    accent: '#0891b2',
    descriptionKey: 'countryDetectiveDescription',
  },
  {
    href: '/borderline',
    label: 'Borderline',
    icon: 'ri-route-line',
    accent: '#7c3aed',
    descriptionKey: 'borderlineDescription',
  },
  {
    href: '/world-order',
    label: 'World Order',
    icon: 'ri-bar-chart-line',
    accent: '#9333ea',
    descriptionKey: 'worldOrderDescription',
  },
] as const;

const DREAM_COUNTRY_GAME = {
  href: '/compass',
  label: 'Dream Country',
  icon: 'ri-compass-3-line',
  accent: '#f43f5e',
  descriptionKey: 'dreamCountryDescription',
};

const CASUAL_GAMES = [
  {
    href: '/latitude-ladder',
    label: 'Latitude Ladder',
    icon: 'ri-sort-asc',
    accent: '#eab308',
    descriptionKey: 'latitudeLadderDescription',
  },
  {
    href: '/elevation',
    label: 'Elevation',
    icon: 'ri-arrow-up-down-line',
    accent: '#ea580c',
    descriptionKey: 'elevationDescription',
  },
  {
    href: '/daily-quiz',
    label: 'Capital Clash',
    icon: 'ri-trophy-line',
    accent: '#eab308',
    descriptionKey: 'capitalClashDescription',
  },
  {
    href: '/stat-bluff',
    label: 'Stat Bluff',
    icon: 'ri-file-warning-line',
    accent: '#c026d3',
    descriptionKey: 'statBluffDescription',
  },
] as const;

type Game = {
  href: string;
  label: string;
  icon: string;
  accent: string;
  /** i18n key — game names stay in English (they're the brand), copy is translated. */
  descriptionKey: string;
};

function GameCard({ game }: { game: Game }) {
  const { t } = useTranslation();
  return (
    <a
      href={game.href}
      className="group relative block cursor-pointer overflow-hidden border-2 border-[#101820] bg-[#fff8e7]/80 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#101820] dark:border-white/60 dark:bg-[#1a2535]/80 dark:hover:shadow-[4px_4px_0px_rgba(255,255,255,0.45)]"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: `linear-gradient(135deg, ${game.accent}18 0%, ${game.accent}08 50%, transparent 100%)` }}
      />
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <div
            className="flex h-11 w-11 items-center justify-center text-xl transition-transform duration-200 group-hover:scale-110"
            style={{ color: game.accent }}
          >
            <i className={game.icon}></i>
          </div>
          <i className="ri-arrow-right-up-line text-lg text-[#101820]/25 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#101820] dark:text-[#fff8e7]/20 dark:group-hover:text-[#fff8e7]"></i>
        </div>
        <div className="mb-2 text-sm font-black uppercase tracking-[0.15em]" style={{ color: game.accent }}>
          {game.label}
        </div>
        <p className="text-sm leading-5 text-[#101820]/60 dark:text-[#fff8e7]/50">{t(game.descriptionKey)}</p>
      </div>
    </a>
  );
}

function FeaturedGameCard({ game }: { game: Game }) {
  const { t } = useTranslation();
  return (
    <a
      href={game.href}
      className="group relative flex cursor-pointer items-center gap-8 overflow-hidden border-2 border-[#101820] bg-[#fff8e7]/80 p-8 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#101820] dark:border-white/60 dark:bg-[#1a2535]/80 dark:hover:shadow-[4px_4px_0px_rgba(255,255,255,0.45)]"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(120deg, ${game.accent}14 0%, ${game.accent}06 45%, transparent 70%)` }}
      />
      <div className="absolute bottom-0 left-0 top-0 w-1" style={{ background: game.accent }} />
      <div
        className="relative z-10 flex h-20 w-20 flex-shrink-0 items-center justify-center text-4xl transition-transform duration-200 group-hover:scale-105"
        style={{ color: game.accent }}
      >
        <i className={game.icon}></i>
      </div>
      <div className="relative z-10 flex-1">
        <div className="mb-2 text-sm font-black uppercase tracking-[0.18em]" style={{ color: game.accent }}>
          {game.label}
        </div>
        <p className="max-w-xl text-base leading-6 text-[#101820]/60 dark:text-[#fff8e7]/50">{t(game.descriptionKey)}</p>
      </div>
      <div className="relative z-10 flex-shrink-0">
        <i className="ri-arrow-right-up-line text-2xl text-[#101820]/20 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#101820] dark:text-[#fff8e7]/20 dark:group-hover:text-[#fff8e7]"></i>
      </div>
    </a>
  );
}

function SectionHeader({
  label,
  sub,
  tag,
}: {
  label: string;
  sub: string;
  tag: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 border-2 border-[#101820] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] dark:border-[#fff8e7]/25">
          {tag}
        </div>
        <h2 className="text-3xl font-black uppercase leading-none tracking-tight">{label}</h2>
      </div>
      <p className="max-w-xs text-sm text-[#101820]/50 dark:text-[#fff8e7]/40 sm:text-right">{sub}</p>
    </div>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  return (
    <div className="relative min-h-screen bg-[#fff8e7] text-[#101820] dark:bg-[#101820] dark:text-[#fff8e7]">
      <BauhausBackground />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[#fff8e7]/60 dark:bg-[#101820]/65" />
      <div className="relative z-10">
        <div className="flex items-center justify-end gap-1 px-6 pt-5">
          <LanguageToggle />
          <AnimatedThemeToggle />
        </div>
        <div className="mx-auto max-w-[1400px] px-6 py-10">
          <div className="mb-16 text-center">
            <div className="mb-6 inline-flex items-center gap-2 border-2 border-[#101820] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] dark:border-[#fff8e7]/30">
              <i className="ri-globe-line"></i> {t('homeBadge')}
            </div>
            <h1 className="mb-4 text-7xl font-black uppercase leading-none tracking-tight">Terratest</h1>
            <p className="mx-auto max-w-xl text-lg text-[#101820]/60 dark:text-[#fff8e7]/50">
              {t('homeTagline')}
            </p>
          </div>

          <section className="mb-14">
            <SectionHeader
              tag={`◆ ${t('homeDailyTag')}`}
              label={t('homeDailyLabel')}
              sub={t('homeDailySub')}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {DAILY_GAMES.map((game) => (
                <GameCard key={game.href} game={game} />
              ))}
            </div>
          </section>

          <div className="mb-14 flex items-center gap-4">
            <div className="flex-1 border-t-2 border-[#101820]/10 dark:border-[#fff8e7]/10" />
            <span className="text-xs font-black uppercase tracking-[0.22em] text-[#101820]/25 dark:text-[#fff8e7]/20">
              &#9670;
            </span>
            <div className="flex-1 border-t-2 border-[#101820]/10 dark:border-[#fff8e7]/10" />
          </div>

          <section className="mb-16">
            <SectionHeader
              tag={`◆ ${t('homeCasualTag')}`}
              label={t('homeCasualLabel')}
              sub={t('homeCasualSub')}
            />
            <div className="mb-4">
              <FeaturedGameCard game={DREAM_COUNTRY_GAME} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {CASUAL_GAMES.map((game) => (
                <GameCard key={game.href} game={game} />
              ))}
            </div>
          </section>

          <div className="border-t-2 border-[#101820]/10 pt-8 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#101820]/30 dark:border-[#fff8e7]/10 dark:text-[#fff8e7]/25">
            {t('homeFooter', { total: DAILY_GAMES.length + CASUAL_GAMES.length + 1 })}
          </div>
        </div>
      </div>
    </div>
  );
}