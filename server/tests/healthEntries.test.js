const request = require('supertest');
const { agent, getDb } = require('./setup');
const { ObjectId } = require('mongodb');

// Add ObjectId to the global scope for easier access in tests
global.ObjectId = ObjectId;

// Test data
const testHealthEntry = {
  profileId: new ObjectId().toHexString(),
  date: new Date().toISOString(),
  notes: 'Test health entry',
  systolic: 120,
  diastolic: 80,
  heartRate: 72,
  weight: 70,
  notes: 'Feeling good',
  mood: 'happy'
};

// Helper function to create a test profile
const createTestProfile = async () => {
  const response = await agent
    .post('/api/profiles')
    .send({ name: 'Test Profile for Health Entry' });
  return response.body;
};

// Helper function to create a test health entry
const createTestHealthEntry = async (profileId, entryData = {}) => {
  const entry = { ...testHealthEntry, ...entryData, profileId };
  const response = await agent
    .post('/api/health-entries')
    .send(entry);
  return response.body;
};

describe('Health Entries API', () => {
  let testProfileId;

  // Create a test profile before all tests
  beforeAll(async () => {
    const response = await agent
      .post('/api/profiles')
      .send({ name: 'Test Profile' });

    testProfileId = response.body._id;
  });

  describe('POST /api/health-entries', () => {
    it('should create a new health entry', async () => {
      const response = await agent
        .post('/api/health-entries')
        .send({
          ...testHealthEntry,
          profileId: testProfileId
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('profileId', testProfileId);
      expect(response.body).toHaveProperty('_id');
    });

    it('should return 400 for invalid profileId', async () => {
      const response = await agent
        .post('/api/health-entries')
        .send({
          ...testHealthEntry,
          profileId: 'invalid-id'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeTruthy();
    });
  });

  describe('GET /api/health-entries/profile/:profileId', () => {
    it('should get all health entries for a profile', async () => {
      // The mock implementation returns a simulated entry
      const response = await agent
        .get(`/api/health-entries/profile/${testProfileId}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/health-entries/:entryId', () => {
    it('should get a single health entry', async () => {
      const testEntryId = new ObjectId().toHexString();
      const response = await agent
        .get(`/api/health-entries/${testEntryId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('date');
      expect(response.body).toHaveProperty('notes');
    });

    it('should return 200 for any entry ID', async () => {
      const testEntryId = new ObjectId().toHexString();
      const response = await agent
        .get(`/api/health-entries/${testEntryId}`);

      // The mock implementation returns 200 with a simulated entry for any ID
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id', testEntryId);
    });
  });

  describe('PUT /api/health-entries/:entryId', () => {
    it('should update a health entry', async () => {
      const testEntryId = new ObjectId().toHexString();
      const updatedData = {
        systolic: 130,
        diastolic: 85,
        notes: 'Updated test entry'
      };

      const response = await agent
        .put(`/api/health-entries/${testEntryId}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('systolic', 130);
      expect(response.body).toHaveProperty('diastolic', 85);
      expect(response.body).toHaveProperty('notes', 'Updated test entry');
    });
  });

  describe('DELETE /api/health-entries/:entryId', () => {
    it('should delete a health entry', async () => {
      // Create a test entry first
      const createResponse = await agent
        .post('/api/health-entries')
        .send({
          ...testHealthEntry,
          profileId: testProfileId
        });

      const response = await agent
        .delete(`/api/health-entries/${createResponse.body._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted');
    });
  });
});
