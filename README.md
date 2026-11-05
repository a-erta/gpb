# GPB — Generative Premium Bullshitter

> The first foundation model trained exclusively on promises.

**Live:** https://gpb.news

GPB is a parody of AI-era corporate hype. You tell it something small and true — *"we fixed a typo on the website"* — and it tells the market what it wants to hear: 99.7% of everything, rewritten in four weeks by a two-person team with unlimited tokens. Platform shift included.

## What it does

- **Hype it** — turn a boring fact into a stock-pumping press release, complete with projected stock impact, bullshit-per-share and a delivery date that is always after the next earnings call.
- **Surprise me** — a random announcement, no input needed.
- **Escalate** — each click makes the promise bigger and the timeline shorter, until it ships retroactively.
- **Copy for LinkedIn** — ready to post, hashtags and humility included.
- **Earnings call simulator** — play the analyst. Ask about KPIs, timelines or last year's promise; the CEO never answers, and every follow-up raises the stakes.

## How it works

```
index.html  ──fetch──▶  api/server.mjs  ──▶  Kimi (Moonshot, OpenAI-compatible API)
   │
   └─ falls back to built-in templates if the API is slow, rate-limited or offline
```

- `index.html` — the whole site: one static file, inline CSS/JS, no build step.
- `api/server.mjs` — a zero-dependency Node.js proxy (Node 18+) that keeps the API key server-side. It exposes `POST /api/announce`, `POST /api/qa` and `GET /healthz`, with CORS locked to the site's origin, a per-IP rate limit and a daily cap.
- The system prompt forbids naming real people, companies or products, so everything GPB says stays fictional.

## Run it locally

```bash
# API (any OpenAI-compatible endpoint works)
KIMI_API_KEY=your-key ALLOWED_ORIGIN=http://localhost:8000 node api/server.mjs

# Page — set the API constant in index.html to http://localhost:10000 first
python3 -m http.server 8000
```

Without a key the page still works, using the built-in templates.

| Variable | Default | Purpose |
|---|---|---|
| `KIMI_API_KEY` | — | Required for live generation |
| `KIMI_MODEL` | `kimi-k2.6` | Model ID |
| `KIMI_BASE_URL` | `https://api.moonshot.ai/v1` | Any OpenAI-compatible base URL |
| `ALLOWED_ORIGIN` | — | Comma-separated origins allowed to call the API |
| `RATE_PER_IP` | `20` | Requests per IP per 10 minutes |
| `DAILY_CAP` | `2000` | Total model calls per day |
| `TRUSTED_PROXY_HOPS` | `2` | Which `X-Forwarded-For` entry (from the end) is the real client; `2` fits Render behind Cloudflare |

## Deploy

On Render: a **static site** publishing the repo root (no build), plus a **web service** running `node api/server.mjs` with the variables above.

## Privacy

The page uses Google Analytics 4 with Consent Mode: no analytics cookies are set until the visitor accepts the banner, and the choice can be changed from "Cookie settings" in the footer. Only clicks are tracked (e.g. *Hype it*, *Escalate*) — the text you type goes to the API to generate the announcement and is never sent to Google or stored.

## Disclaimer

GPB is satire. It is not a product and is not affiliated with any company. Any resemblance to real keynotes, earnings calls or LinkedIn posts is, regrettably, entirely plausible.
