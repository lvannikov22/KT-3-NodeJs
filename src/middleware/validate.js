const Joi = require('joi');

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).required(),
  role: Joi.string().valid('USER', 'ADMIN').default('USER')
});

const userUpdateSchema = Joi.object({
  email: Joi.string().email(),
  name: Joi.string().min(2),
  role: Joi.string().valid('USER', 'ADMIN')
}).min(1);

const postSchema = Joi.object({
  title: Joi.string().required(),
  content: Joi.string().allow('', null),
  published: Joi.boolean().default(false),
  authorId: Joi.number().integer().required(),
  tags: Joi.array().items(Joi.string()).default([])
});

const postUpdateSchema = Joi.object({
  title: Joi.string(),
  content: Joi.string().allow('', null),
  published: Joi.boolean(),
  authorId: Joi.number().integer(),
  tags: Joi.array().items(Joi.string())
}).min(1);

function validate(schema) {
  return (req, res, next) => {
    const result = schema.required().validate(req.body, { abortEarly: false, stripUnknown: true });
    if (result.error) {
      return res.status(400).json({ error: 'Ошибка валидации', details: result.error.details.map((x) => x.message) });
    }
    req.body = result.value;
    next();
  };
}

function validateQuery(req, res, next) {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string(),
    published: Joi.string().valid('true', 'false'),
    authorId: Joi.number().integer().positive()
  });
  const result = schema.validate(req.query);
  if (result.error) return res.status(400).json({ error: result.error.message });
  res.locals.query = result.value;
  next();
}

function validateId(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: 'id должен быть положительным целым числом' });
  }
  next();
}

module.exports = { validate, validateQuery, validateId, userSchema, userUpdateSchema, postSchema, postUpdateSchema };
