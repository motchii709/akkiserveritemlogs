import { useState, useMemo } from 'react';
import type { HourlySample, ItemMap } from '../lib/types';

interface ItemTableProps {
  sample: HourlySample;
  items: ItemMap;
}

type SortKey = 'rank' | 'item' | 'qty';

export default function ItemTable({ sample, items }: ItemTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('qty');
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState('');

  const allItems = useMemo(() => {
    return Object.entries(items).map(([item, qty]) => ({ item, qty }));
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = q ? allItems.filter((it) => it.item.toLowerCase().includes(q)) : [...allItems];

    list.sort((a, b) => {
      switch (sortKey) {
        case 'item':
          return sortAsc ? a.item.localeCompare(b.item) : b.item.localeCompare(a.item);
        case 'qty':
        case 'rank':
        default:
          return sortAsc ? a.qty - b.qty : b.qty - a.qty;
      }
    });

    return list;
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
    <div className="rounded-2xl border border-gray-800/50 shadow-lg bg-gray-900/30 backdrop-blur-sm p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-300 tracking-wider">
          All Items ({allItems.length} items)
        </h2>
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg bg-gray-800/40 border-gray-700/30 px-3 py-1.5 text-sm placeholder-gray-600 text-gray-300 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/40"
        />
      </div>

      <div className="rounded-lg overflow-hidden bg-gray-900/20">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-widest text-gray-400 border-b border-gray-700/30">
              <th
                className="cursor-pointer select-none px-4 py-2 w-[48px]"
                onClick={() => handleSort('rank')}
              >
                #
                <SortIcon active={sortKey === 'rank'} asc={sortAsc} />
              </th>
              <th
                className="cursor-pointer select-none px-4 py-2"
                onClick={() => handleSort('item')}
              >
                Item Name
                <SortIcon active={sortKey === 'item'} asc={sortAsc} />
              </th>
              <th
                className="cursor-pointer select-none px-4 py-2 w-[120px] text-right"
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
                className="border-b border-gray-700/20 hover:bg-gray-700/20"
              >
                <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                <td className="px-4 py-2">{it.item}</td>
                <td className="px-4 py-2 text-right font-mono tabular-nums tracking-tighter text-gray-200">
                  {it.qty.toLocaleString()}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                  No items match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}