FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY --chown=node:node src ./src
USER node
EXPOSE 3333
CMD ["node", "src/index.js"]
