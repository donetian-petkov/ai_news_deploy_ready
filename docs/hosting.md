# Hosting AI News Stream online

The app is two long-running processes: the **API** (polls feeds, runs AI jobs, serves a WebSocket, stores data in a SQLite file) and the **web app** (Next.js). That shapes where it can live:

- It needs an **always-on server with a persistent disk**. Serverless hosts (Vercel, Netlify, Cloudflare Workers) can't run the API: it has to keep polling feeds and hold WebSocket connections open, and SQLite needs a real file system.
- The browser talks to the API directly, so the API needs its own public HTTPS address (for example `api.example.com`) next to the app (`app.example.com`).

| Option | Cost | Always on | Effort |
|---|---|---|---|
| **Small VPS** (Hetzner, DigitalOcean, Oracle Cloud free tier) — recommended | ~€4–6 / month, or free | Yes | About an hour, once |
| Container host with a volume (Fly.io, Railway) | ~$5+ / month | Yes | Medium; uses the included Dockerfile |
| Your own computer + Cloudflare Tunnel | Free | Only while the computer is awake | Low |

## Set the public API address before building

The web app builds the API address into its code, so set these two values in `.env` **before** `npm run build` or `docker compose up --build`, and rebuild whenever they change:

```env
NEXT_PUBLIC_WS_URL=wss://api.example.com
NEXT_PUBLIC_API_URL=https://api.example.com
```

If they're left at the `localhost` defaults, the app loads fine, but every visitor's browser looks for the API on their own computer and shows *Disconnected*.

## Option 1: VPS (recommended)

What you need: an Ubuntu 24.04 server with 2 GB RAM, and one domain with two DNS **A records** (`app` and `api`) pointing at the server's IP.

**1. Install Node 22, PM2 and Caddy** (Caddy handles HTTPS certificates and WebSockets automatically):

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git caddy
sudo npm i -g pm2
```

**2. Get the code and configure `.env`:**

```bash
git clone https://github.com/donetian-petkov/ai_news_deploy_ready.git
cd ai_news_deploy_ready
cp .env.example .env
openssl rand -hex 32   # use for AUTH_TOKEN_SECRET
openssl rand -hex 32   # use for KEY_ENCRYPTION_SECRET
```

In `.env`, set the two secrets, your `KEYWORDS`, the two public addresses from above, and `WEB_ORIGIN=https://app.example.com` so the API only accepts requests from your app.

**3. Install and build:**

```bash
npm run install:server
```

**4. Keep it running across crashes and reboots:**

```bash
pm2 start "npm run start" --name ai-news
pm2 save
pm2 startup   # run the command it prints
```

**5. Put HTTPS in front** — `/etc/caddy/Caddyfile`:

```
app.example.com {
  reverse_proxy localhost:3000
}

api.example.com {
  reverse_proxy localhost:4000
}
```

```bash
sudo systemctl reload caddy
sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable
```

Ports 3000 and 4000 stay closed to the internet; only Caddy is exposed.

**6. Check it:** open `https://app.example.com`, and `https://api.example.com/health` should answer. Then register an account in the app and save your provider key.

**Updating later:**

```bash
git pull
npm install && npm run prisma:migrate && npm run build
pm2 restart ai-news
```

**Backups:** everything lives in the SQLite file (`apps/api/prisma/dev.db` with the default `DATABASE_URL`). Copy it somewhere off the server regularly, for example with a nightly `cron` job.

## Option 2: Your own computer + Cloudflare Tunnel

Free, and no ports opened on your router, but the app goes offline whenever the computer sleeps or shuts down. You need a domain managed in Cloudflare DNS.

1. Build and start as in the VPS steps 2–4, with the two `NEXT_PUBLIC_*` values set to your public addresses. On Windows, `pm2 startup` is not supported; run `pm2 resurrect` at login instead.
2. Install `cloudflared` (`brew install cloudflared` on macOS, `winget install Cloudflare.cloudflared` on Windows) and create the tunnel:

   ```bash
   cloudflared tunnel login
   cloudflared tunnel create ai-news-home
   cloudflared tunnel route dns ai-news-home app.example.com
   cloudflared tunnel route dns ai-news-home api.example.com
   ```

3. Create `~/.cloudflared/config.yml` (Windows: `%USERPROFILE%\.cloudflared\config.yml`):

   ```yml
   tunnel: ai-news-home
   credentials-file: /path/to/.cloudflared/<TUNNEL_ID>.json

   ingress:
     - hostname: app.example.com
       service: http://localhost:3000
     - hostname: api.example.com
       service: http://localhost:4000
     - service: http_status:404
   ```

4. Run it in the background: `pm2 start "cloudflared tunnel run ai-news-home" --name ai-news-tunnel && pm2 save`.

## Growing beyond one server

SQLite on one machine is plenty for personal use or a small group. For many simultaneous users, move the database to Postgres (Prisma supports it with a schema provider change and a fresh migration) and run the API behind a managed database.
