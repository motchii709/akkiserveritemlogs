import type { HourlySample } from '../lib/types';
import LatestSnapshot from './LatestSnapshot';
import ItemTimeline from './ItemTimeline';
import ModuleHeatmap from './ModuleHeatmap';
import ItemTable from './ItemTable';

interface DashboardProps {
  samples: HourlySample[];
  generatedAt: string;
}

export default function Dashboard({ samples, generatedAt }: DashboardProps) {
  const latest = samples[samples.length - 1] ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Top: Latest snapshot */}
      {latest && (
        <LatestSnapshot sample={latest} generatedAt={generatedAt} />
      )}

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ItemTimeline samples={samples} />
        <ModuleHeatmap samples={samples} />
      </div>

      {/* Item table */}
      {latest && <ItemTable sample={latest} />}
    </div>
  );
}
