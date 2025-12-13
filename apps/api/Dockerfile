FROM node:20-bullseye-slim
WORKDIR /app

# Copy manifest and source for build
COPY package*.json turbo.json tsconfig.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install deps (include dev deps for build) and build packages
RUN npm ci
RUN npm run build

ENV NODE_ENV=production

# Expose and run the built API
EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
