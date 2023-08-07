FROM node:20.5.0-alpine AS dev
ENV NODE_ENV development
WORKDIR /app/

COPY package.json .
COPY yarn.lock .
RUN yarn install

COPY . .

EXPOSE 3000

CMD ["yarn", "start"]
