# ------------------------------------------------------------------------------
# Build Stage: Compile Vite React 19 SPA
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Cache dependencies
COPY package*.json ./
RUN npm ci

# Copy client source files
COPY . .

# Build-time argument for API endpoint (baked into Vite client bundle)
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL

# Build production assets to /app/dist
RUN npm run build

# ------------------------------------------------------------------------------
# Production Stage: High-Performance Nginx Web Server
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

# Copy custom Nginx configuration with SPA routing and security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
