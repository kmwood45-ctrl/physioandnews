# Deploy Guide — CF & Physio Research Hub
# Auto-updates every day at 6:00 AM Toronto time

## STEP 1 — Upload files to GitHub (one time)

Open Terminal (Mac) or Command Prompt (Windows):

```bash
cd ~/Downloads/physioandnews
git init
git checkout -b main
git add .
git commit -m "v3 full build"
git remote add origin https://YOUR_TOKEN@github.com/kmwood45-ctrl/physioandnews.git
git push -f origin main
```

Generate a fresh token at: https://github.com/settings/tokens
(check the "repo" checkbox)

---

## STEP 2 — Deploy backend on Railway (free — auto-refreshes daily)

Railway hosts your Node.js server that runs the 6 AM cron job.

1. Go to https://railway.app → sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select "physioandnews"
4. Add environment variables (Settings → Variables):

```
ANTHROPIC_API_KEY = sk-ant-your-key-here
PORT = 3000
```

5. Railway auto-deploys. Your server URL will be something like:
   https://physioandnews-production.up.railway.app

6. Visit /health to confirm it's running:
   https://yourapp.railway.app/health

---

## STEP 3 — Enable GitHub Pages (static fallback + free hosting)

1. github.com/kmwood45-ctrl/physioandnews
2. Settings → Pages → Branch: main → Save
3. Static site at: https://kmwood45-ctrl.github.io/physioandnews

Note: GitHub Pages serves the static site. 
      Railway serves the backend with daily auto-update.
      The frontend fetches /api/today from Railway for fresh content.

---

## How the daily update works

Every day at 6:00 AM Toronto time, the Railway server:
1. Queries PubMed API for new research in each category (free, no key needed)
2. Generates AI clinical summaries via Anthropic API
3. Fetches world news via Claude web search
4. Saves result to /public/data/YYYY-MM-DD.json
5. Archives files older than 30 days
6. Frontend fetches /api/today on page load → displays fresh content

---

## Get your Anthropic API key

1. Go to https://console.anthropic.com
2. Create account → API Keys → Create key
3. Copy the key (starts with sk-ant-)
4. Add to Railway environment variables

---

## Costs

- Railway: Free tier = 500 hours/month (enough for 1 app running 24/7)
- Anthropic API: ~$0.01–0.05 per daily update (very cheap)
- GitHub Pages: Free
- PubMed API: Completely free, no key needed

Total cost: ~$0–2/month
