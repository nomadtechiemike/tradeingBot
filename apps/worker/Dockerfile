FROM node:20-bullseye-slim
WORKDIR /app

# Copy manifest and source for build
COPY package*.json turbo.json tsconfig.json ./
COPY packages/ ./packages/
COPY apps/worker/ ./apps/worker/

# Install deps (include dev deps for build) and build packages
RUN set -eux; \
	npm install --legacy-peer-deps --no-audit --no-fund --loglevel=verbose 2>&1 | tee /tmp/npm-install.log || (echo "npm install failed; showing last 200 lines of log:"; tail -n 200 /tmp/npm-install.log; exit 1); \
	npm run build

ENV NODE_ENV=production

# Run the built worker
CMD ["node", "apps/worker/dist/index.js"]
