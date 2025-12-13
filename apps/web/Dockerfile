FROM node:20-bullseye-slim
WORKDIR /app
COPY apps/web/package*.json ./
COPY apps/web/ ./
# Increase Node heap for install and avoid optional packages
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN set -eux; \
	npm install --legacy-peer-deps --no-audit --no-fund --no-optional --loglevel=verbose 2>&1 | tee /tmp/npm-install.log || (echo "npm install failed; showing last 200 lines of log:"; tail -n 200 /tmp/npm-install.log; exit 1); \
	npm run build
EXPOSE 5173
CMD ["npm","run","preview"]
