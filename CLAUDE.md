# GPB — Generative Premium Bullshitter

Satirical landing page (fictional product, no real company/person).

## Structure
- `index.html` — the whole page (inline CSS/JS, Google Fonts only). Generator + "Earnings call simulator". Calls the API at the `API` constant; on any failure (no key, 429, timeout, cold start) it falls back to local templates, so the page always works. The `engine:` label shows which one answered.
- `api/server.mjs` — zero-dependency Node proxy to Kimi (OpenAI-compatible chat completions). Routes: `POST /api/announce {project?, level}`, `POST /api/qa {question, history, level}`, `GET /healthz`. CORS limited to `ALLOWED_ORIGIN`, per-IP rate limit + daily global cap. System prompt forbids naming real people/companies.

## Deploy (Render, workspace AMG Boat Experiences)
- Static site `gpb` → https://gpb-9ho2.onrender.com — publish path `./`, no build. Note: it also serves `api/` and this file (no secrets in repo).
- Web service `gpb-api` → https://gpb-api.onrender.com (free plan, Frankfurt; cold start ~30s, page falls back meanwhile) — `node api/server.mjs`.
- Env on `gpb-api`: `KIMI_API_KEY` (set by Alessandro; `SET_ME` = disabled), `KIMI_MODEL` (default `kimi-k2.6`), `KIMI_BASE_URL` (default `https://api.moonshot.ai/v1`), `ALLOWED_ORIGIN`, optional `RATE_PER_IP` (20/10min), `DAILY_CAP` (2000).
