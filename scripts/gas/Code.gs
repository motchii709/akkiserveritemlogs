/**
 * akki server item logs の Google Apps Script Web App
 *
 * 役割:
 *   - シート `gid=1343922629` のスナップショットログを読み、軽量 JSON を返す。
 *   - 1 時間粒度にダウンサンプル (各時刻で最後に成功したスナップショットを採用)。
 *   - GitHub Actions からこのエンドポイントを叩いて、Cloudflare Pages 用の
 *     静的サイトをビルドする。
 *
 * エンドポイント:
 *   GET /                — マニフェスト(JSON。バージョン・発行時刻)
 *   GET ?route=manifest  — 同上
 *   GET ?route=history   — 全履歴(1h 砕データ + 累計 + top20)
 *   GET ?route=delta&since=<iso8601>
 *                       — since 以降の新規 1h サマリのみ
 *   GET ?route=latest    — 最新 1 件 (軽量)
 *
 * 設定:
 *   プロジェクトにシートを 1 つバインド。シート ID はスクリプトプロパティ
 *   SPREADSHEET_ID に保存しておくと安全(なければアクティブなスプレッドシートを使う)。
 *
 * デプロイ:
 *   1. スクリプトエディタで 「デプロイ」→「新しいデプロイ」
 *   2. 種類: 「ウェブアプリ」
 *   3. 実行する関数: doGet
 *   4. アクセス: 「全員」(匿名アクセス可)
 *   5. URL が GitHub Actions の secret GAS_HISTORY_ENDPOINT に入る
 */

const SHEET_GID = 1343922629;
const SCHEMA_VERSION = 1;
const TOP_N = 20;
const HOURLY_SAMPLE = true;
const MAX_RESPONSE_BYTES = 45 * 1024 * 1024; // GAS ContentService 安全マージン(50MB上限より少し低く)

/**
 * GET リクエストのルーティング
 */
function doGet(e) {
  try {
    const route = (e && e.parameter && e.parameter.route) || 'manifest';
    let payload;
    switch (route) {
      case 'manifest':
        payload = buildManifest_();
        break;
      case 'history':
        payload = buildHistory_(null);
        break;
      case 'delta':
        payload = buildHistory_(String(e.parameter.since || ''));
        break;
      case 'latest':
        payload = buildLatest_();
        break;
      case 'latest-items':
        payload = buildLatestItems_();
        break;
      default:
        return jsonResponse({ error: 'unknown route: ' + route }, 400);
    }
    return jsonResponse(payload, 200);
  } catch (err) {
    return jsonResponse({ error: String(err && err.message ? err.message : err) }, 500);
  }
}

