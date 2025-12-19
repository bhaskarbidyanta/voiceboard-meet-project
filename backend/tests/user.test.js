const request = require('supertest');
const mongoose = require('mongoose');
const createApp = require('../app');

let app;

beforeAll(async () => {
  // setup.js will have started and connected mongoose
  app = createApp();
});

afterAll(async () => {
  if (global.__MONGO_TEARDOWN__) await global.__MONGO_TEARDOWN__();
});

describe('User routes', () => {
  test('create user and prevent duplicate', async () => {
    const payload = { name: 'Test User', email: 'test@example.com', role: 'employee' };

    const res1 = await request(app).post('/users').send(payload);
    expect(res1.status).toBe(201);
    expect(res1.body.email).toBe('test@example.com');

    const resDup = await request(app).post('/users').send(payload);
    expect(resDup.status).toBe(409);
    expect(resDup.body.error).toBe('User already exists');
  });

  test('lookup by email succeeds and not found returns 404', async () => {
    const res = await request(app).get('/users').query({ email: 'test@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('test@example.com');

    const resNot = await request(app).get('/users').query({ email: 'doesnotexist@example.com' });
    expect(resNot.status).toBe(404);
  });
});