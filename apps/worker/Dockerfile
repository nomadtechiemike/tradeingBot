FROM node:20-bullseye-slim
WORKDIR /app

# Copy manifest and source for build
COPY package*.json turbo.json tsconfig.json ./
COPY packages/ ./packages/
COPY apps/worker/ ./apps/worker/

# Install deps (include dev deps for build) and build packages
RUN npm ci
RUN npm run build

ENV NODE_ENV=production

# Run the built worker
CMD ["node", "apps/worker/dist/index.js"]
