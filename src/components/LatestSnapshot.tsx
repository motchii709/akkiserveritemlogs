import { useState, useEffect } from 'react';
import type { HourlySample } from '../lib/types';

interface LatestSnapshotProps {
  sample: HourlySample;
  generatedAt: string;
}

export default function LatestSnapshot({ sample, generatedAt }: LatestSnapshotProps) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(generatedAt).getTime()) / 1000);
      if (diff < 60) setElapsed('just now');
      else if (diff < 3600) setElapsed(`${Math.floor(diff / 60)}m ago`);
      else if (diff < 86400) setElapsed(`${Math.floor(diff / 3600)}h ago`);
      else setElapsed(`${Math.floor(diff / 86400)}d ago`);
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [generatedAt]);

  const topItem = sample.top[0];
  const truncatedName =
    topItem && topItem.item.length > 20
      ? `${topItem.item.slice(0, 20)}…`
      : topItem?.item ?? '—';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Quantity */}
      <div
        className="animate-fade-in rounded-[var(--radius)] border border-border bg-card p-5 transition-shadow hover:shadow-md"
        style={{ animationDelay: '0.05s' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">総アイテム数</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">
              {sample.total.toLocaleString()}
            </p>
          </div>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-chart-3"
            style={{ background: 'hsl(var(--chart-3) / 0.12)' }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Card 2: Unique Items */}
      <div
        className="animate-fade-in rounded-[var(--radius)] border border-border bg-card p-5 transition-shadow hover:shadow-md"
        style={{ animationDelay: '0.1s' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">ユニークアイテム</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">
              {sample.unique.toLocaleString()}
            </p>
          </div>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-chart-2"
            style={{ background: 'hsl(var(--chart-2) / 0.12)' }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6h.008v.008H6V6z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Card 3: Top Item */}
      <div
        className="animate-fade-in rounded-[var(--radius)] border border-border bg-card p-5 transition-shadow hover:shadow-md"
        style={{ animationDelay: '0.15s' }}
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">トップアイテム</p>
            <p className="text-lg font-bold mt-1 truncate" title={topItem?.item}>
              {topItem ? truncatedName : '—'}
            </p>
            {topItem && (
              <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                {topItem.qty.toLocaleString()} items
              </p>
            )}
          </div>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-chart-4"
            style={{ background: 'hsl(var(--chart-4) / 0.12)' }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.042-.442a.563.563 0 00.475-.665L11.48 3.5z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Card 4: Snapshot Time */}
      <div
        className="animate-fade-in rounded-[var(--radius)] border border-border bg-card p-5 transition-shadow hover:shadow-md"
        style={{ animationDelay: '0.2s' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">スナップショット時刻</p>
            <p className="text-lg font-bold mt-1">{sample.hour}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{elapsed}</p>
          </div>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-chart-5"
            style={{ background: 'hsl(var(--chart-5) / 0.12)' }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <div className="mt-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-success-bg text-success text-[0.7rem] px-2 py-0.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            Live
          </span>
        </div>
      </div>
    </div>
  );
}