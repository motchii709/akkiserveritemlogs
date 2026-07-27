import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { HourlySample } from '../lib/types';

interface TimeSeriesChartProps {
  samples: HourlySample[];
}

function downsample(arr: HourlySample[], max: number): HourlySample[] {
  if (arr.length <= max) return arr;
  const result: HourlySample[] = [];
  const step = arr.length / max;
  for (let i = 0; i < max; i++) result.push(arr[Math.floor(i * step)]);
  if (result[result.length - 1] !== arr[arr.length - 1]) result[result.length - 1] = arr[arr.length - 1];
  return result;
}

function formatHour(hour: string): string {
  const d = new Date(hour);
  if (isNaN(d.getTime())) return hour;
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:00`;
}

type Range = 'all' | 7 | 30;

export default function TimeSeriesChart({ samples }: TimeSeriesChartProps) {
  const [range, setRange] = useState<Range>('all');

  const data = useMemo(() => {
    let filtered = samples;
    if (range !== 'all') {
      const cutoff = Date.now() - range * 24 * 60 * 60 * 1000;
      filtered = samples.filter(s => s.epochMs >= cutoff);
    }
    const downsampled = downsample(filtered, 150);
    return downsampled.map(s => ({ ...s, hour: formatHour(s.hour) }));
  }, [samples, range]);

  return (
    <div className="rounded-[var(--radius)] border border-border bg-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-base font-semibold text-card-foreground">在庫推移</h2>
        <div className="flex gap-1.5">
          {(['all', 7, 30] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={
                `inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  range === r
                    ? 'border-input bg-accent text-accent-foreground'
                    : 'border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`
              }
            >
              {r === 'all' ? '全期間' : `${r}日`}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              width={80}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              width={80}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
              formatter={(value: number) => [value.toLocaleString(), undefined]}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="total"
              name="総数量"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="unique"
              name="ユニークアイテム"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}