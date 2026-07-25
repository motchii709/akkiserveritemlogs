import { useState, useMemo } from 'react';
import type { HourlySample } from '../lib/types';

interface ItemTableProps {
  sample: HourlySample;
}

type SortKey = 'rank' | 'item' | 'qty';

export default function ItemTable({ sample }: ItemTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('qty');
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState('');

  const allItems = useMemo(() => {
    // Aggregate from top list; for full list we only have top items in the snapshot
    const seen = new Map<string, number>();
    for (const t of sample.top) {
      seen.set(t.item, (seen.get(t.item) ?? 0) + t.qty);
    }
    // Also include remaining from unique count if there are items not in top
    return [...seen.entries()].map(([item, qty]) => ({ item, qty }));
  }, [sample]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let items = q ? allItems.filter((it) => it.item.toLowerCase().includes(q)) : [...allItems];

    items.sort((a, b) => {
      switch (sortKey) {
        case 'item':
          return sortAsc ? a.item.localeCompare(b.item) : b.item.localeCompare(a.item);
        case 'qty':
        case 'rank':
        default:
          return sortAsc ? a.qty - b.qty : b.qty - a.qty;
      }
    });

    return items;
  }, [allItems, sortKey, sortAsc, search]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === 'item');
    }
  }

  function SortIcon({ active, asc }: { active: boolean; asc: boolean }) {
    if (!active) return <span className="ml-1 text-gray-600">&#8597;</span>;
    return (
      <span className="ml-1 text-blue-400">{asc ? '&#9650;' : '&#9660;'}</span>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Items ({allItems.length})</h2>
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left text-xs uppercase tracking-wider text-gray-500">
              <th
                className="cursor-pointer select-none px-3 py-2"
                onClick={() => handleSort('rank')}
              >
                #
                <SortIcon active={sortKey === 'rank'} asc={sortAsc} />
              </th>
              <th
                className="cursor-pointer select-none px-3 py-2"
                onClick={() => handleSort('item')}
              >
                Item Name
                <SortIcon active={sortKey === 'item'} asc={sortAsc} />
              </th>
              <th
                className="cursor-pointer select-none px-3 py-2 text-right"
                onClick={() => handleSort('qty')}
              >
                Quantity
                <SortIcon active={sortKey === 'qty'} asc={sortAsc} />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it, i) => (
              <tr
                key={it.item}
                className="border-b border-gray-800/50 hover:bg-gray-800/30"
              >
                <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                <td className="px-3 py-2">{it.item}</td>
                <td className="px-3 py-2 text-right font-mono text-gray-300">
                  {it.qty.toLocaleString()}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-gray-500">
                  No items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
