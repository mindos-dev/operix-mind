FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/ai-agents/package.json packages/ai-agents/package.json
COPY packages/ai-runtime/package.json packages/ai-runtime/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY local-agent/package.json local-agent/package.json

RUN npm ci

COPY . .
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npm run build
RUN npm prune --omit=dev
RUN mkdir -p /app/storage/uploads /app/backups

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/ai-agents/package.json packages/ai-agents/package.json
COPY packages/ai-runtime/package.json packages/ai-runtime/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY local-agent/package.json local-agent/package.json

RUN npm ci --omit=dev --workspaces --include-workspace-root

COPY --from=build /app/node_modules/.prisma node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client node_modules/@prisma/client
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/packages/ai-agents/dist packages/ai-agents/dist
COPY --from=build /app/packages/ai-runtime/dist packages/ai-runtime/dist
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/storage storage
COPY --from=build /app/backups backups

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:3333/health/readiness').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

RUN chown -R node:node /app
USER node

EXPOSE 3333
CMD ["node", "apps/api/dist/server.js"]
