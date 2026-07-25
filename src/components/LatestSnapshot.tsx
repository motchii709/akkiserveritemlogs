import type { HourlySample } from '../lib/types';
import StatusBadge from './StatusBadge';

interface LatestSnapshotProps {
  sample: HourlySample;
  generatedAt: string;
}

export default function LatestSnapshot({ sample, generatedAt }: LatestSnapshotProps) {
  const topItems = sample.top.slice(0, 5);

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Latest Snapshot</h2>
        <StatusBadge generatedAt={generatedAt} />
      </div>

      <div className="mb-4 text-sm text-gray-400">
        {sample.hour}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-gray-800/50 p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">{sample.unique}</div>
          <div className="mt-1 text-xs text-gray-400">Unique Items</div>
        </div>
        <div className="rounded-xl bg-gray-800/50 p-4 text-center">
          <div className="text-3xl font-bold text-emerald-400">
            {sample.total.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-gray-400">Total Quantity</div>
        </div>
      </div>

      {topItems.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Top 5 Items
          </h3>
          <ul className="space-y-1.5">
            {topItems.map((item, i) => (
              <li
                key={item.item}
                className="flex items-center justify-between rounded-lg bg-gray-800/30 px-3 py-1.5 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="w-5 text-right text-xs text-gray-500">{i + 1}</span>
                  <span>{item.item}</span>
                </span>
                <span className="font-mono text-gray-300">{item.qty.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
