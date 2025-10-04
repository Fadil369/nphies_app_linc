# ✨ Welcome to Your Spark Template!
You've just launched your brand-new Spark Template Codespace — everything’s fired up and ready for you to explore, build, and create with Spark!

This template is your blank canvas. It comes with a minimal setup to help you get started quickly with Spark development.

🚀 What's Inside?
- A clean, minimal Spark environment
- Pre-configured for local development
- Ready to scale with your ideas
  
🧠 What Can You Do?

Right now, this is just a starting point — the perfect place to begin building and testing your Spark applications.

🧹 Just Exploring?
No problem! If you were just checking things out and don’t need to keep this code:

- Simply delete your Spark.
- Everything will be cleaned up — no traces left behind.

📄 License For Spark Template Resources 

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.

---

## 🚀 Cloudflare Workers & Pages Deployment

This project is ready for deployment on [Cloudflare Workers](https://workers.cloudflare.com/) (backend API) and [Cloudflare Pages](https://pages.cloudflare.com/) (frontend).

### 1. Prerequisites
- [Cloudflare account](https://dash.cloudflare.com/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install/) installed (`npm install -g wrangler`)
- Node.js 18+

### 2. Environment Variables & Secrets
- Set `VITE_API_URL` in your Cloudflare Pages project to your deployed Worker URL (e.g., `https://nphies-healthcare-worker.<account>.workers.dev`)
- Set secrets for the Worker using Wrangler:
  ```sh
  wrangler secret put NPHIES_CLIENT_ID
  wrangler secret put NPHIES_CLIENT_SECRET
  wrangler secret put JWT_SECRET
  wrangler secret put OPENAI_API_KEY
  ```
- Edit `wrangler.toml` and `_pages_config.toml` as needed for your account and environment.

### 3. Build & Deploy Frontend (Pages)
```sh
npm run build:cf-pages
wrangler pages deploy dist
```

### 4. Deploy Backend (Worker)
```sh
cd worker
wrangler deploy
```

### 5. Local Development
- Start the Worker locally:
  ```sh
  wrangler dev
  ```
- Start the frontend:
  ```sh
  npm run dev
  ```
- Set `VITE_API_URL` to `http://localhost:8787` for local API calls.

### 6. API Proxy
- The frontend proxies `/api/*` requests to the Worker (see `_pages_config.toml`).
- Update the Worker URL in `_pages_config.toml` as needed.

---

## 🗂️ Repository Setup & Remote Publishing

When you are ready to share your changes from this template, initialize your own remote and push the history:

```sh
# inside /workspaces/spark-template
git init               # already done in Codespaces but safe to rerun
git remote add origin https://github.com/<your-org>/<your-repo>.git
git add .
git commit -m "Initial NPHIES assistant setup"
git push -u origin main
```

If you are reusing an existing repository, replace `origin` with your chosen remote name. Ensure that any secret files (e.g., `.env`, `.dev.vars`) remain untracked before pushing.
# nphies_app_linc
