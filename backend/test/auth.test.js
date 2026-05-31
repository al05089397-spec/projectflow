// test/auth.test.js
const request = require('supertest');
const { app } = require('../src/app');

describe('Autenticación JWT', () => {

  test('POST /api/auth/register — crea usuario y devuelve token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'testuser_' + Date.now() + '@mail.com',
        password: '123456'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  test('POST /api/auth/login — devuelve JWT válido', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@mail.com',
        password: '123456'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('POST /api/auth/login — rechaza credenciales incorrectas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@mail.com',
        password: 'wrongpassword'
      });
    expect(res.statusCode).toBe(401);
  });

});
