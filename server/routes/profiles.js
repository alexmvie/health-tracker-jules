const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/mongoClient');
const { ObjectId } = require('mongodb'); // For creating ObjectIds if needed by business logic
const { body, param, validationResult } = require('express-validator');
const { protect } = require('../middleware/authMiddleware'); // Corrected path for protect middleware

// Middleware to log request details for this router
router.use((req, res, next) => {
  console.log(`Profiles Route: ${req.method} ${req.originalUrl} - Body:`, req.body);
  next();
});

// POST / (Create Profile)
router.post('/', 
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Profile name is required.')
      .escape(), // Basic XSS protection
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = getDb();
    const { name } = req.body;

    if (!db) {
    console.log('POST /api/profiles - DB not available, returning mock created profile.');
    const mockNewProfile = { _id: new ObjectId().toHexString(), name, createdAt: new Date() };
    return res.status(201).json(mockNewProfile);
  }

  try {
    // This is where actual database interaction would occur.
    // Since DB connection is a placeholder, we'll simulate success.
    console.log('POST /api/profiles - Simulating profile creation in DB.');
    const simulatedProfile = { _id: new ObjectId().toHexString(), name, createdAt: new Date() };
    // Example: const result = await db.collection('profiles').insertOne({ name, createdAt: new Date() });
    // const simulatedProfile = { _id: result.insertedId, name, createdAt: new Date() };
    res.status(201).json(simulatedProfile);
  } catch (error) {
    console.error('POST /api/profiles - Error during simulated DB operation:', error.message);
    res.status(500).json({ message: 'Failed to create profile due to server error.', error: error.message });
  }
});

// GET / (Get All Profiles)
// This route is now protected
router.get('/', protect, async (req, res, next) => { // Added protect middleware
  try {
    // DELIBERATE ERROR FOR TESTING CENTRALIZED ERROR HANDLER (can be removed or kept for testing)
    if (process.env.TEST_THROW_ERROR === 'true') { // Control throwing error with an env variable
      const testError = new Error('Deliberate test error in GET /api/profiles');
      // testError.status = 501; // Example of setting a custom status
      return next(testError); // Pass to centralized error handler
    }

    const db = getDb();

    if (!db) {
    console.log('GET /api/profiles - DB not available, returning mock list of profiles.');
    return res.status(200).json([
      { _id: new ObjectId().toHexString(), name: 'Mock User Alpha', createdAt: new Date() },
      { _id: new ObjectId().toHexString(), name: 'Mock User Beta', createdAt: new Date() }
    ]);
  }

      console.log('GET /api/profiles - Simulating fetching all profiles from DB.');
      // Example: const profiles = await db.collection('profiles').find({}).toArray();
      const simulatedProfiles = [
        { _id: new ObjectId().toHexString(), name: 'Simulated User 1', createdAt: new Date() },
        { _id: new ObjectId().toHexString(), name: 'Simulated User 2', createdAt: new Date() }
      ];
      res.status(200).json(simulatedProfiles);
    // The existing catch block here would catch synchronous errors within this try block.
    // Errors passed via next(error) will go to the centralized handler.
    // To ensure this catch doesn't interfere with testing next(error), 
    // the deliberate error is thrown before this try block or passed via next()
  } catch (error) {
    console.error('GET /api/profiles - Error during simulated DB operation (or other sync error):', error.message);
    // Pass to centralized error handler instead of custom response here
    return next(error); 
    // res.status(500).json({ message: 'Failed to retrieve profiles due to server error.', error: error.message });
  }
});

