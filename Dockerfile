FROM node:18-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Собираем TypeScript (если используется)
# RUN npm run build

EXPOSE 3000

# Запуск Fastify сервера
CMD ["npx", "ts-node", "src/backend/fastify_race_condition_fix.ts"]
