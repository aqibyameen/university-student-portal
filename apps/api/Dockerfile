FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Install dependencies
FROM base AS deps
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/
RUN npm install --workspaces --if-present

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build -w @portal/types -w @portal/validation -w @portal/api

# Production runtime
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 apiuser
WORKDIR /app

COPY --from=builder --chown=apiuser:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=apiuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=apiuser:nodejs /app/prisma ./prisma

RUN mkdir -p uploads && chown apiuser:nodejs uploads
USER apiuser

EXPOSE 4000
CMD ["node", "dist/server.js"]
