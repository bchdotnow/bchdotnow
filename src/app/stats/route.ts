import { connection } from "next/server";
import { kvEnabled } from "@/lib/kv";
import { reconcile, volumeStats } from "@/lib/volume";
import { visitStats } from "@/lib/visits";
import { commissionRate } from "@/lib/sideshift";

// Private stats page: https://bch.now/stats?key=STATS_KEY
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export async function GET(req: Request) {
  await connection();
  const key = process.env.STATS_KEY;
  if (!key || new URL(req.url).searchParams.get("key") !== key) return new Response("Not found", { status: 404 });
  if (!kvEnabled()) return new Response("Store not connected yet.", { status: 503 });

  await reconcile().catch(() => {});
  const days: string[] = [];
  for (let i = 0; i < 30; i++) days.push(new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10));
  const [v, w] = await Promise.all([volumeStats(), visitStats()]);
  const rate = commissionRate() ?? 0.005;
  const num = (n: number) => n.toLocaleString("en-US");
  const month = days[0].slice(0, 7);
  const monthName = new Date(`${month}-01T00:00:00Z`).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const views30 = days.reduce((t, d) => t + (w.dayViews[d] || 0), 0);
  const startedMonth = Object.entries(v.dayCreated).reduce((t, [d, n]) => t + (d.startsWith(month) ? n : 0), 0);
  const monthVisits = w.monthVisits[month] || 0;
  const maxVis = Math.max(1, ...days.map((d) => w.dayVisits[d] || 0));
  const top = (o: Record<string, number>, empty: string) =>
    Object.entries(o)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([k, n]) => `<tr><td>${esc(k)}</td><td>${num(n)}</td></tr>`)
      .join("") || `<tr><td colspan="2">${empty}</td></tr>`;
  const maxDay = Math.max(1, ...days.map((d) => v.dayUsd[d] || 0));
  const last30 = days.reduce((t, d) => t + (v.dayUsd[d] || 0), 0);
  const last30n = days.reduce((t, d) => t + (v.days[d] || 0), 0);

  const card = (label: string, value: string, sub = "") =>
    `<div class="c"><span>${label}</span><b>${value}</b>${sub ? `<i>${sub}</i>` : ""}</div>`;

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><meta name="referrer" content="no-referrer"><title>bch.now stats</title><meta http-equiv="refresh" content="60">
<style>
body{margin:0;font:15px/1.45 system-ui,sans-serif;background:#04140e;color:#e9f7f1;padding:32px}
h1{margin:0 0 4px;font-size:26px}p.m{margin:0 0 24px;color:#8fb5a6}
.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:28px}
.c{background:#0b2a1f;border-radius:14px;padding:16px}.c span{display:block;color:#8fb5a6;font-size:13px}
.c b{display:block;font-size:26px;color:#0ac18e;margin-top:4px}.c i{font-style:normal;color:#8fb5a6;font-size:12px}
h2{font-size:16px;margin:28px 0 10px}table{border-collapse:collapse;width:100%;max-width:900px}
td,th{text-align:left;padding:7px 10px;border-bottom:1px solid #123a2c;font-variant-numeric:tabular-nums}th{color:#8fb5a6;font-weight:600}
.bar{height:10px;background:#0ac18e;border-radius:3px;min-width:2px}a{color:#0ac18e}
.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;max-width:900px}
hr{border:0;border-top:1px solid #123a2c;margin:40px 0}
@media (max-width:600px){body{padding:16px}}
</style></head><body>
<h1>bch.now visitors</h1><p class="m">Plain counts kept by bch.now. Nothing about visitors is stored. Bots, and browsers that ask not to be tracked, aren't counted.</p>
<div class="g">
${card("Visits today", num(w.dayVisits[days[0]] || 0), `${num(w.dayViews[days[0]] || 0)} page views`)}
${card(`Visits in ${monthName}`, num(monthVisits), "so far this month")}
${card("Page views, 30 days", num(views30), `${num(w.views)} all time`)}
${card(`Visits with a swap in ${monthName}`, monthVisits ? `${((startedMonth / monthVisits) * 100).toFixed(1)}%` : "n/a", `${num(startedMonth)} swaps started`)}
</div>
<h2>Visits, last 30 days</h2><table><tr><th>Day</th><th>Visits</th><th>Page views</th><th></th></tr>
${days
  .map((d) => {
    const u = w.dayVisits[d] || 0;
    return `<tr><td>${d}</td><td>${num(u)}</td><td>${num(w.dayViews[d] || 0)}</td><td style="width:40%"><div class="bar" style="width:${(u / maxVis) * 100}%;opacity:${u ? 1 : 0.15}"></div></td></tr>`;
  })
  .join("")}
</table>
<div class="cols">
<div><h2>Top pages in ${monthName}</h2><table><tr><th>Page</th><th>Views</th></tr>${top(w.pages, "None yet")}</table></div>
<div><h2>Came from in ${monthName}</h2><table><tr><th>Site</th><th>Visits</th></tr>${top(w.refs, "None yet")}</table></div>
</div>
<hr>
<h1>bch.now swap volume</h1><p class="m">Completed swaps recorded by bch.now. Refreshes every minute. SideShift's own records at <a href="https://sideshift.ai/account">sideshift.ai/account</a> are the exact reference.</p>
<div class="g">
${card("Completed swaps", String(v.completed), `${v.started} started`)}
${card("Volume", usd(v.usd), `${v.bch.toFixed(4)} BCH`)}
${card("Est. commission", usd(v.usd * rate), `at ${(rate * 100).toFixed(2)}%`)}
${card("Last 30 days", usd(last30), `${last30n} swaps`)}
${card("In progress", String(v.open), `${v.expired} expired · ${v.refunded} refunded`)}
</div>
<h2>Last 30 days</h2><table><tr><th>Day</th><th>Swaps</th><th>Volume</th><th></th></tr>
${days
  .map((d) => {
    const u = v.dayUsd[d] || 0;
    return `<tr><td>${d}</td><td>${v.days[d] || 0}</td><td>${usd(u)}</td><td style="width:40%"><div class="bar" style="width:${(u / maxDay) * 100}%;opacity:${u ? 1 : 0.15}"></div></td></tr>`;
  })
  .join("")}
</table>
<h2>Pairs</h2><table><tr><th>Pair</th><th>Completed</th></tr>
${Object.entries(v.pairs)
  .sort((a, b) => b[1] - a[1])
  .map(([p, n]) => `<tr><td>${esc(p)}</td><td>${n}</td></tr>`)
  .join("") || `<tr><td colspan="2">None yet</td></tr>`}
</table>
<h2>Latest completed</h2><table><tr><th>When (UTC)</th><th>Pair</th><th>Sent</th><th>Received</th><th>USD</th></tr>
${v.recent
  .map(
    (r) =>
      `<tr><td>${esc(String(r.at).slice(0, 16).replace("T", " "))}</td><td>${esc(r.from)} to ${esc(r.to)}</td><td>${esc(r.dep)} ${esc(r.from)}</td><td>${esc(r.set)} ${esc(r.to)}</td><td>${usd(Number(r.usd))}</td></tr>`,
  )
  .join("") || `<tr><td colspan="5">None yet</td></tr>`}
</table></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
