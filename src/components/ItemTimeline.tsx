import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { HourlySample } from '../lib/types';

interface ItemTimelineProps {
  samples: HourlySample[];
}

const COLORS = [
  '#60a5fa', // blue-400
  '#34d399', // emerald-400
  '#f472b6', // pink-400
  '#facc15', // yellow-400
  '#a78bfa', // violet-400
  '#fb923c', // orange-400
  '#2dd4bf', // teal-400
  '#f87171', // red-400
  '#818cf8', // indigo-400
  '#e879f9', // fuchsia-400
];

function formatHour(hour: string): string {
  // hour looks like "2026-07-25T10:00:00Z" or "2026-07-25 10:00"
  const d = new Date(hour);
  if (isNaN(d.getTime())) return hour;
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:00`;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-sm shadow-xl">
      <p className="mb-1 text-gray-400">{label}</p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="flex-1">{item.name}</span>
          <span className="font-mono">{item.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function ItemTimeline({ samples }: ItemTimelineProps) {
  // Find top items across all samples by summing quantities
  const { chartData, topItems } = useMemo(() => {
    const itemTotals = new Map<string, number>();
    for (const s of samples) {
      for (const t of s.top) {
        itemTotals.set(t.item, (itemTotals.get(t.item) ?? 0) + t.qty);
      }
    }

    const topN = [...itemTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([item]) => item);

    const chartData = samples.map((s) => {
      const point: Record<string, string | number> = {
        hour: formatHour(s.hour),
      };
      for (const t of s.top) {
        if (topN.includes(t.item)) {
          point[t.item] = t.qty;
        }
      }
      return point;
    });

    return { chartData, topItems: topN };
  }, [samples]);

  if (samples.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No timeline data
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
      <h2 className="mb-4 text-lg font-semibold">Item Timeline</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value: string) => (
                <span className="text-gray-300">{value}</span>
              )}
            />
            {topItems.map((item, i) => (
              <Line
                key={item}
                type="monotone"
                dataKey={item}
                name={item}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
