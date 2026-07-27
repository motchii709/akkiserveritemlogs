import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ModulePieChartProps {
  modules: Record<string, number>;
}

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#ec4899',
  '#6366f1',
  '#14b8a6',
  '#eab308',
  '#d946ef',
];

interface ChartDataItem {
  name: string;
  value: number;
  pct: number;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: ChartDataItem;
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
    <div className="rounded-xl border border-gray-700 bg-gray-800/90 px-3 py-2 text-sm shadow-xl backdrop-blur-xs">
      <p className="font-medium text-gray-200">{item.name}</p>
      <p className="font-mono text-gray-400">
        {item.value.toLocaleString()} items
      </p>
    </div>
  );
}

function renderLegendText(value: string) {
  return value.length > 30 ? `${value.slice(0, 30)}…` : value;
}

export default function ModulePieChart({ modules }: ModulePieChartProps) {
  const chartData = useMemo(() => {
    const entries = Object.entries(modules).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, qty]) => sum + qty, 0);
    if (total === 0) return [];

    const threshold = total * 0.02;
    const main: ChartDataItem[] = [];
    let otherQty = 0;

    for (const [name, value] of entries) {
      if (value >= threshold) {
        main.push({ name, value, pct: value / total });
      } else {
        otherQty += value;
      }
    }

    if (otherQty > 0) {
      main.push({ name: 'Other', value: otherQty, pct: otherQty / total });
    }

    return main;
  }, [modules]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No module data
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-800/40 bg-gray-900/30 pt-4 pb-2 px-4 shadow-lg backdrop-blur-sm">
      <h2 className="text-sm font-medium text-gray-300 tracking-wide">
        Modules
      </h2>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            label={({ name, percent }: { name?: string; percent?: number }) =>
              name && (percent ?? 0) > 0.05 ? name : ''
            }
            labelLine={false}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ fontSize: '0.75rem', color: '#9ca3af' }}
            formatter={renderLegendText}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}