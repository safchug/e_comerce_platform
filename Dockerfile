FROM node:22-alpine AS base
WORKDIR /usr/src/app

FROM base AS dependencies
COPY package.json yarn.lock ./
# prisma/ must be present before the first install: installing devDependencies
# (the "prisma" CLI) runs postinstall (`prisma generate`), which needs
# prisma/schema.prisma to generate the client into src/generated/prisma. This
# is also the only install that runs with scripts enabled, so this is where
# native deps (e.g. bcrypt's build step) produce their binaries too.
COPY prisma ./prisma
RUN yarn install --frozen-lockfile

FROM dependencies AS build
COPY . .
RUN yarn build

# Prune devDependencies out of the already-installed node_modules from the
# "dependencies" stage. --ignore-scripts is safe here (unlike on a fresh
# install): the Prisma client and any native binaries were already produced
# above, so nothing needs its lifecycle scripts to run again - this step only
# removes packages that aren't in the production dependency set.
FROM dependencies AS prod-deps
RUN yarn install --frozen-lockfile --production --ignore-scripts && yarn cache clean

FROM base AS production
ENV NODE_ENV=production
COPY package.json yarn.lock ./
COPY --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/src/main"]

# Local/dev target: reuses the "build" stage, which still has devDependencies
# installed (incl. pino-pretty) and the compiled dist/. Only used by
# docker-compose for local development so console logs are colorized and
# human-readable instead of raw JSON.
FROM build AS development
ENV NODE_ENV=development

EXPOSE 3000
# Nothing else in this project applies migrations automatically (postinstall
# only runs `prisma generate`, which regenerates the client - it does not
# touch the database). Without this, a fresh/reset Postgres volume has no
# tables and every query fails with a PrismaClientKnownRequestError (P2021,
# "table does not exist"). `migrate deploy` only applies pending migrations
# and is safe to re-run on every container start.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
