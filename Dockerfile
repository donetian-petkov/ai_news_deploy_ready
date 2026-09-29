FROM node:20-bookworm-slim AS deps
WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

FROM deps AS builder
WORKDIR /app

# Browsers reach the API at these addresses; Next bakes them into the web build, so they must be
# known here. docker-compose passes them from .env (which is kept out of the build context).
ARG NEXT_PUBLIC_WS_URL=ws://localhost:4000
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages

RUN npm run build -w @ai-news/shared \
 && npm run build -w @ai-news/api \
 && npm run build -w @ai-news/web \
 && npm run prisma:generate -w @ai-news/api

FROM node:20-bookworm-slim AS api
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_URL=file:/data/dev.db

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages/shared ./packages/shared

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy --schema apps/api/prisma/schema.prisma && node apps/api/dist/server.js"]

FROM node:20-bookworm-slim AS web
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/packages/shared ./packages/shared

EXPOSE 3000
CMD ["npm", "run", "start", "-w", "@ai-news/web"]
