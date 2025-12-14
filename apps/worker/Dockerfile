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
RUN cd packages/core && npm install --no-audit --no-fund --no-optional --no-save
RUN cd packages/bitkub && npm install --no-audit --no-fund --no-optional --no-save
RUN npx tsc -p packages/core
RUN npx tsc -p packages/bitkub
RUN npx tsc -p apps/worker
RUN mkdir -p node_modules/@trader-bot/core node_modules/@trader-bot/bitkub
RUN cp packages/core/package.json node_modules/@trader-bot/core/
RUN cp -r packages/core/dist/. node_modules/@trader-bot/core/
RUN cp packages/bitkub/package.json node_modules/@trader-bot/bitkub/
RUN cp -r packages/bitkub/dist/. node_modules/@trader-bot/bitkub/
RUN npm install --no-audit --no-fund --no-optional --only=prod --prefix ./apps/worker

ENV NODE_ENV=production

# Run the built worker
CMD ["node", "apps/worker/dist/index.js"]
