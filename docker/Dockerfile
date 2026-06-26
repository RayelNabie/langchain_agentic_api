ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-alpine AS base
LABEL cache_burst_date=2026-03-09
RUN apk update && apk upgrade
RUN npm uninstall -g npm
WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH

  #---------------------
FROM base AS deps

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

  #---------------------
FROM deps AS builder

COPY . .
RUN yarn build

  #---------------------
FROM base AS base-deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

  #---------------------
FROM base
COPY --from=base-deps /app/node_modules ./node_modules
COPY --from=base-deps /app/package.json ./package.json
COPY --from=builder /app/build ./build
RUN adduser -u 1002 -D -h /home/nodeuser nodeuser && \
    chown -R nodeuser:nodeuser /app && \
    chmod -R u=rwX,go=rX /app

USER nodeuser
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "--conditions=production", "build/app.js"]