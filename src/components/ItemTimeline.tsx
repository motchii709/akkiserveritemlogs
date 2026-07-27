import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { HourlySample } from '../lib/types';

interface ItemTimelineProps {
  samples: HourlySample[];
}

const COLORS = [
  'rgb(59,130,246)',  // blue-500
  'rgb(16,185,129)',  // emerald-500
  'rgb(239,68,68)',   // red-500
  'rgb(245,158,11)',  // amber-500
  'rgb(139,92,246)',  // violet-500
  'rgb(6,182,212)',   // cyan-500
  'rgb(249,115,22)',  // orange-500
  'rgb(236,72,153)',  // pink-500
  'rgb(99,102,241)',  // indigo-500
  'rgb(20,184,166)',  // teal-500
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
    <div className="rounded-xl border border-gray-700/30 bg-gray-800/80 p-3 text-sm shadow-xl backdrop-blur">
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
    <div className="rounded-2xl border border-gray-200/20 bg-gray-900/10 p-6 shadow-lg backdrop-blur-sm">
      <h2 className="mb-4 text-sm font-medium tracking-wider text-gray-300">
        Item Timeline
      </h2>
      <div className="min-h-80">
        <ResponsiveContainer width="100%" height={480}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(55,65,81,0.2)" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              label={{ value: 'Quantity', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              layout="horizontal"
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
                activeDot={{ r: 4 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}