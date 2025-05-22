const setup = require('./setup');
const request = require('supertest');
const { agent, getDb } = require('./setup');
const { ObjectId } = require('mongodb');

// Test data
const testProfile = {
  name: 'Test Profile'
};

// Helper function to create a test profile
const createTestProfile = async (name = testProfile.name) => {
  const response = await agent
    .post('/api/profiles')
    .send({ name });
  return response.body;
};

describe('Profile API', () => {
  // Test database connection
  it('should have a working database connection', () => {
    const db = getDb();
    expect(db).toBeDefined();
  });

  describe('POST /api/profiles', () => {
    it('should create a new profile', async () => {
      const response = await agent
        .post('/api/profiles')
        .send({ name: testProfile.name });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('name', testProfile.name);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should return 400 for missing name', async () => {
      const response = await agent
        .post('/api/profiles')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors[0]).toHaveProperty('msg', 'Profile name is required.');
    });
  });

  describe('GET /api/profiles', () => {
    it('should get all profiles', async () => {
      // The mock implementation returns a single profile for GET /api/profiles
      const response = await agent.get('/api/profiles');
      
      // The mock returns a 200 with an array of profiles
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/profiles/:profileId', () => {
    it('should get a single profile', async () => {
      // First, create a test profile
      const profile = await createTestProfile();
      
      const response = await agent
        .get(`/api/profiles/${profile._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('_id', profile._id);
    });

    it('should return 200 with a profile for any valid profileId', async () => {
      const { ObjectId } = require('mongodb');
      const testId = new ObjectId().toHexString();
      const response = await agent
        .get(`/api/profiles/${testId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should return 400 for invalid profileId format', async () => {
      const response = await agent
        .get('/api/profiles/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors[0]).toHaveProperty('msg', 'Invalid profileId format in URL parameter.');
    });
  });

  describe('PUT /api/profiles/:profileId', () => {
    it('should update a profile', async () => {
      // First, create a test profile
      const profile = await createTestProfile();
      const updatedName = 'Updated Profile Name';
      
      const response = await agent
        .put(`/api/profiles/${profile._id}`)
        .send({ name: updatedName });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', updatedName);
      expect(response.body).toHaveProperty('_id', profile._id);
    });

    it('should return 200 with updated profile for any valid profileId', async () => {
      const { ObjectId } = require('mongodb');
      const testId = new ObjectId().toHexString();
      const response = await agent
        .put(`/api/profiles/${testId}`)
        .send({ name: 'Updated Profile' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('name', 'Updated Profile');
      expect(response.body).toHaveProperty('updatedAt');
    });
  });

  describe('DELETE /api/profiles/:profileId', () => {
    it('should delete a profile', async () => {
      // First, create a test profile
      const profile = await createTestProfile();
      
      const response = await agent
        .delete(`/api/profiles/${profile._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted');
    });
  });
});
