FROM node:20-bullseye-slim
WORKDIR /app

# Copy source for build
COPY packages/ ./packages/
COPY apps/worker/ ./apps/worker/
COPY migrations/ ./migrations/

# Install only TypeScript (lightweight) to compile project files,
# build packages and the worker, copy built package outputs into
# local node_modules, and install only production deps for the worker.
RUN npm install --no-audit --no-fund typescript@5.3.3 --no-optional
RUN npx tsc -p packages/core || (echo "TypeScript error in core:" && npx tsc -p packages/core 2>&1 && exit 1)
RUN npx tsc -p packages/bitkub || (echo "TypeScript error in bitkub:" && npx tsc -p packages/bitkub 2>&1 && exit 1)
RUN npx tsc -p apps/worker || (echo "TypeScript error in worker:" && npx tsc -p apps/worker 2>&1 && exit 1)
RUN mkdir -p node_modules/@trader-bot/core node_modules/@trader-bot/bitkub
RUN cp packages/core/package.json node_modules/@trader-bot/core/
RUN cp -r packages/core/dist/. node_modules/@trader-bot/core/
RUN cp packages/bitkub/package.json node_modules/@trader-bot/bitkub/
RUN cp -r packages/bitkub/dist/. node_modules/@trader-bot/bitkub/
RUN npm install --no-audit --no-fund --no-optional --only=prod --prefix ./apps/worker

ENV NODE_ENV=production

# Run the built worker
CMD ["node", "apps/worker/dist/index.js"]
