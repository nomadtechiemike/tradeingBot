FROM node:20-bullseye-slim
WORKDIR /app
COPY apps/web/package*.json ./
COPY apps/web/ ./
RUN npm install --legacy-peer-deps
# Use `npm install` instead of `npm ci` to avoid failing when a lockfile
# or workspace resolution is not present in the build context (Portainer).
RUN npm run build
EXPOSE 5173
CMD ["npm","run","preview"]
