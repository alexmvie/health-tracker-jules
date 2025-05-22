const { MongoClient } = require('mongodb');

// Connection URI - will be set from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthtracker_test';

let clientInstance = null;
let isConnecting = false;
let connectionPromise = null;

/**
 * Connects to MongoDB with retry logic
 * @returns {Promise<MongoClient>} The connected MongoClient instance
 * @throws {Error} If connection fails after retries
 */
async function connectToMongoDB() {
  // If already connected, return the existing connection
  if (clientInstance) {
    try {
      // Verify the connection is still alive
      await clientInstance.db('admin').command({ ping: 1 });
      return clientInstance;
    } catch (error) {
      console.warn('Existing MongoDB connection failed ping, reconnecting...');
      clientInstance = null;
    }
  }

  // If already in the process of connecting, return the existing promise
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  isConnecting = true;
  
  const connectWithRetry = async (attempt = 1, maxAttempts = 3, delayMs = 1000) => {
    const client = new MongoClient(MONGODB_URI, {
      connectTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });

    try {
      console.log(`Attempting to connect to MongoDB (attempt ${attempt}/${maxAttempts})...`);
      await client.connect();
      console.log('Successfully connected to MongoDB');
      return client;
    } catch (error) {
      await client.close();
      
      if (attempt >= maxAttempts) {
        console.error(`Failed to connect to MongoDB after ${maxAttempts} attempts:`, error.message);
        throw new Error(`Failed to connect to MongoDB: ${error.message}`);
      }
      
      console.log(`Retrying connection in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return connectWithRetry(attempt + 1, maxAttempts, delayMs * 2);
    }
  };

  try {
    connectionPromise = connectWithRetry();
    clientInstance = await connectionPromise;
    return clientInstance;
  } finally {
    isConnecting = false;
    connectionPromise = null;
  }
}

/**
 * Gets the database instance from the currently connected client
 * @param {string} dbName - The name of the database (default: 'healthtracker')
 * @returns {import('mongodb').Db} The Db instance
 * @throws {Error} If not connected to MongoDB
 */
function getDb(dbName = 'healthtracker') {
  if (!clientInstance) {
    throw new Error('MongoDB client not connected. Call connectToMongoDB() first.');
  }
  
  try {
    return clientInstance.db(dbName);
  } catch (error) {
    console.error('Error getting database instance:', error.message);
    throw new Error(`Failed to get database instance: ${error.message}`);
  }
}

/**
 * Closes the MongoDB connection
 * @returns {Promise<void>}
 */
async function closeMongoDBConnection() {
  if (!clientInstance) {
    return;
  }

  try {
    await clientInstance.close(true); // Force close all connections
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error.message);
    throw error;
  } finally {
    clientInstance = null;
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Received SIGINT. Closing MongoDB connection...');
  await closeMongoDBConnection().catch(console.error);
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Closing MongoDB connection...');
  await closeMongoDBConnection().catch(console.error);
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  closeMongoDBConnection().catch(console.error);
  process.exit(1);
});

module.exports = { 
  connectToMongoDB, 
  getDb, 
  closeMongoDBConnection, 
  MONGODB_URI 
};
