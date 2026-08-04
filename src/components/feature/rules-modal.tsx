import { useEffect } from 'react';

export type ScoreRow = {
  pts: string;
  label: string;
  sub?: string;
  color: 'green' | 'yellow' | 'orange' | 'red' | 'purple' | 'cyan' | 'rose' | 'sky' | 'amber';
};

export type RuleItem = {
  icon: string;
  text: string;
};

export type AccentName =
  | 'cyan' | 'rose' | 'orange' | 'red' | 'fuchsia'
  | 'emerald' | 'amber' | 'purple' | 'violet' | 'teal';

export type RulesModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: string;
  iconGradient: string;
  description: string;
  rules?: RuleItem[];
  scoring?: ScoreRow[];
  tip?: string;
  ctaLabel?: string;
  /**
   * @deprecated No longer applied — the CTA uses a solid ink/paper pair so it
   * survives the `background-image: none` override in index.css. Still accepted
   * so the ten existing call sites keep compiling.
   */
  ctaGradient?: string;
  accent?: AccentName;
};

const COLOR_MAP: Record<ScoreRow['color'], { bg: string; text: string; border: string }> = {
  green:  { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  yellow: { bg: 'bg-amber-50 dark:bg-amber-950/30',     text: 'text-amber-700 dark:text-amber-400',     border: 'border-amber-200 dark:border-amber-800'   },
  orange: { bg: 'bg-orange-50 dark:bg-orange-950/30',   text: 'text-orange-700 dark:text-orange-400',   border: 'border-orange-200 dark:border-orange-800' },
  red:    { bg: 'bg-rose-50 dark:bg-rose-950/30',       text: 'text-rose-700 dark:text-rose-400',       border: 'border-rose-200 dark:border-rose-800'     },
  purple: { bg: 'bg-violet-50 dark:bg-violet-950/30',   text: 'text-violet-700 dark:text-violet-400',   border: 'border-violet-200 dark:border-violet-800' },
  cyan:   { bg: 'bg-cyan-50 dark:bg-cyan-950/30',       text: 'text-cyan-700 dark:text-cyan-400',       border: 'border-cyan-200 dark:border-cyan-800'     },
  rose:   { bg: 'bg-rose-50 dark:bg-rose-950/30',       text: 'text-rose-700 dark:text-rose-400',       border: 'border-rose-200 dark:border-rose-800'     },
  sky:    { bg: 'bg-sky-50 dark:bg-sky-950/30',         text: 'text-sky-700 dark:text-sky-400',         border: 'border-sky-200 dark:border-sky-800'       },
  amber:  { bg: 'bg-amber-50 dark:bg-amber-950/30',     text: 'text-amber-700 dark:text-amber-400',     border: 'border-amber-200 dark:border-amber-800'   },
};

type AccentStyle = {
  ruleBg: string;
  ruleIcon: string;
  ruleBorder: string;
  tipBg: string;
  tipBorder: string;
  tipLabel: string;
  titleText: string;
};

const ACCENT_MAP: Record<AccentName, AccentStyle> = {
  cyan:    { ruleBg: 'bg-cyan-50/70 dark:bg-cyan-950/20',     ruleIcon: 'text-cyan-600 dark:text-cyan-400',     ruleBorder: 'border border-cyan-100 dark:border-cyan-900/50',     tipBg: 'bg-cyan-50 dark:bg-cyan-950/20',     tipBorder: 'border-cyan-200 dark:border-cyan-800',     tipLabel: 'text-cyan-700 dark:text-cyan-300',    titleText: 'text-cyan-600 dark:text-cyan-400'    },
  rose:    { ruleBg: 'bg-rose-50/70 dark:bg-rose-950/20',     ruleIcon: 'text-rose-600 dark:text-rose-400',     ruleBorder: 'border border-rose-100 dark:border-rose-900/50',     tipBg: 'bg-rose-50 dark:bg-rose-950/20',     tipBorder: 'border-rose-200 dark:border-rose-800',     tipLabel: 'text-rose-700 dark:text-rose-300',    titleText: 'text-rose-600 dark:text-rose-400'    },
  orange:  { ruleBg: 'bg-orange-50/70 dark:bg-orange-950/20', ruleIcon: 'text-orange-600 dark:text-orange-400', ruleBorder: 'border border-orange-100 dark:border-orange-900/50', tipBg: 'bg-orange-50 dark:bg-orange-950/20', tipBorder: 'border-orange-200 dark:border-orange-800', tipLabel: 'text-orange-700 dark:text-orange-300', titleText: 'text-orange-600 dark:text-orange-400' },
  red:     { ruleBg: 'bg-red-50/70 dark:bg-red-950/20',       ruleIcon: 'text-red-600 dark:text-red-400',       ruleBorder: 'border border-red-100 dark:border-red-900/50',       tipBg: 'bg-red-50 dark:bg-red-950/20',       tipBorder: 'border-red-200 dark:border-red-800',       tipLabel: 'text-red-700 dark:text-red-300',      titleText: 'text-red-600 dark:text-red-400'      },
  fuchsia: { ruleBg: 'bg-fuchsia-50/70 dark:bg-fuchsia-950/20', ruleIcon: 'text-fuchsia-600 dark:text-fuchsia-400', ruleBorder: 'border border-fuchsia-100 dark:border-fuchsia-900/50', tipBg: 'bg-fuchsia-50 dark:bg-fuchsia-950/20', tipBorder: 'border-fuchsia-200 dark:border-fuchsia-800', tipLabel: 'text-fuchsia-700 dark:text-fuchsia-300', titleText: 'text-fuchsia-600 dark:text-fuchsia-400' },
  emerald: { ruleBg: 'bg-emerald-50/70 dark:bg-emerald-950/20', ruleIcon: 'text-emerald-600 dark:text-emerald-400', ruleBorder: 'border border-emerald-100 dark:border-emerald-900/50', tipBg: 'bg-emerald-50 dark:bg-emerald-950/20', tipBorder: 'border-emerald-200 dark:border-emerald-800', tipLabel: 'text-emerald-700 dark:text-emerald-300', titleText: 'text-emerald-600 dark:text-emerald-400' },
  amber:   { ruleBg: 'bg-amber-50/70 dark:bg-amber-950/20',   ruleIcon: 'text-amber-600 dark:text-amber-400',   ruleBorder: 'border border-amber-100 dark:border-amber-900/50',   tipBg: 'bg-amber-50 dark:bg-amber-950/20',   tipBorder: 'border-amber-200 dark:border-amber-800',   tipLabel: 'text-amber-700 dark:text-amber-300',  titleText: 'text-amber-600 dark:text-amber-400'  },
  purple:  { ruleBg: 'bg-violet-50/70 dark:bg-violet-950/20', ruleIcon: 'text-violet-600 dark:text-violet-400', ruleBorder: 'border border-violet-100 dark:border-violet-900/50', tipBg: 'bg-violet-50 dark:bg-violet-950/20', tipBorder: 'border-violet-200 dark:border-violet-800', tipLabel: 'text-violet-700 dark:text-violet-300', titleText: 'text-violet-600 dark:text-violet-400' },
  violet:  { ruleBg: 'bg-violet-50/70 dark:bg-violet-950/20', ruleIcon: 'text-violet-600 dark:text-violet-400', ruleBorder: 'border border-violet-100 dark:border-violet-900/50', tipBg: 'bg-violet-50 dark:bg-violet-950/20', tipBorder: 'border-violet-200 dark:border-violet-800', tipLabel: 'text-violet-700 dark:text-violet-300', titleText: 'text-violet-600 dark:text-violet-400' },
  teal:    { ruleBg: 'bg-teal-50/70 dark:bg-teal-950/20',     ruleIcon: 'text-teal-600 dark:text-teal-400',     ruleBorder: 'border border-teal-100 dark:border-teal-900/50',     tipBg: 'bg-teal-50 dark:bg-teal-950/20',     tipBorder: 'border-teal-200 dark:border-teal-800',     tipLabel: 'text-teal-700 dark:text-teal-300',    titleText: 'text-teal-600 dark:text-teal-400'    },
};

const DEFAULT_ACCENT: AccentStyle = {
  ruleBg: 'bg-slate-50 dark:bg-slate-700/50',
  ruleIcon: 'text-slate-500 dark:text-slate-400',
  ruleBorder: '',
  tipBg: 'bg-slate-100 dark:bg-slate-700/50',
  tipBorder: '',
  tipLabel: 'text-slate-600 dark:text-slate-300',
  titleText: 'text-slate-900 dark:text-white',
};

export function RulesModal({
  open,
  onClose,
  title,
  icon,
  iconGradient,
  description,
  rules = [],
  scoring = [],
  tip,
  ctaLabel = "Let's play!",
  accent,
}: RulesModalProps) {
  const accentStyle = accent ? ACCENT_MAP[accent] : DEFAULT_ACCENT;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        {/* Header */}
        <div className="flex items-start gap-4 p-7 pb-4">
          <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${iconGradient} text-white shadow-lg`}>
            <i className={`${icon} text-2xl`}></i>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className={`text-2xl font-bold ${accentStyle.titleText}`}>{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        <div className="px-7 pb-7 space-y-4">
          {/* Rules */}
          {rules.length > 0 && (
            <div className="space-y-2">
              {rules.map((rule, i) => (
                <div key={i} className={`flex items-start gap-3 rounded-2xl px-4 py-3 ${accentStyle.ruleBg} ${accentStyle.ruleBorder}`}>
                  <i className={`${rule.icon} text-base mt-0.5 shrink-0 ${accentStyle.ruleIcon}`}></i>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{rule.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Scoring */}
          {scoring.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 mb-2.5">Scoring</div>
              <div className="grid grid-cols-2 gap-2">
                {scoring.map((row, i) => {
                  const c = COLOR_MAP[row.color];
                  return (
                    <div key={i} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${c.bg} ${c.border}`}>
                      <span className={`text-base font-black w-9 shrink-0 ${c.text}`}>{row.pts}</span>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold leading-tight ${c.text}`}>{row.label}</div>
                        {row.sub && <div className="text-[10px] leading-tight text-slate-400 dark:text-slate-500 mt-0.5">{row.sub}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tip */}
          {tip && (
            <div className={`rounded-2xl px-4 py-3 text-sm ${accentStyle.tipBg} ${accentStyle.tipBorder ? `border ${accentStyle.tipBorder}` : ''} ${accentStyle.tipLabel}`}>
              <span className="font-semibold">💡 Tip: </span>{tip}
            </div>
          )}

          {/* CTA */}
          {/*
            Deliberately a solid ink/paper pair rather than `bg-gradient-to-r`.
            index.css forces `background-image: none !important` on gradient
            utilities inside .app-page-shell, and a Tailwind gradient is
            background-image only — so the gradient left no background at all
            and this button rendered as white text on cream (1.06:1, i.e.
            invisible) on every game that shows a rules modal.
          */}
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-[#101820] px-5 py-3 font-semibold text-[#fff8e7] shadow-lg transition hover:scale-[1.02] cursor-pointer whitespace-nowrap dark:bg-[#fff8e7] dark:text-[#101820]"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
