const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/mongoClient');
const { ObjectId } = require('mongodb'); // For creating ObjectIds if needed by business logic
const { body, param, validationResult } = require('express-validator');

// Middleware to log request details for this router
router.use((req, res, next) => {
  console.log(`HealthEntries Route: ${req.method} ${req.originalUrl} - Body:`, req.body);
  next();
});

const healthEntryValidationRules = [
  body('profileId').isMongoId().withMessage('Valid profileId is required.'),
  body('date').optional().isISO8601().toDate().withMessage('Date must be a valid ISO8601 date string.'),
  body('systolic').optional().isInt({ min: 0 }).withMessage('Systolic pressure must be a non-negative integer.'),
  body('diastolic').optional().isInt({ min: 0 }).withMessage('Diastolic pressure must be a non-negative integer.'),
  body('pulse').optional().isInt({ min: 0 }).withMessage('Pulse must be a non-negative integer.'),
  body('spO2').optional().isInt({ min: 0, max: 100 }).withMessage('SpO2 must be an integer between 0 and 100.'),
  body('weight').optional().isFloat({ min: 0 }).withMessage('Weight must be a non-negative number.'),
  body('medications').optional().trim().escape(),
  body('notes').optional().trim().escape()
];

// POST / (Create HealthEntry)
router.post('/', healthEntryValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const db = getDb();
  const { profileId, systolic, diastolic, pulse, spO2, weight, medications, notes, date } = req.body;

  // profileId validation is now handled by express-validator
  // if (!profileId || !ObjectId.isValid(profileId)) {
  //   return res.status(400).json({ message: 'Valid profileId is required.' });
  // }

  if (!db) {
    console.log('POST /api/health-entries - DB not available, returning mock created health entry.');
    const mockNewEntry = { 
      _id: new ObjectId().toHexString(), 
      profileId, 
      date: date ? new Date(date) : new Date(),
      systolic, diastolic, pulse, spO2, weight, medications, notes, // include all fields
      createdAt: new Date() 
    };
    return res.status(201).json(mockNewEntry);
  }

  try {
    console.log('POST /api/health-entries - Simulating health entry creation in DB.');
    const simulatedEntry = { 
      _id: new ObjectId().toHexString(), 
      profileId, 
      date: date ? new Date(date) : new Date(),
      systolic, diastolic, pulse, spO2, weight, medications, notes,
      createdAt: new Date() 
    };
    // Example: const result = await db.collection('healthEntries').insertOne(simulatedEntryData);
    // const createdEntry = { _id: result.insertedId, ...simulatedEntryData };
    res.status(201).json(simulatedEntry);
  } catch (error) {
    console.error('POST /api/health-entries - Error during simulated DB operation:', error.message);
    res.status(500).json({ message: 'Failed to create health entry due to server error.', error: error.message });
  }
});

// GET /profile/:profileId (Get HealthEntries for a Profile)
router.get('/profile/:profileId', 
  [
    param('profileId').isMongoId().withMessage('Invalid profileId format in URL parameter.')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = getDb();
    const { profileId } = req.params;

    // profileId validation handled by express-validator
    // if (!ObjectId.isValid(profileId)) {
    //   return res.status(400).json({ message: 'Invalid profileId format.' });
    // }

    if (!db) {
    console.log(`GET /api/health-entries/profile/${profileId} - DB not available, returning mock list.`);
    return res.status(200).json([
      { _id: new ObjectId().toHexString(), profileId, date: new Date(), notes: 'Mock entry 1 for profile ' + profileId },
      { _id: new ObjectId().toHexString(), profileId, date: new Date(), notes: 'Mock entry 2 for profile ' + profileId }
    ]);
  }

  try {
    console.log(`GET /api/health-entries/profile/${profileId} - Simulating fetching entries from DB.`);
    // Example: const entries = await db.collection('healthEntries').find({ profileId: new ObjectId(profileId) }).toArray();
    const simulatedEntries = [
      { _id: new ObjectId().toHexString(), profileId, date: new Date(), notes: 'Simulated entry 1 for profile ' + profileId },
      { _id: new ObjectId().toHexString(), profileId, date: new Date(), notes: 'Simulated entry 2 for profile ' + profileId }
    ];
    res.status(200).json(simulatedEntries);
  } catch (error) {
    console.error(`GET /api/health-entries/profile/${profileId} - Error:`, error.message);
    res.status(500).json({ message: 'Failed to retrieve health entries.', error: error.message });
  }
});

