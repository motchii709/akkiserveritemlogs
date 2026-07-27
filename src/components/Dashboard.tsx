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

export default function Dashboard({ samples, generatedAt, items }: DashboardProps) {
  const latest = samples[samples.length - 1] ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Latest snapshot — compact top card */}
      {latest && (
        <LatestSnapshot sample={latest} generatedAt={generatedAt} />
      )}

      {/* Full-width item timeline */}
      {samples.length > 1 && (
        <ItemTimeline samples={samples} />
      )}

      {/* Module pie chart */}
      {latest && (
        <ModulePieChart modules={latest.modules} />
      )}

      {/* Full item list */}
      {latest && Object.keys(items).length > 0 && (
        <ItemTable sample={latest} items={items} />
      )}
    </div>
  );
}