FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --from=builder /app/prisma/init.mjs ./prisma/init.mjs
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma

RUN mkdir -p /app/prisma/data /app/uploads && chown -R nextjs:nodejs /app/prisma/data /app/uploads

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3008

ENV PORT=3008
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:./data/signage.db"
ENV UPLOADS_DIR="/app/uploads"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
