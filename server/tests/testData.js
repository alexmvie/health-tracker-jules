const jwt = require('jsonwebtoken');

// Test user data
const testUser = {
  email: 'testuser@example.com',
  password: 'password123',
  id: 'test-user-id'
};

// Test profile data
const testProfile = {
  name: 'Test Profile',
  userId: testUser.id
};

// Test health entry data
const testHealthEntry = {
  profileId: 'test-profile-id',
  date: new Date().toISOString(),
  systolic: 120,
  diastolic: 80,
  pulse: 70,
  spO2: 98,
  weight: 75.5,
  medications: 'Test medication',
  notes: 'Test notes'
};

// Generate test token
const testToken = jwt.sign({
  userId: testUser.id,
  email: testUser.email
}, process.env.JWT_SECRET || 'test-secret', {
  expiresIn: '1h'
});

module.exports = {
  testUser,
  testProfile,
  testHealthEntry,
  testToken
};
