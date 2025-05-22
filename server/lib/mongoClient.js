const { MongoClient, ServerApiVersion } = require('mongodb');

// Use a placeholder connection string
// In a real app, this would ideally be from process.env.MONGODB_URI
const MONGODB_URI = 'mongodb://placeholder-uri-for-testing:27017/healthtracker_db_placeholder'; 

let clientInstance = null; // To store the connected client instance

/**
 * Connects to MongoDB.
 * @returns {Promise<MongoClient|null>} The connected MongoClient instance or null on failure.
 */
async function connectToMongoDB() {
  if (clientInstance) {
    // Basic check if already initialized and possibly connected.
    // A more robust check like a ping might be too much for this simple setup.
    // console.log('MongoDB client already initialized. Assuming connected or attempting connection.');
    // return clientInstance; 
    // Forcing re-evaluation for this example to ensure connection logic is hit:
    try {
        // A quick ping to check actual connectivity of an existing client
        await clientInstance.db("admin").command({ ping: 1 });
        console.log('Already connected to MongoDB (ping successful).');
        return clientInstance;
    } catch (e) {
        console.log('Previously initialized client found, but ping failed or client not truly connected. Attempting to reconnect.');
        clientInstance = null; // Reset to force re-connection
    }
  }

  const client = new MongoClient(MONGODB_URI, {
    // Example of ServerApiVersion setting, typically for Atlas.
    // serverApi: {
    //   version: ServerApiVersion.v1,
    //   strict: true,
    //   deprecationErrors: true,
    // }
  });

  try {
    console.log(`Attempting to connect to MongoDB at ${MONGODB_URI}...`);
    // Note: client.connect() itself doesn't return the client, it modifies the client instance.
    await client.connect(); 
    console.log('MongoDB client.connect() call successful (this does not guarantee server is reachable with placeholder).');
    clientInstance = client; // Store the connected instance
    return clientInstance;
  } catch (error) {
    // This error will likely occur due to the placeholder URI (e.g., DNS resolution failure, server not found).
    console.error('Failed to connect to MongoDB:', error.message); 
    // For more detailed error in a real scenario: console.error(error); 
    clientInstance = null; // Ensure clientInstance is null on failure
    return null;
  }
}

/**
 * Gets the database instance from the currently connected client.
 * @param {string} dbName - The name of the database (e.g., "healthtracker").
 * @returns {import('mongodb').Db | null} The Db instance or null if not connected.
 */
function getDb(dbName = 'healthtracker') {
  if (!clientInstance) {
    console.error('MongoDB client not connected or connection failed. Call connectToMongoDB and ensure it succeeds.');
    return null;
  }
  // Check if the client topology is connected (more reliable check after client.connect())
  // This check might be too intensive or internal for some driver versions / use cases.
  // A simple check for clientInstance existence is often used, relying on connectToMongoDB's success.
  if (clientInstance.topology && !clientInstance.topology.isConnected()) {
      console.error('MongoDB client is initialized but not connected to the server.');
      return null;
  }
  return clientInstance.db(dbName);
}

// Function to close the MongoDB connection, useful for graceful shutdown
async function closeMongoDBConnection() {
    if (clientInstance) {
        try {
            await clientInstance.close();
            console.log("MongoDB connection closed.");
            clientInstance = null;
        } catch (error) {
            console.error("Error closing MongoDB connection:", error.message);
        }
    }
}

module.exports = { connectToMongoDB, getDb, closeMongoDBConnection, MONGODB_URI };
