const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');

const server = spawn(process.execPath, ['src/index.js'], {
  env: { ...process.env, PORT: '3093' }, stdio: ['ignore', 'pipe', 'inherit']
});

async function request(path, method = 'GET', body, status = 200) {
  const response = await fetch('http://127.0.0.1:3093/api' + path, {
    method, headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = response.status === 204 ? null : await response.json();
  assert.equal(response.status, status, JSON.stringify(data));
  return data;
}

server.stdout.once('data', () => {});
async function check() {
  for (let i = 0; i < 100; i++) {
    try { await fetch('http://127.0.0.1:3093/'); break; }
    catch { await new Promise((resolve) => setTimeout(resolve, 100)); }
  }
  const user = await request('/users', 'POST', { email: `test${Date.now()}@example.com`, name: 'Данил' }, 201);
  await request('/users', 'POST', { email: user.email, name: 'Данил' }, 409);
  await request('/posts', 'POST', {}, 400);
  const post = await request('/posts', 'POST', { title: 'Первый ПОСТ', authorId: user.id, published: true, tags: ['node', 'api'] }, 201);
  assert.equal(post.tags.length, 2);
  const second = await request('/posts', 'POST', { title: 'Черновик', authorId: user.id, tags: ['node'] }, 201);
  assert.equal(second.tags[0].id, post.tags.find((tag) => tag.name === 'node').id);
  const list = await request(`/posts?search=первый&published=true&authorId=${user.id}&page=1&limit=1`);
  assert.equal(list.meta.total, 1);
  assert.equal(list.data[0].id, post.id);
  const users = await request('/users?page=1&limit=1');
  assert.equal(users.data.length, 1);
  const detail = await request(`/users/${user.id}`);
  assert.equal(detail.posts.length, 2);
  assert.ok(new Date(detail.posts[0].createdAt) >= new Date(detail.posts[1].createdAt));
  const found = await request(`/posts/${post.id}`);
  assert.equal(found.author.id, user.id);
  const updated = await request(`/posts/${post.id}`, 'PATCH', { published: false, tags: ['new'] });
  assert.equal(updated.published, false);
  assert.deepEqual(updated.tags.map((tag) => tag.name), ['new']);
  await request(`/users/${user.id}`, 'PATCH', { name: 'Новое имя' });
  await request('/posts?page=abc', 'GET', undefined, 400);
  await request('/users/abc', 'GET', undefined, 400);
  await request(`/posts/${post.id}`, 'DELETE', undefined, 204);
  await request(`/posts/${post.id}`, 'GET', undefined, 404);
  await request(`/posts/${second.id}`, 'DELETE', undefined, 204);
  await request(`/users/${user.id}`, 'DELETE', undefined, 204);
  console.log('Проверка пройдена: CRUD, связи, теги, фильтры, пагинация и ошибки.');
}

check().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => server.kill());
