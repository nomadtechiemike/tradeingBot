FROM node:20-bullseye-slim
WORKDIR /app
COPY apps/web/package*.json ./
COPY apps/web/ ./
# Increase Node heap for install and avoid optional packages
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN set -eux; \
	echo "Starting npm install..."; \
	npm install --legacy-peer-deps --no-audit --no-fund --no-optional --loglevel=error 2>&1 | tee /tmp/npm-install.log || (echo "npm install failed; showing last 200 lines of log:"; tail -n 200 /tmp/npm-install.log; exit 1); \
	echo "npm install completed successfully"; \
	echo "Starting build..."; \
	npm run build 2>&1 | tee /tmp/npm-build.log || (echo "npm build failed; showing last 200 lines of log:"; tail -n 200 /tmp/npm-build.log; exit 1); \
	echo "Build completed successfully"; \
	ls -la dist/ || (echo "ERROR: dist directory not created"; exit 1)
EXPOSE 5173
CMD ["npm","run","preview"]
