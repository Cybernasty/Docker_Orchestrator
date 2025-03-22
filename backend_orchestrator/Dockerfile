FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 5000

RUN npm install -g nodemon

CMD ["npm", "run", "start"]
