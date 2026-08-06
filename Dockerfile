FROM node:22-alpine AS base
WORKDIR /usr/src/app

FROM base AS dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM dependencies AS build
COPY . .
RUN yarn build

FROM base AS production
ENV NODE_ENV=production
COPY package.json yarn.lock ./
# --ignore-scripts: the "prisma" CLI is a devDependency (not installed here) and
# prisma/schema.prisma isn't copied into this stage, so postinstall's `prisma
# generate` would fail. The generated client is already compiled into dist by
# the build stage, so regenerating it here is unnecessary.
RUN yarn install --frozen-lockfile --production --ignore-scripts && yarn cache clean
COPY --from=build /usr/src/app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main"]
