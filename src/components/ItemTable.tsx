import { useState, useMemo } from 'react';
import type { ItemMap, HourlySample } from '../lib/types';

interface ItemTableProps {
  sample: HourlySample;
  items: ItemMap;
}

function itemColor(name: string): string {
  const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return `hsl(${colors[Math.abs(h) % colors.length]})`;
}

export default function ItemTable({ sample, items }: ItemTableProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'qty' | 'mod'>('qty');
  const [sortAsc, setSortAsc] = useState(false);

  const itemEntries = useMemo(() => {
    const entries = Object.entries(items).map(([item, qty]) => ({
      fullName: item,
      name: item.includes(':') ? item.split(':')[1] : item,
      mod: item.includes(':') ? item.split(':')[0] : 'minecraft',
      qty,
    }));
    const maxQty = entries.length > 0 ? Math.max(...entries.map(e => e.qty)) : 1;
    return entries.map(e => ({ ...e, pct: (e.qty / maxQty * 100).toFixed(1) }));
  }, [items]);

  const filtered = useMemo(() => {
    let list = [...itemEntries];
    if (search.length > 0) {
      const q = search.toLowerCase();
      list = list.filter(e => e.name.toLowerCase().includes(q) || e.mod.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sortKey === 'name') return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      if (sortKey === 'mod') return sortAsc ? a.mod.localeCompare(b.mod) : b.mod.localeCompare(a.mod);
      return sortAsc ? a.qty - b.qty : b.qty - a.qty;
    });
    return list;
  }, [itemEntries, search, sortKey, sortAsc]);

  function handleSort(key: 'name' | 'qty' | 'mod') {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  return (
    <div className="rounded-[var(--radius)] border border-border bg-card p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-base font-semibold text-card-foreground">最新在庫一覧</h2>
        <div className="relative max-w-xs w-full">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="アイテム名・MOD名で検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:border-ring outline-none transition-colors"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead>
            <tr className="bg-muted text-left">
              <th
                onClick={() => handleSort('name')}
                className="cursor-pointer select-none w-12 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                #
              </th>
              <th
                onClick={() => handleSort('name')}
                className="cursor-pointer select-none px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                アイテム名
              </th>
              <th
                onClick={() => handleSort('qty')}
                className="cursor-pointer select-none px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                数量
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                割合
              </th>
              <th className="hidden sm:table-cell px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                視覚化
              </th>
              <th
                onClick={() => handleSort('mod')}
                className="cursor-pointer select-none px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                MOD
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ent, idx) => (
              <tr key={ent.fullName} className="border-t border-border transition-colors hover:bg-muted/50">
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{idx + 1}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: itemColor(ent.name) }}
                    >
                      {ent.name.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className="text-sm font-medium text-foreground truncate max-w-[200px]"
                      title={ent.fullName}
                    >
                      {ent.name}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-sm text-foreground">
                  {ent.qty.toLocaleString()}
                </td>
                <td className="px-3 py-2.5 text-right text-sm text-muted-foreground">{ent.pct}%</td>
                <td className="hidden sm:table-cell px-3 py-2.5">
                  <div className="w-16 h-1.5 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${ent.pct}%`, background: itemColor(ent.name) }}
                    />
                  </div>
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground text-right">{ent.mod}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  該当するアイテムが見つかりません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="text-xs mt-2 tabular-nums text-muted-foreground">
        {filtered.length.toLocaleString()} 件表示 / 全 {itemEntries.length.toLocaleString()} 件
      </div>
    </div>
  );
}