import { useDraggable } from '@dnd-kit/core';
import { MetricEntry } from '@/lib/metricData';
import { getFlagUrl } from '@/lib/countryFlags';

interface Props {
  entry: MetricEntry;
  isDone: boolean;
  isOverlay?: boolean;
}

function CardContent({ entry }: { entry: MetricEntry }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-50 dark:bg-yellow-950/30">
        <img
          src={getFlagUrl(entry.country, 80)}
          alt={`${entry.country} flag`}
          className="rounded-md object-cover shadow-sm"
          style={{ width: 44, height: 32 }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-600 dark:text-yellow-400">
          Drag to a slot
        </div>
        <div className="mt-0.5 truncate text-xl font-bold text-slate-900 dark:text-white">
          {entry.country}
        </div>
      </div>
      <i className="ri-drag-move-2-line text-xl text-slate-400 dark:text-slate-500"></i>
    </div>
  );
}

export function DraggableCountry({ entry, isDone, isOverlay = false }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: 'current-country',
    disabled: isDone || isOverlay,
  });

  // Overlay version: floating card with strong shadow, no transform needed
  if (isOverlay) {
    return (
      <div
        className="select-none rounded-2xl border-2 border-yellow-500 bg-white p-4 shadow-2xl dark:bg-slate-800 dark:border-yellow-400"
        style={{ cursor: 'grabbing' }}
      >
        <CardContent entry={entry} />
      </div>
    );
  }

  const transformStr = transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : undefined;

  const style = {
    transform: transformStr,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`select-none rounded-2xl border-2 p-4
        ${isDragging
          // Ghost placeholder — no transition so it snaps instantly
          ? 'border-dashed border-yellow-300 bg-yellow-50/40 opacity-40 dark:border-yellow-700 dark:bg-yellow-950/10'
          : 'border-yellow-300 bg-white shadow-md hover:shadow-lg transition-shadow dark:border-yellow-700 dark:bg-slate-800'
        }
      `}
    >
      <CardContent entry={entry} />
    </div>
  );
}