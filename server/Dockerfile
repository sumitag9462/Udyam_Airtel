# ── Stage 1: production dependencies ──────────────────────────────────────────
FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

# ── Stage 2: full install (dev + prod deps for build tooling) ─────────────────
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install

# ── Stage 3: runtime ─────────────────────────────────────────────────────────
FROM node:20-slim AS runtime

RUN apt-get update -qq && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/
COPY seed/ ./seed/
COPY package.json ./

USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:3001/healthz || exit 1

CMD ["node", "src/index.js"]
