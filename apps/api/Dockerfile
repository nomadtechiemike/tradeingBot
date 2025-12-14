FROM node:20-bullseye-slim
WORKDIR /app

# Copy source for build
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY migrations/ ./migrations/

# Install only TypeScript (lightweight) to compile project files
# then build packages and the API, copy built package outputs into
# local node_modules, and install only production deps for the API.
RUN set -eux; \
	npm install --no-audit --no-fund typescript@5.3.3 --no-optional; \
	npx -y tsc -p packages/core || (echo "TypeScript compilation failed for core"; exit 1); \
	npx -y tsc -p packages/bitkub || (echo "TypeScript compilation failed for bitkub"; exit 1); \
	npx -y tsc -p apps/api || (echo "TypeScript compilation failed for api"; exit 1); \
	mkdir -p node_modules/@trader-bot/core; \
	cp packages/core/package.json node_modules/@trader-bot/core/; \
	if [ -d packages/core/dist ] && [ "$(ls -A packages/core/dist 2>/dev/null)" ]; then \
		cp -r packages/core/dist/* node_modules/@trader-bot/core/; \
	else \
		echo "ERROR: packages/core/dist is missing or empty"; exit 1; \
	fi; \
	mkdir -p node_modules/@trader-bot/bitkub; \
	cp packages/bitkub/package.json node_modules/@trader-bot/bitkub/; \
	if [ -d packages/bitkub/dist ] && [ "$(ls -A packages/bitkub/dist 2>/dev/null)" ]; then \
		cp -r packages/bitkub/dist/* node_modules/@trader-bot/bitkub/; \
	else \
		echo "ERROR: packages/bitkub/dist is missing or empty"; exit 1; \
	fi; \
	npm install --no-audit --no-fund --no-optional --only=prod --prefix ./apps/api

ENV NODE_ENV=production

# Expose and run the built API
EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
