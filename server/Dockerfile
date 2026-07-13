# =============================================================================
# Eloura AI — Production API image (multi-stage)
#
#   Stage 1 (deps)    : install ALL deps for compilation
#   Stage 2 (build)   : run `tsc` -> dist/
#   Stage 3 (runtime) : slim node-alpine, prod deps only, non-root
# =============================================================================

# ---- Stage 1: install dependencies (incl. dev, needed to compile) ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- Stage 2: compile TypeScript -------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Stage 3: production dependencies only ---------------------------------
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- Stage 4: slim runtime -------------------------------------------------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production \
    PORT=5000
WORKDIR /app

# Run as the built-in unprivileged 'node' user.
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node package*.json ./

USER node
EXPOSE 5000

# Lightweight container healthcheck against the API health route.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/server.js"]
