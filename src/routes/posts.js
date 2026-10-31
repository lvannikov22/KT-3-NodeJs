const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { validate, validateQuery, validateId, postSchema, postUpdateSchema } = require('../middleware/validate');

const router = express.Router();
const prisma = new PrismaClient();

function postData(body) {
  const data = { title: body.title, content: body.content, published: body.published, authorId: body.authorId };
  if (body.tags) data.tags = { connectOrCreate: [...new Set(body.tags)].map((name) => ({ where: { name }, create: { name } })) };
  return data;
}

router.param('id', validateId);

router.get('/', validateQuery, async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const where = {};
    if (req.query.search) {
      // В SQLite нет mode: 'insensitive', поэтому сравниваем в нижнем регистре.
      const posts = await prisma.post.findMany({ select: { id: true, title: true } });
      const search = req.query.search.toLowerCase();
      where.id = { in: posts.filter((post) => post.title.toLowerCase().includes(search)).map((post) => post.id) };
    }
    if (req.query.published !== undefined) where.published = req.query.published === 'true';
    if (req.query.authorId) where.authorId = Number(req.query.authorId);
    const total = await prisma.post.count({ where });
    const data = await prisma.post.findMany({ where, skip: (page - 1) * limit, take: limit, include: { author: true, tags: true }, orderBy: { createdAt: 'desc' } });
    res.json({ data, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: Number(req.params.id) }, include: { author: true, tags: true } });
    if (!post) return res.status(404).json({ error: 'Пост не найден' });
    res.json(post);
  } catch (error) { next(error); }
});

router.post('/', validate(postSchema), async (req, res, next) => {
  try { res.status(201).json(await prisma.post.create({ data: postData(req.body), include: { author: true, tags: true } })); }
  catch (error) { if (error.code === 'P2025') return res.status(400).json({ error: 'Автор не найден' }); next(error); }
});

router.patch('/:id', validate(postUpdateSchema), async (req, res, next) => {
  try {
    const data = postData(req.body);
    if (data.tags) data.tags = { set: [], ...data.tags };
    res.json(await prisma.post.update({ where: { id: Number(req.params.id) }, data, include: { author: true, tags: true } }));
  }
  catch (error) { if (error.code === 'P2025') return res.status(404).json({ error: 'Пост не найден' }); next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try { await prisma.post.delete({ where: { id: Number(req.params.id) } }); res.status(204).send(); }
  catch (error) { if (error.code === 'P2025') return res.status(404).json({ error: 'Пост не найден' }); next(error); }
});

module.exports = router;
