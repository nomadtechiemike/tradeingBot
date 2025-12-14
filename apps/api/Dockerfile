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
RUN npm install --no-audit --no-fund --no-optional --no-save pg@^8.0.0 dotenv@^16.0.0 node-fetch@^3.3.2
RUN npx -y tsc -p packages/core 2>&1 | tee /tmp/tsc-packages-core.log || (echo "tsc packages/core failed; showing last 200 lines:"; tail -n 200 /tmp/tsc-packages-core.log; exit 1); \
	npx -y tsc -p packages/bitkub 2>&1 | tee /tmp/tsc-packages-bitkub.log || (echo "tsc packages/bitkub failed; showing last 200 lines:"; tail -n 200 /tmp/tsc-packages-bitkub.log; exit 1); \
	npx -y tsc -p apps/api 2>&1 | tee /tmp/tsc-apps-api.log || (echo "tsc apps/api failed; showing last 200 lines:"; tail -n 200 /tmp/tsc-apps-api.log; exit 1); \
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
