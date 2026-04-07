# CF & Physio Research Hub

A curated research, news, games, and daily digest platform for physiotherapists.

---

## What's in this repo

| File | What it does |
|------|-------------|
| `index.html` | Main website — all tabs, games, news, email form |
| `style.css` | All visual styling |
| `data.js` | All research articles and MSK protocol data |
| `app.js` | Games logic, AI summaries, news aggregator |
| `README.md` | This guide |

---

## Easiest way to publish (FREE — 5 minutes)

### Option A: GitHub Pages (recommended for beginners)

This publishes your site directly from GitHub — no servers, no cost.

1. Go to **https://github.com/kmwood45-ctrl/physioandnews**
2. Click **Settings** (top right of repo page)
3. In the left sidebar, click **Pages**
4. Under "Branch", select **main** and folder **/ (root)**
5. Click **Save**
6. Wait 2 minutes, then visit:
   **https://kmwood45-ctrl.github.io/physioandnews**

That's it — your site is live!

---

## Making the AI summaries work

The "Generate AI Summary" buttons and the news aggregator call the Anthropic API.
For these to work, you need to add your API key.

**Step 1:** Get a free API key at https://console.anthropic.com

**Step 2:** In `app.js`, find this line (appears twice):
```
headers: { 'Content-Type': 'application/json' },
```
Change it to:
```
headers: { 'Content-Type': 'application/json', 'x-api-key': 'YOUR_KEY_HERE', 'anthropic-version': '2023-06-01' },
```

**Step 3:** Commit and push — your AI features will now work.

> ⚠️ Note: Putting an API key directly in frontend JS is fine for personal use.
> For a public site with many users, use the backend server below instead.

---

## Daily email digest (backend setup)

This requires a small server. Easiest free option: **Railway.app**

### Step 1 — Get your API keys
- **Anthropic API key:** https://console.anthropic.com
- **SendGrid API key:** https://sendgrid.com (free: 100 emails/day)
- **News API key:** https://newsapi.org (free: 100 requests/day)

### Step 2 — Create a `.env` file (never commit this to GitHub!)
```
ANTHROPIC_API_KEY=sk-ant-...
SENDGRID_API_KEY=SG....
NEWS_API_KEY=...
FROM_EMAIL=yourname@yourdomain.com
PORT=3000
```

### Step 3 — Install and run the server
```bash
npm install
node server/index.js
```

### Step 4 — Deploy to Railway (free tier)
1. Go to https://railway.app and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select this repo
4. Add your environment variables (Settings → Variables)
5. Railway auto-deploys — you'll get a URL like `https://yourapp.railway.app`

### Step 5 — Point your email form at your server
In `index.html`, find the subscribe button and change the `doSubscribe()` function
to POST to `https://yourapp.railway.app/subscribe` instead of just showing the success message.

---

## How to update the research articles

Open `data.js` and add a new object to any array. Example:
```javascript
{
  title: "Your article title here",
  authors: "Author et al. (2024) — Institution",
  journal: "Journal Name",
  r: "ca",          // ca = Canadian, au = Australian, us = American, ww = Worldwide
  c: 142,           // citation count
  doi: "10.xxxx/xxxxx",
  abs: "Brief abstract of the article...",
  ai: "Optional pre-written AI summary for clinicians...",
}
```

---

## File structure
```
physioandnews/
├── index.html      ← Main website
├── style.css       ← All CSS styles
├── data.js         ← Research data & MSK protocols
├── app.js          ← All JavaScript logic
└── README.md       ← This file
```
