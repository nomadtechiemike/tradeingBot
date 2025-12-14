FROM node:20-bullseye-slim
WORKDIR /app

# Copy source for build
COPY packages/ ./packages/
COPY apps/worker/ ./apps/worker/
COPY migrations/ ./migrations/

# Install only TypeScript (lightweight) to compile project files,
# build packages and the worker, copy built package outputs into
# local node_modules, and install only production deps for the worker.
RUN npm install --no-audit --no-fund typescript@5.3.3 --no-optional && \
	echo "Compiling packages/core..." && \
	npx -y tsc -p packages/core && \
	echo "Compiling packages/bitkub..." && \
	npx -y tsc -p packages/bitkub && \
	echo "Compiling apps/worker..." && \
	npx -y tsc -p apps/worker && \
	echo "Setting up node_modules..." && \
	mkdir -p node_modules/@trader-bot/core && \
	cp packages/core/package.json node_modules/@trader-bot/core/ && \
	echo "Copying core dist files..." && \
	test -d packages/core/dist && test "$(ls -A packages/core/dist)" && \
	cp -r packages/core/dist/. node_modules/@trader-bot/core/ && \
	mkdir -p node_modules/@trader-bot/bitkub && \
	cp packages/bitkub/package.json node_modules/@trader-bot/bitkub/ && \
	echo "Copying bitkub dist files..." && \
	test -d packages/bitkub/dist && test "$(ls -A packages/bitkub/dist)" && \
	cp -r packages/bitkub/dist/. node_modules/@trader-bot/bitkub/ && \
	echo "Installing production dependencies..." && \
	npm install --no-audit --no-fund --no-optional --only=prod --prefix ./apps/worker

ENV NODE_ENV=production

# Run the built worker
CMD ["node", "apps/worker/dist/index.js"]