function jsonResponse(obj, status) {
  const text = JSON.stringify(obj);
  if (text.length > MAX_RESPONSE_BYTES) {
    return ContentService.createTextOutput(
      JSON.stringify({
        error: 'payload too large',
        bytes: text.length,
        hint: 'use route=delta with a `since` value',
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}

/**
 * シート取得
 */
function openSheet_() {
  const SPREADSHEET_ID = '1g4b8kBlH9-O-0UU8SdgARRHwjjUk2wGu6oD4IFAyeFw';
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  if (!ss) throw new Error('no spreadsheet accessible');
  const sh = ss.getSheetByName('logv2');
  if (!sh) throw new Error('sheet "logv2" not found');
  return sh;
}

/**
 * 全行を { ts, status, topItems, total, unique, error } に正規化
 * - raw_json はサーバー側でパースせず、文字列のまま保存(topItems と total は
 *   集計済みなので軽量化できる)
 * - {since} を渡すとしきい値以降の ts だけを返す
 */
function readAllRows_(sinceIso) {
  const sheet = openSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const sinceMs = sinceIso ? Date.parse(sinceIso) : NaN;
  // 列 A..F だけ取る(note/error 列は捨てる)
  const data = sheet.getRange(2, 1, lastRow - 1, 6).getDisplayValues();
  const out = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 6) continue;
    const tsStr = row[0];
    const ts = parseTimestamp_(tsStr);
    if (!ts) continue;
    if (!isNaN(sinceMs) && ts.getTime() <= sinceMs) continue;
    const status = row[1];
    const unique = toInt_(row[2]);
    const total = toInt_(row[3]);
    const top5 = row[4];
    const rawJson = row[5];
    out.push({
      ts: tsStr,
      epochMs: ts.getTime(),
      status: status,
      unique: unique,
      total: total,
      top: top5,
      raw: rawJson,
    });
  }
  return out;
}

/**
 * 1h 粒度に砕く(各 1h ブロックの最後の成功スナップショットを採用)
 * - rows を epochMs 昇順前提
 */
function downsampleHourly_(rows) {
  if (!HOURLY_SAMPLE) return rows;
  const byHour = new Map();
  for (const r of rows) {
    if (r.status !== '200') continue;
    if (!r.raw || r.raw.length < 2) continue;
    const hourKey = isoHourKey_(new Date(r.epochMs));
    if (!byHour.has(hourKey)) byHour.set(hourKey, { hourKey, samples: [] });
    byHour.get(hourKey).samples.push(r);
  }
  const out = [];
  const keys = Array.from(byHour.keys()).sort();
  for (const k of keys) {
    const bucket = byHour.get(k);
    const last = bucket.samples[bucket.samples.length - 1];
    out.push({
      ts: last.ts,
      epochMs: last.epochMs,
      hour: k,
      status: '200',
      unique: last.unique,
      total: last.total,
      snapshot: last,
    });
  }
  return out;
}

function buildManifest_() {
  const sheet = openSheet_();
  return {
    schema: SCHEMA_VERSION,
    sheet: { name: sheet.getName(), gid: SHEET_GID },
    generatedAt: new Date().toISOString(),
    sample: { granularity: 'hourly', strategy: 'last-success-per-hour', topN: TOP_N },
    routes: ['manifest', 'history', 'delta', 'latest', 'latest-items'],
  };
}

function buildLatest_() {
  const all = readAllRows_(null);
  const hourly = downsampleHourly_(all);
  if (hourly.length === 0) {
    return { schema: SCHEMA_VERSION, generatedAt: new Date().toISOString(), latest: null };
  }
  // hourly は古い→新しい順。最後のエントリが最新
  const latest = hourly[hourly.length - 1];
  const parsed = parseRawJsonSafe_(latest.snapshot.raw);
  if (!parsed) {
    return { schema: SCHEMA_VERSION, generatedAt: new Date().toISOString(), latest: null };
  }
  const top = topEntries_(parsed, TOP_N);
  const modules = sumByModule_(parsed);
  const total = sumValues_(parsed);
  const unique = Object.keys(parsed).length;
  return {
    schema: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    latest: {
      ts: latest.ts,
      hour: latest.hour,
      epochMs: latest.epochMs,
      unique: unique,
      total: total,
      top: top,
      modules: modules,
    },
  };
}

/**
 * 最新スナップショット + 全アイテムリストを返す
 * アイテムを返却するのでサイズが大きい。静的ビルド専用。
 */
function buildLatestItems_() {
  const all = readAllRows_(null);
  const hourly = downsampleHourly_(all);
  if (hourly.length === 0) {
    return { schema: SCHEMA_VERSION, generatedAt: new Date().toISOString(), latest: null, items: {} };
  }
  const latest = hourly[hourly.length - 1];
  const parsed = parseRawJsonSafe_(latest.snapshot.raw);
  if (!parsed) {
    return { schema: SCHEMA_VERSION, generatedAt: new Date().toISOString(), latest: null, items: {} };
  }
  // 全アイテムを文字列→数量のオブジェクトとして返す
  const items = {};
  for (const k of Object.keys(parsed)) {
    items[k] = Number(parsed[k]) || 0;
  }
  return {
    schema: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    latest: {
      ts: latest.ts,
      hour: latest.hour,
      epochMs: latest.epochMs,
      unique: Object.keys(parsed).length,
      total: sumValues_(parsed),
      top: topEntries_(parsed, TOP_N),
      modules: sumByModule_(parsed),
    },
    items: items,
  };
}

function buildHistory_(sinceIso) {
  const all = readAllRows_(sinceIso);
  const hourly = downsampleHourly_(all);
  const summaries = buildSampleRows_(hourly);
  return {
    schema: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    granularity: 'hourly',
    since: sinceIso || null,
    count: summaries.length,
    samples: summaries,
  };
}

/**
 * HourlySnapshot -> {ts, hour, epochMs, unique, total, top[N], modules}
 * modules: "minecraft", "create", "tfmg" などのカテゴリ別累計スタック重み
 */
function buildSampleRows_(hourlyRows) {
  // 古い→新しい順前提
  const out = [];
  for (const h of hourlyRows) {
    const parsed = parseRawJsonSafe_(h.snapshot.raw);
    if (!parsed) continue;
    const top = topEntries_(parsed, TOP_N);
    const modules = sumByModule_(parsed);
    const total = sumValues_(parsed);
    const unique = Object.keys(parsed).length;
    out.push({
      ts: h.ts,
      hour: h.hour,
      epochMs: h.epochMs,
      unique: unique,
      total: total,
      top: top,
      modules: modules,
    });
  }
  return out;
}

function parseRawJsonSafe_(text) {
  if (!text || typeof text !== 'string') return null;
  try {
    const obj = JSON.parse(text);
    if (!obj || typeof obj !== 'object') return null;
    return obj;
  } catch (_) {
    return null;
  }
}

function topEntries_(obj, n) {
  const entries = Object.entries(obj)
    .map(([k, v]) => [k, Number(v) || 0])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
  return entries.map(([k, v]) => ({ item: k, qty: v }));
}

function sumByModule_(obj) {
  const out = {};
  for (const k of Object.keys(obj)) {
    const mod = String(k).split(':')[0] || 'unknown';
    out[mod] = (out[mod] || 0) + (Number(obj[k]) || 0);
  }
  return out;
}

function sumValues_(obj) {
  let sum = 0;
  for (const k of Object.keys(obj)) sum += Number(obj[k]) || 0;
  return sum;
}

function toInt_(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseTimestamp_(s) {
  if (!s) return null;
  // "2026/07/03 23:01:58" -> Date(JST)
  const m = String(s).match(/^(\d{4})\/(\d{2})\/(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const jst = new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
    Number(m[6])
  );
  return jst;
}

function isoHourKey_(d) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  const ho = String(d.getHours()).padStart(2, '0');
  return `${y}-${mo}-${da}T${ho}:00+09:00`;
}
