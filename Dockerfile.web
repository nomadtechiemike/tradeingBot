FROM node:20-bullseye-slim
WORKDIR /app
COPY apps/web/package*.json ./
COPY apps/web/ ./
RUN npm ci
RUN npm run build
EXPOSE 5173
CMD ["npm","run","preview"]
