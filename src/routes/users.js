const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { validate, validateQuery, validateId, userSchema, userUpdateSchema } = require('../middleware/validate');

const router = express.Router();
const prisma = new PrismaClient();

router.param('id', validateId);

router.get('/', validateQuery, async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const total = await prisma.user.count();
    const data = await prisma.user.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { id: 'asc' } });
    res.json({ data, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) }, include: { posts: { orderBy: { createdAt: 'desc' } } } });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(user);
  } catch (error) { next(error); }
});

router.post('/', validate(userSchema), async (req, res, next) => {
  try { res.status(201).json(await prisma.user.create({ data: req.body })); }
  catch (error) { if (error.code === 'P2002') return res.status(409).json({ error: 'Email уже используется' }); next(error); }
});

router.patch('/:id', validate(userUpdateSchema), async (req, res, next) => {
  try { res.json(await prisma.user.update({ where: { id: Number(req.params.id) }, data: req.body })); }
  catch (error) { if (error.code === 'P2025') return res.status(404).json({ error: 'Пользователь не найден' }); next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try { await prisma.user.delete({ where: { id: Number(req.params.id) } }); res.status(204).send(); }
  catch (error) { if (error.code === 'P2025') return res.status(404).json({ error: 'Пользователь не найден' }); next(error); }
});

module.exports = router;
