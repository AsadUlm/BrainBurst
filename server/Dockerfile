# Используем официальный Node.js образ
FROM node:20-slim

# Рабочая директория внутри контейнера
WORKDIR /app

# Копируем только package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости в контейнере
RUN npm install

# Копируем остальной код
COPY . .

# Открываем порт (если хочешь явно)
EXPOSE 5000

# Запускаем приложение
CMD ["npm", "run", "dev"]
