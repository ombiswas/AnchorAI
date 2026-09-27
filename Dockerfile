# ==============================================================================
# AnchorAI Unified Full-Stack Dockerfile
# Builds both Client (Vite React) and Server (Express TypeScript) into a single
# production container suitable for single-service platforms (Render, Railway, Fly.io).
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Client (Frontend SPA)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS client-builder

WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./

# In unified single-container deployment, the frontend accesses the API relative to current origin (/api)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Build Server (Express API)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS server-builder

WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 3: Production Runtime
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install server production dependencies
COPY server/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled backend output
COPY --from=server-builder /app/server/dist ./dist

# Copy compiled frontend assets for static serving by Express
COPY --from=client-builder /app/client/dist ./client-dist

# Create uploads directory and set node user ownership
RUN mkdir -p uploads && chown -R node:node /app

USER node

EXPOSE 5000

CMD ["node", "dist/server.js"]
