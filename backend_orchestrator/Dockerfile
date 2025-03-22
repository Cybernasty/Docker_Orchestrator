FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 5000

RUN npm install -g nodemon

ENV MONGO_URI=mongodb+srv://zitounimontassar:R7XuZLoVK4QCFw0P@orcherstration.pscxr.mongodb.net/containers?retryWrites=true&w=majority&appName=Orcherstration

CMD ["npm", "run", "start"]
