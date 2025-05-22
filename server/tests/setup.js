// Load environment variables from .env file
require('dotenv').config({ path: '.env' });

const mongoose = require('mongoose');
const { connectToMongoDB, getDb } = require('../lib/mongoClient');
const supertest = require('supertest');
const { ObjectId } = require('mongodb');
const app = require('../index');

// Test user token for authentication
const TEST_USER_ID = new ObjectId().toHexString();
const TEST_TOKEN = 'test-token'; // In a real app, this would be a valid JWT

// Simple middleware to simulate authentication
const mockAuth = (req, res, next) => {
  // For testing, we'll just set a user on the request
  req.user = { _id: TEST_USER_ID };
  next();
};

// Apply our mock auth middleware to all routes that need it
app.use((req, res, next) => {
  // Skip auth for certain routes if needed
  if (req.path.startsWith('/api/auth/') || 
      req.method === 'OPTIONS' || 
      req.path === '/health' ||
      (req.path === '/api/profiles' && req.method === 'GET')) {
    return next();
  }
  
  // For all other routes, use our mock auth
  mockAuth(req, res, next);
});

// Create a test agent for making HTTP requests
const agent = supertest.agent(app);

// Increase test timeout to 30 seconds
jest.setTimeout(30000);

// Before all tests
beforeAll(async () => {
  try {
    // Connect to MongoDB using the existing connection logic
    console.log('Connecting to MongoDB...');
    const client = await connectToMongoDB();
    
    if (!client) {
      throw new Error('Failed to connect to MongoDB');
    }
    
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Error in test setup:', error);
    throw error;
  }
});

// After all tests
afterAll(async () => {
  try {
    // Close the MongoDB connection
    if (mongoose.connection.readyState !== 0) { // 0 = disconnected
      console.log('Disconnecting Mongoose...');
      await mongoose.disconnect();
    }
    
    console.log('Test cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
});

// Before each test
beforeEach(async () => {
  try {
    const db = getDb();
    if (!db) {
      console.warn('Database not available for cleanup');
      return;
    }
    
    // Get all collections
    const collections = await db.collections();
    
    // Delete all documents from each collection (except system collections)
    for (const collection of collections) {
      try {
        if (!collection.collectionName.startsWith('system.')) {
          await collection.deleteMany({});
        }
      } catch (error) {
        console.error(`Error cleaning collection ${collection.collectionName}:`, error);
      }
    }
  } catch (error) {
    console.error('Error during test cleanup:', error);
  }
});

// Export the test agent and other utilities
module.exports = { agent, getDb };
