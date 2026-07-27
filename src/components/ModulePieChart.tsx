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

const PIE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
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
    <div className="rounded-lg border border-border bg-card p-3 text-sm shadow-xl">
      <p className="font-medium text-card-foreground">{item.name}</p>
      <p className="font-mono text-muted-foreground">
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
      main.push({ name: 'その他', value: otherQty, pct: otherQty / total });
    }

    return main;
  }, [modules]);

  if (chartData.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-card-foreground mb-6">
          カテゴリ別シェア
        </h2>
        <div className="flex h-[360px] items-center justify-center text-muted-foreground">
          No module data
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius)] border border-border bg-card p-6">
      <h2 className="text-base font-semibold text-card-foreground mb-6">
        カテゴリ別シェア
      </h2>
      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="85%"
              label={({ name, percent }: { name?: string; percent?: number }) =>
                name && (percent ?? 0) >= 0.05 ? name : ''
              }
              labelLine={false}
            >
              {chartData.map((_, i) => (
                <Cell
                  key={i}
                  fill={PIE_COLORS[i % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              wrapperStyle={{
                fontSize: '0.75rem',
                color: 'hsl(var(--muted-foreground))',
              }}
              formatter={renderLegendText}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}