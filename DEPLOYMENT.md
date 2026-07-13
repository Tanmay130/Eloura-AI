# Deploying Eloura AI

This guide covers verifying the production build locally, comparing hosting options, and the pre-deploy safety checklist.

---

## 1. Verify the production build locally

Before deploying, confirm the production images build and the compiled output runs.

**Type-check + compile both packages:**

```bash
cd server && npm run build     # tsc → server/dist  (fails on any type error)
cd ../client && npm run build  # tsc -b && vite build → client/dist
```

**Build the production Docker images and check for errors:**

```bash
# From the repo root
docker build -t eloura-server ./server
docker build -t eloura-client ./client
```

A non-zero exit code on either command means the build failed — read the last lines of output for the offending stage (e.g. a `tsc` error surfaces in the server image's build stage).

**Run the whole production stack on your machine to smoke-test it:**

```bash
cp .env.example .env      # fill in real values (see checklist below)
docker compose -f docker-compose.prod.yml up --build
```

Then open http://localhost — nginx serves the built client and proxies `/api` to the server. If signup, generation, and the dashboard all work here, the stack is deploy-ready.

---

## 2. Hosting options

Your stack has three moving parts: **client (static)**, **server (Node)**, and **MongoDB**. Two deployment shapes:

- **Single-host (Docker Compose):** run `docker-compose.prod.yml` on one VM. Simplest mental model; you manage the box.
- **Split (managed services):** client on a static/edge host, server on a container host, database on a managed Mongo. More moving parts, better scaling.

### Zero-cost / free tiers

| Platform          | Good for            | Free-tier catch                                                        |
| ----------------- | ------------------- | --------------------------------------------------------------------- |
| **Render**        | server + static     | Free web services **spin down after ~15 min idle**; first request after sleep is slow (cold start ~30–60s). |
| **Railway**       | server + Mongo      | Free trial credit only, then usage-billed; no permanent free tier.    |
| **Vercel**        | client (static)     | Excellent for the React build; **not** for a long-running Express server or sockets. Serverless functions have execution limits. |
| **Fly.io**        | full Docker stack   | Generous free allowance; scales to zero (cold starts) unless you keep a machine warm. |
| **MongoDB Atlas** | database            | **M0 free cluster** (512 MB) — the right home for the DB on any plan. |

**Free-tier reality:** the biggest downside is **spin-down**. On Render/Fly free tiers the server sleeps when idle, so the first visit after a lull is slow. Fine for demos and portfolios; not for paying users.

### Premium / paid tiers

| Platform             | Strength                                              | Rough entry cost |
| -------------------- | ---------------------------------------------------- | ---------------- |
| **Railway**          | Easiest full-stack + Mongo, great DX, no spin-down   | ~$5/mo usage     |
| **Render (paid)**    | Always-on services, managed Postgres/Redis add-ons   | ~$7/mo/service   |
| **Fly.io (paid)**    | Global edge, keep-warm machines, real Docker         | ~$5–10/mo        |
| **DigitalOcean/AWS/GCP** | Full control, a single droplet/VM runs the whole compose | ~$6/mo (droplet) |
| **Vercel Pro**       | Best-in-class for the client + CDN/edge              | $20/mo           |

### Recommended shapes

- **Demo / portfolio (free):** client on **Vercel**, server on **Render free**, DB on **Atlas M0**. Accept the server cold-start.
- **Real small product (cheap, no spin-down):** everything on **Railway** (server + Mongo) + client on Vercel, or a single **DigitalOcean droplet** running `docker-compose.prod.yml`.
- **Serious scale:** managed Mongo (Atlas paid), containers on Fly/Render paid or a cloud provider, client on a CDN.

> Note on the split model: the client currently calls `/api` (proxied by nginx). If you host the client and server on *different domains* (e.g. Vercel + Railway), point the client's API base at the server's public URL at build time and set the server's `CLIENT_ORIGIN` to the client domain for CORS.

---

## 3. Pre-deploy safety checklist

**Secrets & config**

- [ ] Generate a strong `JWT_SECRET` (e.g. `openssl rand -base64 48`) — never reuse the dev value.
- [ ] Set strong `MONGO_ROOT_PASSWORD`; do not commit it.
- [ ] `.env` is git-ignored (it is) — provide secrets via the host's env/secret manager, not the repo.
- [ ] Set `CLIENT_ORIGIN` to your real client URL so CORS is locked down.
- [ ] Use **live** Razorpay keys + a real `RAZORPAY_WEBHOOK_SECRET`, and register the webhook URL (`https://<api>/api/payments/webhook`) in the Razorpay dashboard.
- [ ] Add Cloudinary keys so generated images persist to the CDN.

**Build & runtime**

- [ ] `npm run build` passes with **zero type errors** on both packages.
- [ ] `NODE_ENV=production` on the server.
- [ ] MongoDB is a managed/persistent instance (Atlas), not an ephemeral container volume.
- [ ] Server runs as the non-root `node` user (already configured in the Dockerfile).
- [ ] Health check `GET /api/health` returns 200 (used by the Dockerfile HEALTHCHECK / load balancer).

**Security**

- [ ] HTTPS terminated at the host/CDN (never send JWTs over plain HTTP).
- [ ] Helmet + CORS are enabled (they are) and CORS origin is not `*` in prod.
- [ ] Rotate any key that was ever pasted into a chat, screenshot, or commit.

---

## 4. Deploy

**Single host (any VM with Docker):**

```bash
git clone <your-repo-url> && cd eloura-ai
cp .env.example .env   # fill in production secrets
docker compose -f docker-compose.prod.yml up --build -d
```

Put a reverse proxy (Caddy/Traefik/nginx) or the platform's load balancer in front for HTTPS.

**Managed platform:** point the platform at your GitHub repo, set the two Dockerfiles (`server/Dockerfile`, `client/Dockerfile`) as the build sources, add the env vars from the checklist, and attach an Atlas connection string as `MONGO_URI`.
