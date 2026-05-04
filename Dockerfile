# syntax=docker/dockerfile:1
# Build context: urule-repos/ (parent of urule and the standalone). Compose:
#   build:
#     context: ../../..
#     dockerfile: approvals/Dockerfile
#
# Workspace deps (@urule/auth-middleware, @urule/correlation-id, @urule/events)
# are referenced as `file:..` paths in package.json and resolved here via
# copies into the build context. Caller is expected to have run
# `npm --prefix urule run build` so the consumed dist/ directories are
# populated before `docker compose build`.

FROM node:20-slim AS builder
WORKDIR /app
COPY urule/packages/auth-middleware/package.json urule/packages/auth-middleware/package.json
COPY urule/packages/auth-middleware/dist urule/packages/auth-middleware/dist
COPY urule/packages/correlation-id/package.json urule/packages/correlation-id/package.json
COPY urule/packages/correlation-id/dist urule/packages/correlation-id/dist
COPY urule/packages/events/package.json urule/packages/events/package.json
COPY urule/packages/events/dist urule/packages/events/dist
COPY approvals/package.json approvals/package-lock.json approvals/
WORKDIR /app/approvals
RUN npm ci
COPY approvals/tsconfig.json ./
COPY approvals/src ./src
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY urule/packages/auth-middleware/package.json urule/packages/auth-middleware/package.json
COPY urule/packages/auth-middleware/dist urule/packages/auth-middleware/dist
COPY urule/packages/correlation-id/package.json urule/packages/correlation-id/package.json
COPY urule/packages/correlation-id/dist urule/packages/correlation-id/dist
COPY urule/packages/events/package.json urule/packages/events/package.json
COPY urule/packages/events/dist urule/packages/events/dist
COPY approvals/package.json approvals/package-lock.json approvals/
WORKDIR /app/approvals
RUN npm ci --omit=dev
COPY --from=builder /app/approvals/dist ./dist
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/healthz').then(r=>{if(!r.ok)throw 1}).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
