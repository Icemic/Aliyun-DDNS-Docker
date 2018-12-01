FROM node:10

WORKDIR /app
COPY . /app

RUN npm install

CMD ["node", "index.js"]