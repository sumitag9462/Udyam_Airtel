# ── Stage 1: build the Vite app ───────────────────────────────────────────────
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ── Stage 2: serve the static bundle ─────────────────────────────────────────
FROM node:20-slim AS serve
RUN npm i -g serve
WORKDIR /app
COPY --from=build /app/dist ./dist

USER node

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]
