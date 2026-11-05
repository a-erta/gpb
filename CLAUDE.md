# GPB — Generative Premium Bullshitter

Satirical landing page (fictional product, no real company/person).

## Structure
- `README.md` — public, English project description. Keep it in sync when features change.
- `index.html` — the whole page (inline CSS/JS, Google Fonts only). Hero + compact generator console (input, Hype it, Surprise me, example chips, press-release output with Escalate/Copy and stats) + "Earnings call simulator". Calls the API at the `API` constant; on any failure (no key, 429, timeout, cold start) it falls back to local templates, so the page always works. Includes GA4 (`G-2PTRY97VB1`, property "GPB (gpb.news)" in Analytics account "alessandro.erta") with Consent Mode v2: default denied, consent banner stores the choice in `localStorage["gpb-consent"]`, "Cookie settings" link in the footer reopens it. Custom events: `hype_it`, `surprise_me`, `escalate`, `copy_linkedin`, `analyst_question`, `analyst_follow_up` — never send user-typed text to GA.
- Icons at repo root: `favicon.svg` (master: dark rounded square + gradient stock-up arrow), `favicon.ico` (16/32/48), `apple-touch-icon.png` (180, square), `icon-192.png`/`icon-512.png` + `site.webmanifest`. Regenerate PNG/ICO from the SVG with `rsvg-convert` + Pillow if the design changes.
- Social preview: `og.jpg` (1200×630) + Open Graph/Twitter meta in `index.html`. Source: `tools/og-card.html`, rendered with Playwright (`page.screenshot` at 1200×630) and saved as JPEG. After changing it, re-scrape with LinkedIn Post Inspector.
- `api/server.mjs` — zero-dependency Node proxy to Kimi (OpenAI-compatible chat completions). Routes: `POST /api/announce {project?, level}`, `POST /api/qa {question, history, level}`, `GET /healthz`. CORS limited to `ALLOWED_ORIGIN`, per-IP rate limit + daily global cap. System prompt forbids naming real people/companies.

## Deploy (Render, workspace AMG Boat Experiences)
- Static site `gpb` → https://gpb.news (custom domain; `www` redirects to apex; also https://gpb-9ho2.onrender.com) — publish path `./`, no build. Note: it also serves `api/` and this file (no secrets in repo).
- Web service `gpb-api` → https://gpb-api.onrender.com (Starter 0.5 CPU / 512 MB, $7/mo, Frankfurt; always on) — `node api/server.mjs`.
- Domain `gpb.news` registered on Squarespace; DNS there: `A @ 216.24.57.1`, `CNAME www gpb-9ho2.onrender.com` (Squarespace Defaults preset removed; Email Security preset kept).
- Env on `gpb-api`: `KIMI_API_KEY` (set by Alessandro; `SET_ME` = disabled), `KIMI_MODEL` (default `kimi-k2.6`), `KIMI_BASE_URL` (default `https://api.moonshot.ai/v1`), `ALLOWED_ORIGIN` (`https://gpb.news,https://www.gpb.news,https://gpb-9ho2.onrender.com`), optional `RATE_PER_IP` (20/10min), `DAILY_CAP` (2000), `TRUSTED_PROXY_HOPS` (2).
- Client IP for rate limiting = second-to-last X-Forwarded-For entry (verified on Render: "<client-supplied>, <real client>, <Cloudflare edge>"). POSTs without the allowed Origin get 403.

## Commits
- Commit on the Mac (`~/src/gpb`): repo-local git config signs with the MacBook Pro SSH key (registered on GitHub as signing key) and uses alessandro.erta@gmail.com, so commits show as Verified. Commits made elsewhere are unsigned.
