# SILVERO.925 — Hosting on Hostinger

## Which Hostinger plan

Use a **Hostinger VPS (KVM) plan**, not shared/cloud web hosting. This app needs a persistent Node.js process + PostgreSQL running continuously — shared hosting plans don't support that. KVM 2 (2 vCPU / 8GB RAM) is a comfortable starting size; KVM 1 can work for launch if budget is tight, but has less headroom for Postgres + Node running together.

## Initial Setup

1. **Order the VPS** in hPanel → choose **Ubuntu 22.04** as the OS template (Hostinger also offers an Ubuntu + Node.js pre-configured template — use it if available, saves a step).
2. **Point the domain**: add the domain in hPanel, then set its nameservers/DNS through **Cloudflare** instead of Hostinger's default DNS — this gets you free CDN/WAF/DDoS protection in front of the VPS (see `ARCHITECTURE.md` §3). Add an `A` record in Cloudflare pointing to the VPS's public IP, proxy status ON (orange cloud).
3. **SSH in** using the credentials from hPanel:
   ```bash
   ssh root@<vps-ip>
   ```
4. **Create a non-root user**, don't run the app as root:
   ```bash
   adduser silvero
   usermod -aG sudo silvero
   ```
5. **Install the stack**:
   ```bash
   # Node.js (via nvm, recommended over apt's older version)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   nvm install 20

   # PostgreSQL
   sudo apt update && sudo apt install postgresql postgresql-contrib -y

   # Nginx
   sudo apt install nginx -y

   # PM2
   npm install -g pm2
   ```
6. **Configure PostgreSQL**: create the database and a dedicated app user (not `postgres` superuser) — set the connection string as `DATABASE_URL` in `.env`.
7. **Configure Nginx** as a reverse proxy to the Node app (typically running on `localhost:3000`):
   ```nginx
   server {
     listen 80;
     server_name silvero925.com www.silvero925.com;

     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }

     location /uploads/ {
       alias /home/silvero/silvero-925/public/uploads/;
     }
   }
   ```
8. **SSL**: since Cloudflare is proxying, set Cloudflare's SSL mode to "Full (strict)" and install a certificate on the origin server via Cloudflare's free **Origin CA certificate** (simpler than Certbot renewal when Cloudflare already terminates SSL at the edge for visitors).

## Deploying the app

```bash
cd /home/silvero
git clone <repo-url> silvero-925
cd silvero-925
npm install
npx prisma migrate deploy
npm run build
pm2 start npm --name silvero-925 -- start
pm2 save
pm2 startup   # enables PM2 to restart the app on VPS reboot
```

Subsequent deploys:
```bash
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart silvero-925
```

## Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```
Only SSH (22) and web (80/443) should be open — Postgres (5432) stays closed to the outside world since the app connects to it locally.

## Backups

- **Database**: a daily cron job running `pg_dump`, saved off-VPS (e.g. to Cloudflare R2's free tier, or synced to a second location) — don't rely only on local backups on the same VPS.
- **Hostinger's own VPS snapshot/backup feature** (available on some plans, sometimes a paid add-on) is a good second layer, not a replacement for the DB dump.

## Monitoring

- **UptimeRobot** (free) — monitor the homepage and `/api/checkout` (or a lightweight health-check route) every 5 minutes, alert via email/SMS.
- **PM2** auto-restarts the Node process on crash: `pm2 startup` + `pm2 save` ensures this survives a VPS reboot too.

## Environment Variables Checklist

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=
CASHFREE_WEBHOOK_SECRET=
SHIPROCKET_EMAIL=
SHIPROCKET_PASSWORD=
```
Never commit `.env` — only `.env.example` with blank values goes in the repo.
