FROM node:20-bullseye-slim
WORKDIR /app

# Copy manifest and source for build
COPY package*.json turbo.json tsconfig.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install deps (include dev deps for build) and build packages
# Use `npm install` instead of `npm ci` to avoid failing when a lockfile
# or workspace resolution is not present in the build context (Portainer).
RUN set -eux; \
	ENV NODE_OPTIONS=--max-old-space-size=4096
	npm install --legacy-peer-deps --no-audit --no-fund --no-optional --loglevel=verbose 2>&1 | tee /tmp/npm-install.log || (echo "npm install failed; showing last 200 lines of log:"; tail -n 200 /tmp/npm-install.log; exit 1); \
	npm run build

ENV NODE_ENV=production

# Expose and run the built API
EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
