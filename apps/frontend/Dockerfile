# Production Dockerfile for Next.js App Router
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/frontend/package*.json ./apps/frontend/

RUN npm ci

COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/frontend

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /app/apps/frontend/package*.json ./apps/frontend/
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=apps/frontend"]
