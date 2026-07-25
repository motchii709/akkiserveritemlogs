# AKKISERVER Item Logs Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Google スプレッドシートの Minecraft鯖アイテム累計ログを、GitHub Actions + Cloudflare Pages で定期的に可視化する静的ダッシュボードを構築する。

**Architecture:** 
- **データソース:** Google スプレッドシート (gid=1343922629, 5884行, 228MB)
- **中継:** Google Apps Script Web App → 1h 粒度ダウンサンプル JSON
- **ビルド:** GitHub Actions (1h cron) → GAS API fetch → Astro + React + shadcn/ui ビルド
- **ホスティング:** Cloudflare Pages (静的配信)
- **配信:** `/latest/index.html` = 最新, `/YYYY-MM-DD/HH-mm/index.html` = 過去スナップショット

**Tech Stack:**
- Google Apps Script (ContentService JSON API)
- Astro + React + shadcn/ui + Tailwind CSS
- Recharts (グラフ描画)
- GitHub Actions (cron + static site deploy)
- Cloudflare Pages

**CSV構造 (確認済):**
```
timestamp,status_code,unique_items,total_qty,top5_items,raw_json,note
2026/07/03 23:01:58,,,,,,FETCH_FAILED: Timeout...
2026/07/03 23:06:58,200,330,27824,"minecraft:...:1533,...","{""minecraft"":1533,...}", ""
```
- 成功行: 7列 (timestamp=JST, status_code=200, unique_items, total_qty, top5_string, raw_json=全アイテム累計JSON, note空)
- 失敗行: status_code="" または 500, raw_json 未設定, note にエラーメッセージ
- 累計値 (毎回のスナップショットが全アイテムを含む)

---

### Task 1: GAS Web App のセットアップ

**Files:**
- Create: `scripts/gas/Code.gs` (既に作成済)
- Create: `scripts/gas/appsscript.json` (GASプロジェクト設定)
- Create: `docs/gas-setup.md` (セットアップ手順書)

- [ ] **Step 1: appsscript.json を作成**

```json
{
  "timeZone": "Asia/Tokyo",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "access": "ANYONE",
    "executeAs": "USER_ACCESSING"
  }
}
```

- [ ] **Step 2: セットアップ手順書を作成**

docs/gas-setup.md:
1. Google Drive → 新しい Google Apps Script プロジェクト
2. Code.gs にスクリプトをコピペ
3. アカウントにスプレッドシートの読み取り権限を付与
4. 「デプロイ」→「新しいデプロイ」→ ウェブアプリ → 全員がアクセス可
5. URL をメモ → GitHub Secrets に `GAS_ENDPOINT` として保存

- [ ] **Step 3: コミット**

---

### Task 2: Astro プロジェクト初期化

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `src/layouts/Layout.astro`
- Create: `src/pages/index.astro`
- Create: `src/pages/latest/index.astro`
- Create: `src/pages/[date]/[time]/index.astro`
- Create: `src/components/` (react components)
- Create: `tailwind.config.ts`

- [ ] **Step 1: npm init + 依存関係インストール**

```bash
cd /home/moti/ドキュメント/akkiserveritemlogs
npm init -y
npm install astro @astrojs/react react react-dom recharts
npm install -D tailwindcss @tailwindcss/vite typescript @types/react
```

- [ ] **Step 2: astro.config.mjs を作成**

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 3: tailwind.config.ts を作成**
- [ ] **Step 4: Layout.astro を作成**
- [ ] **Step 5: index.astro を作成 (redirect to /latest)**
- [ ] **Step 6: コミット**

---

### Task 3: API フェッチャ + データ変換

**Files:**
- Create: `src/lib/api.ts` (GAS fetch + cache)
- Create: `src/lib/types.ts` (型定義)
- Create: `src/lib/transform.ts` (ダウンサンプル, topN, モジュール集計)
- Create: `tests/api.test.ts`
- Create: `tests/transform.test.ts`

