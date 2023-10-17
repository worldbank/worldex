FROM node:20.5.0-alpine AS build
ENV NODE_ENV production
WORKDIR /app/

COPY package.json .
COPY yarn.lock .

RUN yarn install

COPY . .

RUN yarn build

FROM node:20.5.0-alpine AS prod
WORKDIR /app/

COPY --from=build /app/build/ /app/build/

COPY package.json .
COPY vite.config.ts .

RUN yarn add typescript

EXPOSE 4173
CMD ["yarn", "serve"]
