function errorHandler(err, req, res, next) {
  if (err.code === 'P2002') return res.status(409).json({ error: 'Такая запись уже существует' });
  if (err.code === 'P2003') return res.status(409).json({ error: 'Проверьте автора поста. Перед удалением пользователя удалите его посты' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Неверный JSON' });
  console.error(err.message);
  res.status(err.status || 500).json({
    error: err.status ? err.message : 'Внутренняя ошибка сервера'
  });
}

module.exports = errorHandler;
