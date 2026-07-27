import { useState, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { HourlySample } from '../lib/types';

interface ItemTimelineProps {
  samples: HourlySample[];
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

function formatHour(hour: string): string {
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
    <div className="rounded-xl border border-border bg-card/95 p-3 text-sm shadow-xl backdrop-blur">
      <p className="mb-1 text-muted-foreground">{label}</p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="flex-1 text-card-foreground">{item.name}</span>
          <span className="font-mono text-card-foreground">{item.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function ItemTimeline({ samples }: ItemTimelineProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>(() => {
    if (samples.length === 0) return [];
    const last = samples[samples.length - 1];
    return last.top.slice(0, 5).map((t) => t.item);
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [draftSelection, setDraftSelection] = useState<string[]>([]);

  // All unique items across all samples
  const allItems = useMemo(() => {
    const seen = new Set<string>();
    for (const s of samples) {
      for (const t of s.top) {
        seen.add(t.item);
      }
    }
    return [...seen].sort();
  }, [samples]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return q ? allItems.filter((item) => item.toLowerCase().includes(q)) : allItems;
  }, [allItems, searchQuery]);

  const chartData = useMemo(() => {
    return samples.map((s) => {
      const point: Record<string, string | number> = {
        hour: formatHour(s.hour),
      };
      for (const t of s.top) {
        if (selectedItems.includes(t.item)) {
          point[t.item] = t.qty;
        }
      }
      return point;
    });
  }, [samples, selectedItems]);

  const openModal = useCallback(() => {
    setDraftSelection([...selectedItems]);
    setSearchQuery('');
    setModalOpen(true);
  }, [selectedItems]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const applySelection = useCallback(() => {
    setSelectedItems([...draftSelection]);
    setModalOpen(false);
  }, [draftSelection]);

  const resetSelection = useCallback(() => {
    if (samples.length === 0) {
      setDraftSelection([]);
      return;
    }
    const last = samples[samples.length - 1];
    setDraftSelection(last.top.slice(0, 5).map((t) => t.item));
  }, [samples]);

  const toggleDraftItem = useCallback((item: string) => {
    setDraftSelection((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }, []);

  const removeSelectedItem = useCallback((item: string) => {
    setSelectedItems((prev) => prev.filter((i) => i !== item));
  }, []);

  if (samples.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        No timeline data
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius)] border border-border bg-card p-6 animate-fade-in">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-chart-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 17l6-6 4 4 8-8m0 0h-6m6 0v6"
            />
          </svg>
          <h2 className="text-base font-semibold text-card-foreground">アイテム推移</h2>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-input rounded-lg bg-card hover:bg-accent cursor-pointer"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          アイテムを選択
        </button>
      </div>

      {/* Selected item chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {selectedItems.map((item, i) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground border border-border"
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            {item}
            <button
              onClick={() => removeSelectedItem(item)}
              className="ml-0.5 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-muted cursor-pointer"
              aria-label={`Remove ${item}`}
            >
              <svg
                className="w-2.5 h-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        {selectedItems.length === 0 && (
          <span className="text-xs text-muted-foreground">アイテムが選択されていません</span>
        )}
      </div>

      {/* Chart */}
      <div className="h-[480px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              label={{
                value: 'Quantity',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12, fill: 'hsl(var(--muted-foreground))' },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            {selectedItems.map((item, i) => (
              <Line
                key={item}
                type="monotone"
                dataKey={item}
                name={item}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Modal overlay */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={closeModal}
        >
          <div
            className="bg-card border border-border rounded-[var(--radius)] w-full max-w-lg max-h-[70vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-base font-semibold text-card-foreground">
                グラフのアイテムを選択
              </h3>
              <button
                onClick={closeModal}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-accent cursor-pointer"
                aria-label="Close"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search input */}
            <div className="px-4 pt-3">
              <input
                type="search"
                placeholder="アイテム名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Item checkboxes */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  アイテムが見つかりません
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredItems.map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-accent cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={draftSelection.includes(item)}
                        onChange={() => toggleDraftItem(item)}
                        className="w-4 h-4 rounded border-input bg-background accent-chart-1 cursor-pointer"
                      />
                      <span className="text-sm text-card-foreground">{item}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-2 p-3 border-t border-border">
              <button
                onClick={resetSelection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-input bg-card hover:bg-accent cursor-pointer"
              >
                デフォルトに戻す
              </button>
              <button
                onClick={applySelection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
              >
                適用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}