- [ ] **Step 1: types.ts を作成**

```ts
export interface HourlySample {
  ts: string;
  hour: string;
  epochMs: number;
  unique: number;
  total: number;
  top: Array<{ item: string; qty: number }>;
  modules: Record<string, number>;
}

export interface ApiResponse {
  schema: number;
  generatedAt: string;
  granularity: string;
  since: string | null;
  count: number;
  samples: HourlySample[];
}
```

- [ ] **Step 2: transform.ts の テストを書く (TDD)**
- [ ] **Step 3: transform.ts を 実装**
- [ ] **Step 4: api.ts の テストを書く (TDD)**
- [ ] **Step 5: api.ts を 実装**
- [ ] **Step 6: テスト実行 → 全パス確認**
- [ ] **Step 7: コミット**

---

### Task 4: ダッシュボード UI (shadcn/ui + Recharts)

**Files:**
- Create: `src/components/Dashboard.tsx`
- Create: `src/components/ItemTimeline.tsx` (時系列グラフ)
- Create: `src/components/ModuleHeatmap.tsx` (モジュール別ヒートマップ)
- Create: `src/components/LatestSnapshot.tsx` (最新サマリー)
- Create: `src/components/StatusBadge.tsx` (鯖状態バッジ)

- [ ] **Step 1: Dashboard.tsx を作成 (メインコンテナ)**
- [ ] **Step 2: ItemTimeline.tsx を作成 (Recharts LineChart)**
- [ ] **Step 3: ModuleHeatmap.tsx を作成 (Recharts BarChart)**
- [ ] **Step 4: LatestSnapshot.tsx を作成 (最新値カード)**
- [ ] **Step 5: StatusBadge.tsx を作成**
- [ ] **Step 6: index.astro に ダッシュボード埋め込み**
- [ ] **Step 7: `npm run build` で確認**
- [ ] **Step 8: コミット**

---

### Task 5: 動的ルーティング (/latest + /YYYY-MM-DD/HH-mm/)

**Files:**
- Modify: `src/pages/latest/index.astro`
- Create: `src/pages/[date]/[time]/index.astro` (動的ルート)
- Create: `src/lib/snapshots.ts` (スナップショット一覧取得)

- [ ] **Step 1: snapshots.ts を作成 (ビルド時に API fetch)**
- [ ] **Step 2: [date]/[time]/index.astro を作成**
- [ ] **Step 3: latest/index.astro を最新スナップショットに接続**
- [ ] **Step 4: `npm run build` で確認**
- [ ] **Step 5: コミット**

---

### Task 6: GitHub Actions ワークフロー

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `.github/workflows/cron.yml` (1h 定期実行)

- [ ] **Step 1: deploy.yml を作成**

```yaml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=akki-server-logs
```

- [ ] **Step 2: cron.yml を作成 (1h 定期)**
- [ ] **Step 3: コミット**

---

### Task 7: テスト + 検証

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/api.test.ts` (完了済)
- Create: `tests/transform.test.ts` (完了済)
- Create: `tests/components.test.tsx`

- [ ] **Step 1: vitest.config.ts を作成**
- [ ] **Step 2: 全テスト実行 → 0 failures 確認**
- [ ] **Step 3: `npm run build` → dist/ に静的ファイル生成確認**
- [ ] **Step 4: コミット**

---

### Task 8: ローカル動作確認

- [ ] **Step 1: `npm run dev` で ダッシュボード確認**
- [ ] **Step 2: /latest の ルーティング確認**
- [ ] **Step 3: /2026-07-24/20-46/ の ルーティング確認**
- [ ] **Step 4: `npm run build` → dist/ の ファイル構成確認**
- [ ] **Step 5: 完了報告**

---

## 実行オプション

**1. Subagent-Driven (推奨)** — 各タスクをサブエージェントに委任、タスク間レビューあり
**2. Inline Execution** — このセッション内で順番に実行

どちらで進める?
