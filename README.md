# КТ-3 апишка с базой данных


## Запуск

Открыть терминал в `kt03`:

```терминал
npm install
Copy-Item .env.example .env
npm run migrate
npm start
```

 Сервер на http://localhost:3000. База находится в `prisma/dev.db`

## Файлы

- `prisma/schema.prisma` — таблицы User, Post, Tag и роль USER/ADMIN.
- `prisma/migrations` — SQL миграция.
- `src/index.js` — запуск Express и подключение маршрутов.
- `src/config/index.js` — настройки из `.env`.
- `src/routes/users.js` — работа с пользователями.
- `src/routes/posts.js` — работа с постами и тегами.
- `src/middleware/validate.js` — проверка данных через Joi.
- `src/middleware/errorHandler.js` — обработка ошибок.
