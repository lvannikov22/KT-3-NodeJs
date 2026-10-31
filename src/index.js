const express = require('express');
const config = require('./config');
const usersRouter = require('./routes/users');
const postsRouter = require('./routes/posts');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(express.json());
app.get('/', (req, res) => res.json({ message: 'KT-3 API работает' }));
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use((req, res) => res.status(404).json({ error: 'Маршрут не найден' }));
app.use(errorHandler);

app.listen(config.port, () => console.log(`Сервер запущен: http://localhost:${config.port}`));
