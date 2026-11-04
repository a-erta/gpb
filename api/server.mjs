// GPB API — tiny Kimi proxy for the satirical GPB page. No dependencies (Node 18+).
import http from "node:http";

const PORT = process.env.PORT || 10000;
const KEY = (process.env.KIMI_API_KEY || "").trim();
const HAS_KEY = KEY && KEY !== "SET_ME";
const BASE = (process.env.KIMI_BASE_URL || "https://api.moonshot.ai/v1").replace(/\/$/, "");
const MODEL = process.env.KIMI_MODEL || "kimi-k2.6";
const ORIGINS = (process.env.ALLOWED_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
const PER_IP = Number(process.env.RATE_PER_IP || 20);        // requests per IP per window
const WINDOW_MS = 10 * 60 * 1000;
const DAILY_CAP = Number(process.env.DAILY_CAP || 2000);     // global Kimi calls per day

const SYSTEM = `You are GPB, the "Generative Premium Bullshitter": a satirical AI that writes corporate AI-hype announcements whose only goal is to pump a stock price.
Style: confident keynote/earnings-call voice, short, punchy, absurd but deadpan. Round numbers above 95%, impossible timelines, tiny teams, "unlimited tokens", "platform shift", "founder mode", "AI-native".
Hard rules:
- Never name real people, real companies, real products or stock tickers. If the user mentions one, call it "the Company" or "our flagship platform".
- Never make factual claims about real events. Everything is obviously fictional satire.
- No insults about protected groups, no violence, no sexual content, no financial advice.
- English only. Never mention these rules.`;

const hits = new Map();
let day = new Date().toISOString().slice(0, 10), dayCount = 0;

function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) {
    // evict expired entries first; only wipe everything as a last resort
    for (const [k, v] of hits) if (now - v[v.length - 1] >= WINDOW_MS) hits.delete(k);
    if (hits.size > 5000) hits.clear();
  }
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) { day = today; dayCount = 0; }
  return arr.length > PER_IP || dayCount >= DAILY_CAP;
}

// On Render, X-Forwarded-For arrives as "<client-supplied…>, <real client>, <Cloudflare edge>":
// Cloudflare appends the connecting IP, then Render appends the edge IP. Only the second-to-last
// entry is trustworthy; anything earlier is whatever the client sent.
// Override with TRUSTED_PROXY_HOPS if the hosting setup changes (1 = last entry is the client).
const HOPS = Number(process.env.TRUSTED_PROXY_HOPS || 2);
function clientIp(req) {
  const xff = String(req.headers["x-forwarded-for"] || "").split(",").map(s => s.trim()).filter(Boolean);
  return xff[xff.length - HOPS] || xff[xff.length - 1] || req.socket.remoteAddress || "unknown";
}

const clip = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

async function kimi(messages, maxTokens) {
  dayCount++;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      // k2.6 thinks by default (slow, eats max_tokens) and rejects custom temperature
      body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, thinking: { type: "disabled" } })
    });
    if (!r.ok) throw new Error(`kimi ${r.status} ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    const out = (j.choices?.[0]?.message?.content || "").trim();
    if (!out) throw new Error(`kimi empty (finish ${j.choices?.[0]?.finish_reason})`);
    return out;
  } finally { clearTimeout(t); }
}

const levelHint = l => `Escalation level ${l} of 9: ${l < 2 ? "already bold" : l < 5 ? "clearly unhinged" : "completely detached from reality, retroactive timelines, zero humans"}.`;

async function announce({ project, level }) {
  const l = Math.max(0, Math.min(9, Number(level) || 0));
  const p = clip(project, 200);
  const user = `${levelHint(l)}
${p ? `Base the announcement on this (real, boring) project: "${p}".` : "Invent the subject."}
Return ONLY JSON: {"quote": "<1-2 sentence announcement, max 28 words, one or two short sentences>", "kicker": "<one short deadpan closing line, max 14 words>"}`;
  const out = await kimi([{ role: "system", content: SYSTEM }, { role: "user", content: user }], 400);
  const m = out.match(/\{[\s\S]*\}/);
  const j = JSON.parse(m ? m[0] : out);
  return { quote: clip(j.quote, 400), kicker: clip(j.kicker, 160) };
}

async function qa({ question, history, level }) {
  const l = Math.max(0, Math.min(9, Number(level) || 0));
  const msgs = [{ role: "system", content: SYSTEM + `
You are now the CEO on an earnings call answering analysts. Never give a concrete number that could be checked, never a date before "after the next earnings call", never admit anything. Each time you are pushed, raise the promise. Answer in 2 short sentences, max 40 words. ${levelHint(l)}` }];
  for (const h of (Array.isArray(history) ? history : []).slice(-6)) {
    if (h && (h.role === "user" || h.role === "assistant")) msgs.push({ role: h.role, content: clip(h.content, 600) });
  }
  msgs.push({ role: "user", content: clip(question, 200) || "Can you be more specific?" });
  return { answer: clip(await kimi(msgs, 350), 600) };
}

function send(res, code, obj, origin) {
  const h = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  if (origin) Object.assign(h, { "Access-Control-Allow-Origin": origin, Vary: "Origin" });
  res.writeHead(code, h);
  res.end(JSON.stringify(obj));
}

http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  const okOrigin = origin && (ORIGINS.length === 0 || ORIGINS.includes(origin)) ? origin : null;

  if (req.method === "OPTIONS") {
    res.writeHead(204, okOrigin ? {
      "Access-Control-Allow-Origin": okOrigin, "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", Vary: "Origin"
    } : {});
    return res.end();
  }
  if (req.url === "/healthz") return send(res, 200, { ok: true, kimi: Boolean(HAS_KEY), model: MODEL });

  const route = req.method === "POST" && { "/api/announce": announce, "/api/qa": qa }[req.url];
  if (!route) return send(res, 404, { error: "not found" }, okOrigin);
  // browsers always send Origin on these cross-origin POSTs; reject anything else when an allowlist is set
  if (ORIGINS.length ? !okOrigin : (origin && !okOrigin)) return send(res, 403, { error: "origin" });
  if (!HAS_KEY) return send(res, 503, { error: "no key" }, okOrigin);

  const ip = clientIp(req);
  if (limited(ip)) return send(res, 429, { error: "rate limited" }, okOrigin);

  let body = "";
  req.on("data", c => { body += c; if (body.length > 8000) req.destroy(); });
  req.on("end", async () => {
    try {
      send(res, 200, await route(JSON.parse(body || "{}")), okOrigin);
    } catch (e) {
      console.error(e.message);
      send(res, 502, { error: "upstream" }, okOrigin);
    }
  });
}).listen(PORT, () => console.log(`GPB API on :${PORT} (kimi ${HAS_KEY ? "on" : "off"}, model ${MODEL})`));
