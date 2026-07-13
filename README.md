# Eloura AI

A production-grade, fully-typed **AI image-generation SaaS** built on a strict TypeScript MERN stack and completely containerized for universal cloud deployment.

Type a prompt, pick a style, and generate images — with authentication, a credit economy, persistent CDN-backed history, and real payments.

---

## Features

- **Auth** — JWT-based signup/login, bcrypt-hashed passwords, protected routes
- **Studio** — prompt-to-image generation with selectable style modes (Anime / Realistic / Cinematic)
- **Credit economy** — atomic per-generation deduction, 403 + pricing redirect when out of credits
- **History** — searchable masonry gallery of every generation, with delete
- **Payments** — Razorpay checkout with cryptographic signature verification and idempotent crediting
- **Polished UI** — Apple-Intelligence mesh glow, Raycast shimmer skeletons, cursor-following border glow, Framer Motion transitions
- **Strict TypeScript everywhere** — `strict: true`, zero `any` across the codebase

## Tech stack

| Layer     | Technology                                        |
| --------- | ------------------------------------------------- |
| Frontend  | React 18, Vite, TypeScript, Tailwind CSS, Framer Motion |
| Backend   | Node.js, Express, TypeScript, Mongoose            |
| Database  | MongoDB                                            |
| Media     | Cloudinary (optional)                             |
| Payments  | Razorpay                                           |
| Container | Docker + Docker Compose                           |

---

## Project structure

```
eloura-ai/
├── client/                 # React + Vite (TS strict)
│   ├── src/
│   │   ├── components/     # Spinner, Skeleton, MeshGlow, GlowCard, ProtectedRoute
│   │   ├── context/        # AuthContext
│   │   ├── pages/          # Landing, Login, Signup, Dashboard, History, Pricing
│   │   ├── lib/            # axios instance + interceptor
│   │   └── types/          # auth / image / payment / global.d.ts
│   ├── Dockerfile          # production (nginx)
│   ├── Dockerfile.dev      # dev (Vite HMR)
│   └── nginx.conf
├── server/                 # Express + Mongoose (TS strict)
│   ├── src/
│   │   ├── config/         # db, jwt
│   │   ├── controllers/    # auth, image, payment
│   │   ├── middleware/     # authMiddleware
│   │   ├── models/         # User, Image, Payment
│   │   ├── routes/         # auth, image, payment
│   │   ├── services/       # image (provider), cloudinary
│   │   └── types/          # image, payment, express.d.ts
│   └── Dockerfile          # production multi-stage
├── docker-compose.yml      # local development (hot reload)
├── docker-compose.prod.yml # production (single host)
├── .env.example
└── DEPLOYMENT.md
```

---

## Quick start (local development)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
cp .env.example .env      # then fill in JWT_SECRET (any long random string)
docker compose up --build
```

- Client: http://localhost:5173
- API:    http://localhost:5000/api/health

Source directories are volume-mounted, so edits hot-reload inside the containers.

### Without Docker

```bash
# terminal 1
cd server && npm install && npm run dev
# terminal 2
cd client && npm install && npm run dev
```

(Requires a local MongoDB, or point `MONGO_URI` at MongoDB Atlas.)

---

## Environment variables

| Variable                  | Required | Purpose                                            |
| ------------------------- | -------- | -------------------------------------------------- |
| `MONGO_ROOT_USER`         | yes      | MongoDB root user                                  |
| `MONGO_ROOT_PASSWORD`     | yes      | MongoDB root password                              |
| `MONGO_DB`                | yes      | Database name                                      |
| `JWT_SECRET`              | yes      | Long random string for signing tokens              |
| `JWT_EXPIRES_IN`          | no       | Token lifetime (default `7d`)                      |
| `CLIENT_ORIGIN`           | prod     | Allowed CORS origin                                |
| `OPENAI_API_KEY`          | no       | Use DALL·E instead of the free keyless provider    |
| `CLOUDINARY_*`            | no       | Persist images to the Cloudinary CDN               |
| `RAZORPAY_KEY_ID/SECRET`  | no       | Enable checkout                                    |
| `RAZORPAY_WEBHOOK_SECRET` | no       | Verify payment webhooks                            |

Every optional integration degrades gracefully — the app runs without any of them.

---

## Production build

```bash
# compile + type-check both packages
cd server && npm run build     # → server/dist
cd ../client && npm run build  # → client/dist

# or build the production images
docker build -t eloura-server ./server
docker build -t eloura-client ./client
```

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for hosting options and the pre-deploy checklist.

---

## License

MIT
