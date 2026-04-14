# Deploy to Railway — Step by Step
# Your site will auto-update every day at 6:00 AM Toronto time

## PART 1: Upload files to GitHub

Open Terminal (Mac: Cmd+Space → type Terminal) or Command Prompt (Windows):

```bash
# Navigate to the folder you downloaded
cd ~/Downloads/physioandnews

# Set up git
git init
git checkout -b main
git add .
git commit -m "v4 build"

# Push to your GitHub repo
# Replace YOUR_TOKEN with a token from https://github.com/settings/tokens
# When creating token: check the "repo" checkbox → Generate → Copy
git remote add origin https://YOUR_TOKEN@github.com/kmwood45-ctrl/physioandnews.git
git push -f origin main
```

---

## PART 2: Deploy on Railway (the server that runs daily at 6 AM)

1. Go to https://railway.app
2. Click "Start a New Project" → Sign up/in with GitHub
3. Click "Deploy from GitHub repo"
4. Select "physioandnews" from your repository list
5. Railway will detect package.json and run npm install + npm start automatically

### Add your Anthropic API key (REQUIRED for news + AI summaries):

6. In Railway, click your project → click the service → click "Variables" tab
7. Click "New Variable" and add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your key from https://console.anthropic.com (starts with sk-ant-)
8. Click "Add" → Railway will redeploy automatically

### Verify it's working:

9. Click "Settings" tab → find your Railway URL (e.g. https://yourapp.railway.app)
10. Visit: https://yourapp.railway.app/health
    You should see: {"status":"ok","todayDataExists":true,...}

---

## PART 3: Enable GitHub Pages (free public website)

1. Go to github.com/kmwood45-ctrl/physioandnews
2. Click "Settings" → "Pages" (left sidebar)
3. Under "Branch": select "main" → click "Save"
4. Wait 2 minutes → your site is live at:
   https://kmwood45-ctrl.github.io/physioandnews

---

## How the daily refresh works

Every day at 6:00 AM Toronto time, Railway automatically:
1. Searches PubMed for new research articles (FREE — no key needed)
2. Generates AI clinical summaries via your Anthropic API key
3. Fetches today's world news from NYT, WaPo, Reuters, BBC, CBC etc.
4. Saves results to a dated file (e.g. 2026-04-13.json)
5. Archives the previous 30 days automatically

The website fetches /api/today when you load it → always shows fresh content.

---

## Costs

| Service         | Cost         |
|----------------|--------------|
| Railway.app    | Free (500 hrs/month hobby plan) |
| Anthropic API  | ~$0.01–0.05/day |
| GitHub Pages   | Free |
| PubMed API     | Free (no key needed) |

Total: essentially free

---

## Troubleshooting

**"Application failed to respond"**
→ Check Railway logs → Settings → Logs tab
→ Make sure ANTHROPIC_API_KEY variable is set

**"Cannot find module 'express'"**
→ Railway needs to run npm install first
→ In Railway: Settings → Deploy → make sure "Install Command" is set to `npm install`

**Site not updating**
→ Visit https://yourapp.railway.app/health to check server status
→ Visit https://yourapp.railway.app/api/today to see today's data
→ To manually trigger an update: POST to https://yourapp.railway.app/api/refresh

**To update files in future:**
```bash
cd ~/Downloads/physioandnews
git add .
git commit -m "update"
git push origin main
# Railway auto-redeploys within 1-2 minutes
```
