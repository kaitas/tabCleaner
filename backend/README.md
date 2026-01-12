# Tab Cleanup Backend (Cloudflare Workers)

This directory contains the serverless backend for the Tab Cleanup extension.
It handles daily score submissions and global ranking aggregation using Cloudflare Workers and R2.

## 🔒 Security & Privacy Notice
This repository does NOT contain sensitive credentials (API Keys, Account IDs).
You must configure them locally or in your Cloudflare Dashboard.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Cloudflare Login**
   ```bash
   npx wrangler login
   ```

3. **Create R2 Bucket**
   You need to create the bucket defined in `wrangler.toml` manually:
   ```bash
   npx wrangler r2 bucket create tab-cleaner-stats
   ```

4. **Deploy**
   ```bash
   npm run deploy
   ```

## Anti-Cheat Configuration
To enable the HMAC signature verification (future feature), set the secret:
```bash
npx wrangler secret put API_SECRET
```

## Structure
- `src/index.js`: Main worker logic (API Endpoints).
- `wrangler.toml`: Infrastructure check (Generic config).
