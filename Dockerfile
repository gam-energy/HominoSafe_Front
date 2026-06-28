# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:8888
ARG NEXT_PUBLIC_SYNAPSE_URL=http://localhost:8008
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SYNAPSE_URL=$NEXT_PUBLIC_SYNAPSE_URL
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Prepare production image
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
RUN npm ci --only=production --legacy-peer-deps
EXPOSE 3002
ENV NODE_ENV=production
CMD ["npm", "start"]