// GET /:profileId (Get Profile by ID)
// No validation needed for GET by ID other than what's below, but param validation could be added if desired.
router.get('/:profileId', 
  [ // Added param validation for consistency, though manual check was also fine
    param('profileId').isMongoId().withMessage('Invalid profileId format in URL parameter.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = getDb();
    const { profileId } = req.params;

    // The ObjectId.isValid check is now handled by param('profileId').isMongoId()
    // if (!ObjectId.isValid(profileId)) {
    //   return res.status(400).json({ message: 'Invalid profileId format.' });
    // }

    if (!db) {
    console.log(`GET /api/profiles/${profileId} - DB not available, returning mock profile.`);
    // Simulate finding or not finding for specific mock IDs if needed for testing
    if (profileId === "ffffffffffffffffffffffff") { // Example of a "not found" mock ID
        return res.status(404).json({ message: 'Mock profile not found (DB unavailable).' });
    }
    return res.status(200).json({ _id: profileId, name: `Mock User ${profileId}`, createdAt: new Date() });
  }

  try {
    console.log(`GET /api/profiles/${profileId} - Simulating fetching profile by ID from DB.`);
    // Example: const profile = await db.collection('profiles').findOne({ _id: new ObjectId(profileId) });
    // if (!profile) return res.status(404).json({ message: 'Profile not found.' });
    if (profileId === "eeeeeeeeeeeeeeeeeeeeeeee") { // Example of a "not found" mock ID for simulation
        return res.status(404).json({ message: 'Simulated profile not found.' });
    }
    const simulatedProfile = { _id: profileId, name: `Simulated User ${profileId}`, createdAt: new Date() };
    res.status(200).json(simulatedProfile);
  } catch (error) {
    console.error(`GET /api/profiles/${profileId} - Error during simulated DB operation:`, error.message);
    res.status(500).json({ message: 'Failed to retrieve profile due to server error.', error: error.message });
  }
});

// PUT /:profileId (Update Profile)
router.put('/:profileId',
  [
    param('profileId').isMongoId().withMessage('Invalid profileId format in URL parameter.'),
    body('name')
      .trim()
      .notEmpty().withMessage('Profile name is required for update.')
      .escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = getDb();
    const { profileId } = req.params;
    const { name } = req.body;

    // Validation for profileId format and name presence is now handled by express-validator
    // if (!ObjectId.isValid(profileId)) {
    //   return res.status(400).json({ message: 'Invalid profileId format.' });
    // }
    // if (!name) {
    //   return res.status(400).json({ message: 'Profile name is required for update.' });
    // }

    if (!db) {
    console.log(`PUT /api/profiles/${profileId} - DB not available, returning mock updated profile.`);
    if (profileId === "ffffffffffffffffffffffff") { 
        return res.status(404).json({ message: 'Mock profile not found for update (DB unavailable).' });
    }
    return res.status(200).json({ _id: profileId, name, createdAt: "mockedDateString", updatedAt: new Date() });
  }

  try {
    console.log(`PUT /api/profiles/${profileId} - Simulating profile update in DB.`);
    // Example: const result = await db.collection('profiles').updateOne(...);
    // if (result.matchedCount === 0) return res.status(404).json({ message: 'Profile not found.' });
    if (profileId === "eeeeeeeeeeeeeeeeeeeeeeee") { 
        return res.status(404).json({ message: 'Simulated profile not found for update.' });
    }
    const simulatedUpdatedProfile = { _id: profileId, name, createdAt: "mockedDateString", updatedAt: new Date() };
    res.status(200).json(simulatedUpdatedProfile);
  } catch (error) {
    console.error(`PUT /api/profiles/${profileId} - Error during simulated DB operation:`, error.message);
    res.status(500).json({ message: 'Failed to update profile due to server error.', error: error.message });
  }
});

// DELETE /:profileId (Delete Profile)
// No body validation needed for DELETE, but param validation is good.
router.delete('/:profileId', 
  [
    param('profileId').isMongoId().withMessage('Invalid profileId format in URL parameter.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = getDb();
    const { profileId } = req.params;

    // Validation for profileId format is now handled by express-validator
    // if (!ObjectId.isValid(profileId)) {
    //   return res.status(400).json({ message: 'Invalid profileId format.' });
    // }

    if (!db) {
    console.log(`DELETE /api/profiles/${profileId} - DB not available, returning mock success.`);
     if (profileId === "ffffffffffffffffffffffff") { 
        return res.status(404).json({ message: 'Mock profile not found for deletion (DB unavailable).' });
    }
    return res.status(200).json({ message: `Mock profile ${profileId} and associated entries deleted.` });
    // Or use res.status(204).send(); for no content response
  }

  try {
    console.log(`DELETE /api/profiles/${profileId} - Simulating profile deletion from DB.`);
    // Example: await db.collection('healthEntries').deleteMany({ profileId: new ObjectId(profileId) });
    // const result = await db.collection('profiles').deleteOne({ _id: new ObjectId(profileId) });
    // if (result.deletedCount === 0) return res.status(404).json({ message: 'Profile not found.' });
    if (profileId === "eeeeeeeeeeeeeeeeeeeeeeee") { 
        return res.status(404).json({ message: 'Simulated profile not found for deletion.' });
    }
    res.status(200).json({ message: `Simulated profile ${profileId} and associated entries deleted.` });
  } catch (error) {
    console.error(`DELETE /api/profiles/${profileId} - Error during simulated DB operation:`, error.message);
    res.status(500).json({ message: 'Failed to delete profile due to server error.', error: error.message });
  }
});

module.exports = router;
