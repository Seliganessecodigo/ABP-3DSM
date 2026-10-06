ARG NODE_IMAGE=node:24-alpine

FROM ${NODE_IMAGE} AS dependencies
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci

FROM dependencies AS development
WORKDIR /app/backend
COPY backend/ ./
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

FROM dependencies AS build
WORKDIR /app/backend
COPY backend/ ./
RUN npm run build

FROM ${NODE_IMAGE} AS production
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build --chown=node:node /app/backend/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "dist/main.js"]
