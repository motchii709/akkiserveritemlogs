import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { HourlySample } from '../lib/types';

interface ModuleHeatmapProps {
  samples: HourlySample[];
}

const BAR_COLORS = [
  '#60a5fa',
  '#34d399',
  '#f472b6',
  '#facc15',
  '#a78bfa',
  '#fb923c',
  '#2dd4bf',
  '#f87171',
  '#818cf8',
  '#e879f9',
  '#4ade80',
  '#fbbf24',
];

interface TooltipPayloadItem {
  value: number;
  name: string;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-sm shadow-xl">
      <p className="font-medium">{item.name}</p>
      <p className="font-mono text-gray-300">
        {item.value.toLocaleString()} items
      </p>
    </div>
  );
}

export default function ModuleHeatmap({ samples }: ModuleHeatmapProps) {
  const chartData = useMemo(() => {
    const moduleTotals = new Map<string, number>();
    for (const s of samples) {
      for (const [mod, qty] of Object.entries(s.modules)) {
        moduleTotals.set(mod, (moduleTotals.get(mod) ?? 0) + qty);
      }
    }

    return [...moduleTotals.entries()]
      .map(([module, total]) => ({ module, total }))
      .sort((a, b) => b.total - a.total);
  }, [samples]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No module data
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
      <h2 className="mb-4 text-lg font-semibold">Modules</h2>
      <div style={{ height: Math.max(200, chartData.length * 40 + 20) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis
              type="category"
              dataKey="module"
              tick={{ fontSize: 12, fill: '#d1d5db' }}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(75, 85, 99, 0.2)' }} />
            <Bar dataKey="total" radius={[0, 6, 6, 0]} maxBarSize={28}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
