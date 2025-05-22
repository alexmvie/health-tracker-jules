import axios from 'axios';

// For a mobile app, 'localhost' needs to be replaced with your machine's local network IP
// if running the server on the same machine and testing on a physical device.
// For simulators/emulators or web, 'localhost' is usually fine.
const API_BASE_URL = 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Auth Functions ---

/**
 * Registers a new user.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<object>} Response data from server.
 */
export const registerUser = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/register', { email, password });
    console.log('API Register Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Register Error:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Registration failed');
  }
};

/**
 * Logs in a user.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<object>} Response data (should include token and user info).
 */
export const loginUser = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    console.log('API Login Success:', response.data);
    // The response from our mock backend includes { token: "..." }
    return response.data; 
  } catch (error) {
    console.error('API Login Error:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Login failed');
  }
};

// --- Profile Functions ---
// Helper to get headers with token
const getAuthHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

/**
 * Gets all profiles (protected route).
 * @param {string} token - JWT token.
 * @returns {Promise<Array>} Array of profiles.
 */
export const getProfiles = async (token) => {
  try {
    const response = await apiClient.get('/profiles', getAuthHeaders(token));
    console.log('API Get Profiles Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Get Profiles Error:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to get profiles');
  }
};

/**
 * Creates a new profile (assuming protected).
 * @param {string} token - JWT token.
 * @param {string} name - Name of the profile.
 * @returns {Promise<object>} The created profile.
 */
export const createProfile = async (token, name) => {
  try {
    const response = await apiClient.post('/profiles', { name }, getAuthHeaders(token));
    console.log('API Create Profile Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Create Profile Error:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to create profile');
  }
};

// Other profile functions (getProfileById, updateProfile, deleteProfile) would follow a similar pattern,
// taking a token and relevant IDs/data, and using getAuthHeaders(token).

export const getProfileById = async (token, profileId) => {
  try {
    const response = await apiClient.get(`/profiles/${profileId}`, getAuthHeaders(token));
    return response.data;
  } catch (error) {
    console.error('API Get Profile By ID Error:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to get profile by ID');
  }
};

export const updateProfile = async (token, profileId, name) => {
  try {
    const response = await apiClient.put(`/profiles/${profileId}`, { name }, getAuthHeaders(token));
    return response.data;
  } catch (error) {
    console.error('API Update Profile Error:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to update profile');
  }
};

export const deleteProfile = async (token, profileId) => {
  try {
    const response = await apiClient.delete(`/profiles/${profileId}`, getAuthHeaders(token));
    return response.data; // Or handle 204 No Content appropriately if backend returns that
  } catch (error) {
    console.error('API Delete Profile Error:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to delete profile');
  }
};


// --- HealthEntry Functions ---
// Assuming these are also protected and require a token.

/**
 * Creates a health entry.
 * @param {string} token - JWT token.
 * @param {object} entryData - Data for the health entry, including profileId.
 * @returns {Promise<object>} The created health entry.
 */
export const createHealthEntry = async (token, entryData) => {
  try {
    const response = await apiClient.post('/health-entries', entryData, getAuthHeaders(token));
    console.log('API Create Health Entry Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Create Health Entry Error:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to create health entry');
  }
};

/**
 * Gets health entries for a specific profile.
 * @param {string} token - JWT token.
 * @param {string} profileId - The ID of the profile.
 * @returns {Promise<Array>} Array of health entries.
 */
export const getHealthEntriesForProfile = async (token, profileId) => {
  try {
    const response = await apiClient.get(`/health-entries/profile/${profileId}`, getAuthHeaders(token));
    console.log('API Get Health Entries for Profile Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Get Health Entries for Profile Error:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to get health entries for profile');
  }
};

// Other health entry functions (getHealthEntryById, updateHealthEntry, deleteHealthEntry)

export const getHealthEntryById = async (token, entryId) => {
  try {
    const response = await apiClient.get(`/health-entries/${entryId}`, getAuthHeaders(token));
    return response.data;
  } catch (error) {
    console.error('API Get Health Entry By ID Error:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to get health entry by ID');
  }
};

export const updateHealthEntry = async (token, entryId, updates) => {
  try {
    const response = await apiClient.put(`/health-entries/${entryId}`, updates, getAuthHeaders(token));
    return response.data;
  } catch (error) {
    console.error('API Update Health Entry Error:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to update health entry');
  }
};

export const deleteHealthEntry = async (token, entryId) => {
  try {
    const response = await apiClient.delete(`/health-entries/${entryId}`, getAuthHeaders(token));
    return response.data; // Or handle 204 No Content
  } catch (error) {
    console.error('API Delete Health Entry Error:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to delete health entry');
  }
};

// Optional: Interceptor to automatically add token if available globally (e.g. from AsyncStorage)
// This is more advanced and requires a way to store/retrieve the token.
// apiClient.interceptors.request.use(async (config) => {
//   const token = await AsyncStorage.getItem('userToken'); // Example token storage
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// }, (error) => {
//   return Promise.reject(error);
// });
