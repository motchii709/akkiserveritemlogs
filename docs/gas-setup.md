# GAS Web App セットアップガイド

## 1. Google Apps Script プロジェクトの作成

1. Google Drive で「新しい」→「Google Apps Script」を選択
2. プロジェクト名を `akkiserveritemlogs` に変更（必須ではないが統一のため）

## 2. Code.gs の貼り付け

1. スクリプトエディタで既存の `myFunction` を削除
2. `scripts/gas/Code.gs` の内容を丸ごと貼り付け
3. 保存（Ctrl+S / Cmd+S）

## 3. スプレッドシートのバインド

スクリプトは `PropertiesService` からスプレッドシートIDを取得する設計だが、GAS プロジェクトにシートをバインドしておくと安全。

1. スクリプトエディタ右上の「紐付けられているプロジェクトを変更」→「プロジェクトを紐付ける」
2. 対象のスプレッドシート（Minecraft アイテムログ）を選択

**スプレッドシートの要件:**
- シート GID: `1343922629`
- 列構成: timestamp (A), status_code (B), unique_items (C), total_qty (D), top5_items (E), raw_json (F), note (G)
- timestamp フォーマット: `2026/07/03 23:01:58`（JST）

**プロパティ設定（推奨）:**
スクリプトエディタで「プロジェクトの設定」→「スクリプトのプロパティ」に以下を追加:
- キー: `SPREADSHEET_ID`
- 値: スプレッドシートID（URLの `/d/` と `/edit` の間の文字列）

## 4. デプロイ（Web App として）

1. スクリプトエディタで「デプロイ」→「新しいデプロイ」
2. 種類: 「ウェブアプリ」を選択
3. 説明: `akkiserveritemlogs API`
4. **実行する関数:** `doGet`
5. **アクセスできるユーザー:** 「全員」（匿名アクセス可）
6. 「デプロイ」をクリック
7. 承認が必要な場合は「権限を確認」→Google アカウントで承認

## 5. URL の取得

デプロイ完了後、ウェブアプリの URL が表示される。
形式: `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec`

### 動作確認

```bash
# マニフェスト確認
curl -s "https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?route=manifest"

# 最新1件確認
curl -s "https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?route=latest"

# 全履歴確認（大きなレスポンスになるので注意）
curl -s "https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?route=history"

# 差分取得（指定時刻以降のみ）
curl -s "https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?route=delta&since=2026-07-20T00:00:00+09:00"
```

## 6. GitHub Secret への保存

GitHub Actions からこのエンドポイントを叩くため、リポジトリの Secret に保存する。

1. GitHub リポジトリ → Settings → Secrets and variables → Actions
2. 「New repository secret」をクリック
3. 名前: `GAS_ENDPOINT`
4. 値: 上記で取得した URL
5. 「Add secret」

## 7. トラブルシューティング

### エラー: "sheet gid 1343922629 not found"
- スプレッドシートに GID `1343922629` のシートが存在することを確認

### エラー: "no spreadsheet accessible"
- プロジェクトにスプレッドシートがバインドされていない
- または `SPREADSHEET_ID` プロパティが設定されていない

### レスポンスが大きすぎる
- `route=delta&since=<ISO8601>` を使って差分のみ取得
- GAS の ContentService は 50MB 上限

### CORS エラー
- GAS Web App はデフォルトで CORS ヘッダーを返す
- ブラウザからの直接アクセスは動作するが、GitHub Actions からは問題なし