// GET /:entryId (Get HealthEntry by ID)
router.get('/:entryId', 
  [
    param('entryId').isMongoId().withMessage('Invalid entryId format in URL parameter.')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = getDb();
    const { entryId } = req.params;

    // entryId validation handled by express-validator
    // if (!ObjectId.isValid(entryId)) {
    //   return res.status(400).json({ message: 'Invalid entryId format.' });
    // }

    if (!db) {
    console.log(`GET /api/health-entries/${entryId} - DB not available, returning mock entry.`);
    if (entryId === "ffffffffffffffffffffffff") { // Mock "not found" ID
        return res.status(404).json({ message: 'Mock health entry not found (DB unavailable).' });
    }
    return res.status(200).json({ _id: entryId, notes: `Mock entry data for ${entryId}`, date: new Date() });
  }

  try {
    console.log(`GET /api/health-entries/${entryId} - Simulating fetching entry by ID from DB.`);
    // Example: const entry = await db.collection('healthEntries').findOne({ _id: new ObjectId(entryId) });
    // if (!entry) return res.status(404).json({ message: 'Health entry not found.' });
    if (entryId === "eeeeeeeeeeeeeeeeeeeeeeee") { // Mock "not found" ID for simulation
        return res.status(404).json({ message: 'Simulated health entry not found.' });
    }
    const simulatedEntry = { _id: entryId, notes: `Simulated entry data for ${entryId}`, date: new Date() };
    res.status(200).json(simulatedEntry);
  } catch (error) {
    console.error(`GET /api/health-entries/${entryId} - Error:`, error.message);
    res.status(500).json({ message: 'Failed to retrieve health entry.', error: error.message });
  }
});

// PUT /:entryId (Update HealthEntry)
// Note: For PUT, all body fields are optional. We only validate what's provided.
// Re-using parts of healthEntryValidationRules but making them all optional for update.
const healthEntryUpdateValidationRules = [
  param('entryId').isMongoId().withMessage('Invalid entryId format in URL parameter.'),
  body('date').optional().isISO8601().toDate().withMessage('Date must be a valid ISO8601 date string.'),
  body('systolic').optional().isInt({ min: 0 }).withMessage('Systolic pressure must be a non-negative integer.'),
  body('diastolic').optional().isInt({ min: 0 }).withMessage('Diastolic pressure must be a non-negative integer.'),
  body('pulse').optional().isInt({ min: 0 }).withMessage('Pulse must be a non-negative integer.'),
  body('spO2').optional().isInt({ min: 0, max: 100 }).withMessage('SpO2 must be an integer between 0 and 100.'),
  body('weight').optional().isFloat({ min: 0 }).withMessage('Weight must be a non-negative number.'),
  body('medications').optional().trim().escape(),
  body('notes').optional().trim().escape(),
  // profileId should not be updatable for an existing entry
  body('profileId').not().exists().withMessage('profileId cannot be updated.')
];

router.put('/:entryId', healthEntryUpdateValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const db = getDb();
  const { entryId } = req.params;
  const updates = req.body; 

  // entryId validation handled by express-validator
  // if (!ObjectId.isValid(entryId)) {
  //   return res.status(400).json({ message: 'Invalid entryId format.' });
  // }

  if (!db) {
    console.log(`PUT /api/health-entries/${entryId} - DB not available, returning mock updated entry.`);
    if (entryId === "ffffffffffffffffffffffff") {
        return res.status(404).json({ message: 'Mock health entry not found for update (DB unavailable).' });
    }
    return res.status(200).json({ _id: entryId, ...updates, updatedAt: new Date() });
  }

  try {
    console.log(`PUT /api/health-entries/${entryId} - Simulating health entry update in DB.`);
    // Example: const result = await db.collection('healthEntries').updateOne({_id: new ObjectId(entryId)}, {$set: updates});
    // if (result.matchedCount === 0) return res.status(404).json({ message: 'Health entry not found.' });
    if (entryId === "eeeeeeeeeeeeeeeeeeeeeeee") {
        return res.status(404).json({ message: 'Simulated health entry not found for update.' });
    }
    const simulatedUpdatedEntry = { _id: entryId, ...updates, updatedAt: new Date() };
    res.status(200).json(simulatedUpdatedEntry);
  } catch (error) {
    console.error(`PUT /api/health-entries/${entryId} - Error:`, error.message);
    res.status(500).json({ message: 'Failed to update health entry.', error: error.message });
  }
});

// DELETE /:entryId (Delete HealthEntry)
router.delete('/:entryId', 
  [
    param('entryId').isMongoId().withMessage('Invalid entryId format in URL parameter.')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = getDb();
    const { entryId } = req.params;

    // entryId validation handled by express-validator
    // if (!ObjectId.isValid(entryId)) {
    //   return res.status(400).json({ message: 'Invalid entryId format.' });
    // }

    if (!db) {
    console.log(`DELETE /api/health-entries/${entryId} - DB not available, returning mock success.`);
    if (entryId === "ffffffffffffffffffffffff") {
        return res.status(404).json({ message: 'Mock health entry not found for deletion (DB unavailable).' });
    }
    return res.status(200).json({ message: `Mock health entry ${entryId} deleted.` });
    // Or res.status(204).send();
  }

  try {
    console.log(`DELETE /api/health-entries/${entryId} - Simulating health entry deletion from DB.`);
    // Example: const result = await db.collection('healthEntries').deleteOne({ _id: new ObjectId(entryId) });
    // if (result.deletedCount === 0) return res.status(404).json({ message: 'Health entry not found.' });
    if (entryId === "eeeeeeeeeeeeeeeeeeeeeeee") {
        return res.status(404).json({ message: 'Simulated health entry not found for deletion.' });
    }
    res.status(200).json({ message: `Simulated health entry ${entryId} deleted.` });
  } catch (error) {
    console.error(`DELETE /api/health-entries/${entryId} - Error:`, error.message);
    res.status(500).json({ message: 'Failed to delete health entry.', error: error.message });
  }
});

module.exports = router;
