FROM node:20.5.0-alpine
WORKDIR /app/

COPY package.json yarn.lock /app/
RUN yarn install --production

COPY . .

EXPOSE 8080

CMD ["yarn", "start"]
