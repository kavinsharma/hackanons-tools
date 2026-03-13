FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# ---- Install dependencies ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Build the app ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js
RUN npm run build

# ---- Production runner ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy everything needed to run the custom server
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.server.json ./tsconfig.server.json
COPY --from=builder /app/src/lib ./src/lib
COPY --from=builder /app/next.config.ts ./next.config.ts

# Create data directory for tracker cache (persists via volume)
RUN mkdir -p data && chown -R nextjs:nodejs data .next

USER nextjs

EXPOSE 3000

# Health check for Easypanel
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/trackers || exit 1

CMD ["npx", "tsx", "server.ts"]
