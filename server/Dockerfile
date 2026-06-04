FROM node:20-alpine

WORKDIR /app

# Встановлення залежностей (кешується окремим шаром)
COPY package*.json ./
RUN npm install --omit=dev

# Код застосунку
COPY . .

EXPOSE 4000

CMD ["npm", "start"]
