import { useMemo } from 'react';
import type { HourlySample, ItemMap } from '../lib/types';
import LatestSnapshot from './LatestSnapshot';
import ItemTimeline from './ItemTimeline';
import ModulePieChart from './ModulePieChart';
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

  // Build items map from latest's top if real items map is empty
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
    <div className="mx-auto max-w-6xl space-y-8">
      {latest && (
        <LatestSnapshot sample={latest} generatedAt={generatedAt} />
      )}

      {samples.length > 1 && (
        <ItemTimeline samples={samples} />
      )}

      {latest && (
        <ModulePieChart modules={latest.modules} />
      )}

      {latest && Object.keys(resolvedItems).length > 0 && (
        <ItemTable sample={latest} items={resolvedItems} />
      )}
    </div>
  );
}