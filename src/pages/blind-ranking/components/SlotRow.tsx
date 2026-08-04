import { useDroppable } from '@dnd-kit/core';
import { MetricEntry } from '@/lib/metricData';
import { getFlagUrl } from '@/lib/countryFlags';

interface Props {
  slotIndex: number;
  entry: MetricEntry | null;
  canDrop: boolean;
  roundComplete: boolean;
  actualPosition?: number;
  points?: number;
}

const SLOT_LABELS: Record<number, string> = {
  0: 'Highest',
  1: '2nd',
  2: '3rd',
  3: '4th',
  4: 'Lowest',
};

function pointsBadge(points: number) {
  if (points === 3) return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">+3</span>;
  if (points === 2) return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">+2</span>;
  if (points === 1) return <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">+1</span>;
  return <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">+0</span>;
}

export function SlotRow({ slotIndex, entry, canDrop, roundComplete, actualPosition, points }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${slotIndex}` });

  const filled = !!entry;
  const isWrong = roundComplete && filled && actualPosition !== slotIndex;
  const isCorrect = roundComplete && filled && actualPosition === slotIndex;

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-4 rounded-2xl border-2 px-5 py-4 transition-all
        ${isOver && canDrop ? 'border-yellow-500 bg-yellow-50 dark:border-yellow-400 dark:bg-yellow-950/20 scale-[1.01]' : ''}
        ${!filled && !isOver ? 'border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900/60' : ''}
        ${filled && !roundComplete ? 'border-yellow-300 bg-yellow-50/60 dark:border-yellow-800 dark:bg-yellow-950/20' : ''}
        ${isCorrect ? 'border-emerald-400 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-950/20' : ''}
        ${isWrong ? 'border-rose-300 bg-rose-50/40 dark:border-rose-800 dark:bg-rose-950/20' : ''}
      `}
    >
      {/* Slot number */}
      <div className="flex w-14 shrink-0 flex-col items-center gap-0.5">
        <div className="text-2xl font-black text-slate-200 dark:text-slate-700">#{slotIndex + 1}</div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-600">
          {SLOT_LABELS[slotIndex]}
        </div>
      </div>

      {/* Divider */}
      <div className="h-10 w-px shrink-0 bg-slate-200 dark:bg-slate-700"></div>

      {filled && entry ? (
        <>
          <img
            src={getFlagUrl(entry.country, 80)}
            alt={`${entry.country} flag`}
            className="rounded-md object-cover shadow-sm shrink-0"
            style={{ width: 44, height: 32 }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold text-slate-900 dark:text-white">{entry.country}</div>
            {roundComplete && (
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Actual rank: <span className="font-semibold text-slate-700 dark:text-slate-300">#{(actualPosition ?? 0) + 1}</span>
              </div>
            )}
          </div>
          {roundComplete && points !== undefined && (
            <div className="shrink-0">{pointsBadge(points)}</div>
          )}
        </>
      ) : (
        <div className={`flex flex-1 items-center gap-3 ${canDrop ? 'opacity-100' : 'opacity-50'}`}>
          <i className={`ri-arrow-down-to-line text-xl ${isOver ? 'text-yellow-500' : 'text-slate-300 dark:text-slate-700'}`}></i>
          <span className="text-sm text-slate-400 dark:text-slate-600">
            {canDrop ? 'Drop here' : 'Empty slot'}
          </span>
        </div>
      )}
    </div>
  );
}
