import { useMemo } from 'react';
import type { HourlySample, ItemMap } from '../lib/types';
import LatestSnapshot from './LatestSnapshot';
import ItemTimeline from './ItemTimeline';
import ModulePieChart from './ModulePieChart';
import TimeSeriesChart from './TimeSeriesChart';
import ItemTable from './ItemTable';

interface DashboardProps {
  samples: HourlySample[];
  generatedAt: string;
  items: ItemMap;
}

function lastValidSample(samples: HourlySample[]): HourlySample | null {
  for (let i = samples.length - 1; i >= 0; i--) {
    if (samples[i].total > 0) return samples[i];
  }
  return null;
}

export default function Dashboard({ samples, generatedAt, items }: DashboardProps) {
  const latest = useMemo(() => lastValidSample(samples), [samples]);

  const resolvedItems = useMemo(() => {
    if (Object.keys(items).length > 0) return items;
    if (!latest) return {};
    const map: ItemMap = {};
    for (const t of latest.top) {
      map[t.item] = t.qty;
    }
    return map;
  }, [items, latest]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Row 1: 4 stat cards */}
      {latest && <LatestSnapshot sample={latest} generatedAt={generatedAt} />}

      {/* Row 2: Item timeline with selector */}
      {samples.length > 1 && <ItemTimeline samples={samples} />}

      {/* Row 3: Time series (2/3) + Module pie (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TimeSeriesChart samples={samples} />
        <ModulePieChart modules={latest?.modules || {}} />
      </div>

      {/* Row 4: Full item table */}
      {latest && Object.keys(resolvedItems).length > 0 && (
        <ItemTable sample={latest} items={resolvedItems} />
      )}
    </div>
  );
}