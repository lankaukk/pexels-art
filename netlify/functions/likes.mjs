// Likes for the notapipe essay's heart (EssayBar.js).
//
// POST {liked: true|false}: the heart was filled or emptied. Each one is kept
// with when it happened and roughly where from (the city and country Netlify
// reads from the visitor's connection). No IP address or other identifier is
// stored.
//
// GET ?key=<LIKES_KEY>: a private page with the count and every like. The key
// is an environment variable set in Netlify; without it, the page doesn't exist.
import { getStore } from "@netlify/blobs";

const store = () => getStore("notapipe-likes");

const escape = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const place = (e) => [e.city, e.region, e.country].filter(Boolean).join(", ") || "Unknown";

const page = (events) => {
  const count = events.reduce((n, e) => n + (e.liked ? 1 : -1), 0);
  const rows = events
    .slice()
    .reverse()
    .map(
      (e) => `<tr><td>${e.liked ? "♥ liked" : "unliked"}</td>` +
        `<td>${escape(new Date(e.at).toLocaleString("en-US", { timeZone: "America/New_York" }))}</td>` +
        `<td>${escape(place(e))}</td></tr>`
    )
    .join("");
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Likes</title>
<style>body{font:15px/1.5 system-ui,sans-serif;margin:2rem auto;max-width:40rem;padding:0 1rem;color:#1a1a1a}
h1{font-size:2.5rem;margin:0}p{color:#6b6b6b;margin:.25rem 0 2rem}table{width:100%;border-collapse:collapse}
td{padding:.5rem .25rem;border-top:1px solid #e5e5e5;vertical-align:top}td:first-child{white-space:nowrap;color:#e8577e}</style>
<h1>♥ ${count}</h1><p>likes on Ceci n’est pas une, times in New York time</p>
<table>${rows || "<tr><td>No likes yet</td></tr>"}</table>`;
};

export default async (req, context) => {
  if (req.method === "POST") {
    let liked;
    try {
      ({ liked } = await req.json());
    } catch {
      return new Response("Bad request", { status: 400 });
    }
    if (typeof liked !== "boolean") return new Response("Bad request", { status: 400 });
    const geo = context.geo || {};
    const event = {
      liked,
      at: new Date().toISOString(),
      city: geo.city || null,
      region: geo.subdivision?.name || null,
      country: geo.country?.name || null,
    };
    const id = `${event.at}-${Math.random().toString(36).slice(2, 8)}`;
    await store().setJSON(id, event);
    return new Response(null, { status: 204 });
  }

  const key = new URL(req.url).searchParams.get("key");
  if (req.method !== "GET" || !process.env.LIKES_KEY || key !== process.env.LIKES_KEY) {
    return new Response("Not found", { status: 404 });
  }
  const { blobs } = await store().list();
  const events = (await Promise.all(blobs.map((b) => store().get(b.key, { type: "json" }))))
    .filter(Boolean)
    .sort((a, b) => a.at.localeCompare(b.at));
  return new Response(page(events), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
};
