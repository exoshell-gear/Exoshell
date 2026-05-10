# Profit Tracker

Live dashboard: exoshell.space/profit

## Setup

### 1. Add to Your Existing Repo

Copy these folders into your existing GitHub repo:
- `pages/` (merge with existing pages folder if you have one)
- `next.config.js`
- `package.json` (merge dependencies if you have one)

### 2. Deploy to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Import your repo (the one with this code)
4. Click "Deploy"

### 3. Add Environment Variables in Vercel

In your Vercel project dashboard:

1. Go to Settings → Environment Variables
2. Add these three variables:

```
META_ACCESS_TOKEN = EAAV8mz7i9p0BRSxOYc8v02IZAKDa5mgs5bJktivlu4lMVMcBrq7ZCGRbTNCPTiUS2FZBsZCSeyr4K0OTigU3yzmboCD4RIz2MCpeBpU4ZAt61n8ZAEeWoF4lxaEt01R0v57nVDuAq5HWP6ZA0xVVqDZBvhWoBmeqg6hoHR91fumNwetBFgqidkhBdLZBcgkuTd8unFN8ZD

WHOP_API_KEY = apik_Rzn6M7CUMxzfL_C4818431_C_16829214baed35054396a604c972210dc080cc1b454a331acac7385f563ea9

AD_ACCOUNT_ID = act_1032293498964016
```

3. Click "Save"
4. Redeploy (Vercel will do this automatically)

### 4. Access Your Dashboard

Go to: **exoshell.space/profit**

(Or whatever Vercel gives you if custom domain isn't set up)

## What It Shows

**Today:**
- Revenue from Whop
- Ad spend from Meta
- Net profit

**This Month:**
- Total revenue
- Total ad spend
- Total profit
- Profit margin %

**Recent:**
- Last 10 Whop payments

Auto-refreshes every 5 minutes.

## Security

✅ API keys are stored in Vercel environment variables (not in code)
✅ Repo can be public - keys never exposed
✅ Only you can see the dashboard (unless you share the URL)
