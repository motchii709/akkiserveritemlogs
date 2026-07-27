import { useState, useEffect } from 'react';
import type { HourlySample } from '../lib/types';

interface LatestSnapshotProps {
  sample: HourlySample;
  generatedAt: string;
}

function formatElapsed(generatedAt: string): string {
  const diffMs = Date.now() - new Date(generatedAt).getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

export default function LatestSnapshot({ sample, generatedAt }: LatestSnapshotProps) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    function update() {
      setElapsed(formatElapsed(generatedAt));
    }
    update();
    const t = setInterval(update, 10_000);
    return () => clearInterval(t);
  }, [generatedAt]);

  const topItems = sample.top.slice(0, 5);

  return (
    <div className="animate-fade-in rounded-2xl border border-gray-200/20 bg-gradient-to-b from-gray-800/20 to-gray-900/20 shadow-md backdrop-blur">
      {/* Top row: snapshot info + live indicator */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <p className="text-sm text-gray-300">
          A snapshot from{' '}
          <span className="font-semibold text-white">{sample.hour}</span>
          {' — '}
          <span className="text-gray-400">{elapsed}</span>
        </p>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium tracking-wider text-gray-400">Live</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 px-6 pb-5">
        <div className="rounded-xl bg-gray-800/30 px-4 py-4 text-center">
          <div className="text-3xl font-bold tabular-nums text-blue-500">
            {sample.unique.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-gray-400">Unique Items</div>
        </div>
        <div className="rounded-xl bg-gray-800/30 px-4 py-4 text-center">
          <div className="text-3xl font-bold tabular-nums text-emerald-500">
            {sample.total.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-gray-400">Total Quantity</div>
        </div>
      </div>

      {/* Top 5 items */}
      {topItems.length > 0 && (
        <div className="space-y-1.5 px-6 pb-5">
          {topItems.map((item, i) => (
            <div
              key={item.item}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-600/20 bg-gray-600/10 px-3 py-1.5 text-sm"
            >
              <span className="w-5 text-right text-xs text-gray-500">{i + 1}</span>
              <span className="truncate">
                {item.item.length > 25 ? `${item.item.slice(0, 25)}…` : item.item}
              </span>
              <span className="ml-auto font-mono tabular-nums text-gray-300">
                {item.qty.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}