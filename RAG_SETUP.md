# Cloudflare Worker RAG Setup (Free Tier)

This project now supports a remote guide API for better retrieval quality.

## 1) Deploy the worker

From the repo root:

```bash
cd worker
npm install
npx wrangler login
npm run deploy
```

After deploy, copy the worker URL (example: `https://learn-guide-api.<subdomain>.workers.dev`).

## 2) Connect frontend to worker

Create `.env.production` in the repo root:

```bash
VITE_GUIDE_API_BASE=https://your-worker-url.workers.dev
```

Then build/deploy frontend as usual.

## 3) Verify

Check worker health:

```bash
curl https://your-worker-url.workers.dev/api/health
```

Expected response:

```json
{"ok":true,"service":"learn-guide-api"}
```

## Notes

- If the worker is unavailable, the frontend automatically falls back to local guide logic.
- For production-grade RAG quality, extend worker retrieval logic and ranking over more Learn sources.

