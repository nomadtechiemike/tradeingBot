FROM node:20-bullseye-slim
WORKDIR /app

# Copy source for build
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY migrations/ ./migrations/

# Install only TypeScript (lightweight) to compile project files
# then build packages and the API, copy built package outputs into
# local node_modules, and install only production deps for the API.
RUN npm install --no-audit --no-fund typescript@5.3.3 --no-optional
RUN npx tsc -p packages/core
RUN npx tsc -p packages/bitkub
RUN npx tsc -p apps/api
RUN mkdir -p node_modules/@trader-bot/core node_modules/@trader-bot/bitkub
RUN cp packages/core/package.json node_modules/@trader-bot/core/
RUN cp -r packages/core/dist/. node_modules/@trader-bot/core/
RUN cp packages/bitkub/package.json node_modules/@trader-bot/bitkub/
RUN cp -r packages/bitkub/dist/. node_modules/@trader-bot/bitkub/
RUN npm install --no-audit --no-fund --no-optional --only=prod --prefix ./apps/api

ENV NODE_ENV=production

# Expose and run the built API
EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
