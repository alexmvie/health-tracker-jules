const request = require('supertest');
const setup = require('./setup');
const agent = setup.agent;
const { testUser } = require('./testData');

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await agent
        .post('/api/auth/register')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body.user).toHaveProperty('email', testUser.email);
    });

    it('should return 400 for invalid email', async () => {
      const response = await agent
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: testUser.password
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeTruthy();
    });

    it('should return 400 for short password', async () => {
      const response = await agent
        .post('/api/auth/register')
        .send({
          email: testUser.email,
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeTruthy();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // First register the user
      await agent
        .post('/api/auth/register')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      // Then try to login
      const response = await agent
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', testUser.email);
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await agent
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrong-password'
        });

      expect(response.status).toBe(401);
    });
  });
});
