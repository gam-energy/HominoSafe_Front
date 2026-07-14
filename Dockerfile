# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
# NEXT_PUBLIC_* / rewrite target are evaluated at build time for next.config.
ARG NEXT_PUBLIC_API_URL=
ARG API_PROXY_TARGET=http://homino_app:8888
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV API_PROXY_TARGET=$API_PROXY_TARGET
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
# Use turbopack (default) instead of `npm run build` which forces --webpack;
# webpack mode has a module-resolution bug with path aliases in this Next version.
RUN npx next build

# Stage 2: Prepare production image
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
RUN npm ci --only=production --legacy-peer-deps
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
