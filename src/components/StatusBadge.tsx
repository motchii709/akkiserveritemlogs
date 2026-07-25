import { useState, useEffect } from 'react';

interface StatusBadgeProps {
  generatedAt: string;
}

function getStatus(generatedAt: string): { color: string; label: string } {
  const diffMs = Date.now() - new Date(generatedAt).getTime();
  const diffH = diffMs / (1000 * 60 * 60);

  if (diffH < 2) {
    return { color: 'bg-green-500', label: 'Live' };
  }
  if (diffH < 6) {
    return { color: 'bg-yellow-500', label: 'Stale' };
  }
  return { color: 'bg-red-500', label: 'Offline' };
}

function formatRelativeTime(generatedAt: string): string {
  const diffMs = Date.now() - new Date(generatedAt).getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

export default function StatusBadge({ generatedAt }: StatusBadgeProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const { color, label } = getStatus(generatedAt);
  const relative = formatRelativeTime(generatedAt);

  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-gray-800/60 px-3 py-1.5 text-sm">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="font-medium">{label}</span>
      <span className="text-gray-400">{relative}</span>
    </div>
  );
}
