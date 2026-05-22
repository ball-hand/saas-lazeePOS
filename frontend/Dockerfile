FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Use polling in Docker so file changes are detected reliably
ENV CHOKIDAR_USEPOLLING=true

CMD ["npm", "run", "dev"]
