# Production Dockerfile for Express + Prisma Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy monorepo config
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/backend/package*.json ./apps/backend/

RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Generate Prisma client
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

# Build shared package
RUN npm run build --workspace=packages/shared

# Build backend
RUN npx tsc --project apps/backend/tsconfig.json

# Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Production dependencies only — keeps devDependencies out of the image
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/backend/package*.json ./apps/backend/
RUN npm ci --omit=dev

# Regenerate the Prisma Client against production-only node_modules
COPY apps/backend/prisma ./apps/backend/prisma
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

EXPOSE 4000

CMD ["node", "apps/backend/dist/server.js"]
