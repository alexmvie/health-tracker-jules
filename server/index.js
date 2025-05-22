const express = require('express');
const { connectToMongoDB } = require('./lib/mongoClient'); // Import the function

const profileRoutes = require('./routes/profiles'); // Import profile routes

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // For parsing application/json

app.get('/', (req, res) => {
  res.json({ message: "Health Tracker API is running!" });
});

// Mount profile routes
app.use('/api/profiles', profileRoutes);
console.log('DEBUG: Profile routes mounted at /api/profiles.'); // Added debug log

// Mount health entry routes
const healthEntryRoutes = require('./routes/healthEntries'); // Import health entry routes
app.use('/api/health-entries', healthEntryRoutes);
console.log('DEBUG: Health Entry routes mounted at /api/health-entries.'); // Added debug log for health entries

// Mount auth routes
const authRoutes = require('./routes/auth'); // Import auth routes
app.use('/api/auth', authRoutes);
console.log('DEBUG: Auth routes mounted at /api/auth.'); // Added debug log for auth

// Centralized Error Handling Middleware Definition
function errorHandler(err, req, res, next) {
  console.error("An error occurred:");
  console.error(err.stack); // Log the full error stack

  const statusCode = err.status || 500; // Use error's status or default to 500
  const errorMessage = err.message || 'Something went wrong!';

  // Avoid sending response if headers already sent (e.g., by a streaming response that errored)
  if (res.headersSent) {
    return next(err);
  }

  res.status(statusCode).json({
    error: {
      message: errorMessage,
      // Optionally include stack in development:
      // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    }
  });
}

// Register the error handling middleware
// This should be the last middleware added before the server starts listening.
app.use(errorHandler);

// Define an async function to start the server
async function startServer() {
  console.log('Attempting to connect to MongoDB before starting Express server...');
  // connectToMongoDB will log its own success/failure due to the placeholder URI
  // It returns the client on success or null on failure.
  const mongoClientInstance = await connectToMongoDB(); 

  if (mongoClientInstance) {
    console.log('MongoDB connection attempt sequence completed. Client instance (potentially connected) received by index.js.');
    // Note: Actual connection to placeholder URI will likely fail, logged by connectToMongoDB.
    // If you had a real DB and wanted to use it:
    // const db = getDb(); // Assuming getDb is also imported and mongoClientInstance is valid
    // app.locals.db = db; // Make db available to routes
  } else {
    console.log('MongoDB connection attempt sequence completed. No client instance received or connection failed (see logs from mongoClient.js). Server will continue to start.');
  }

  app.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
  });
}

// Call the function to start the server
startServer().catch(error => {
  // This catch is for errors in the startServer function itself, not typically for MongoDB connection errors
  // as connectToMongoDB is designed to handle its own errors and return null.
  console.error("Critical error during server startup process (e.g., Express app.listen failure):", error);
  // process.exit(1); // Optional: exit if server startup itself (not DB connection) critically fails
});
