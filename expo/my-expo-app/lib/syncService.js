// expo/my-expo-app/lib/syncService.js
import Realm from 'realm'; // Needed for Realm.BSON.ObjectId
import * as apiService from './apiService';
// Note: We will use realm.create(..., 'modified') for upserting,
// so direct use of profileService/healthEntryService for create/update might be bypassed in this specific sync function
// for simplicity, though in a larger app, those services could be enhanced to support upsert.
// import * as profileService from './realm/profileService'; 
// import * as healthEntryService from './realm/healthEntryService';

/**
 * Syncs data from the backend to the local Realm database.
 * Assumes backend API provides user-specific data when authenticated.
 * 
 * @param {Realm} realm - The Realm instance.
 * @param {string} token - The JWT token for authentication.
 * @returns {Promise<{success: boolean, message: string, errors: Array<{type: string, id: string, error: any}>}>} 
 *          Status of the sync operation.
 */
export const syncBackendDataToLocal = async (realm, token) => {
  if (!realm) {
    console.error('syncBackendDataToLocal: Realm instance is required.');
    return { success: false, message: 'Realm instance not provided.', errors: [] };
  }
  if (!token) {
    console.error('syncBackendDataToLocal: Auth token is required.');
    return { success: false, message: 'Auth token not provided.', errors: [] };
  }

  console.log('Starting backend data sync to local Realm...');
  const errors = [];

  try {
    // 1. Fetch Profiles from backend
    console.log('Fetching profiles from API...');
    const apiProfiles = await apiService.getProfiles(token);
    console.log(`Received ${apiProfiles?.length || 0} profiles from API.`);

    if (apiProfiles && apiProfiles.length > 0) {
      realm.write(() => {
        apiProfiles.forEach(apiProfile => {
          try {
            console.log(`Processing profile: ${apiProfile.name} (ID: ${apiProfile._id})`);
            // Ensure _id is a Realm.BSON.ObjectId for upsert
            // The API response might have _id as a string.
            const profilePayload = {
              _id: new Realm.BSON.ObjectId(apiProfile._id),
              name: apiProfile.name,
              // Assuming 'createdAt' from API is a string like '2024-01-01T12:00:00.000Z'
              // And Realm schema for 'createdAt' is 'date'.
              // If apiProfile.createdAt is already a Date object or a compatible string, direct assignment works.
              // Otherwise, new Date(apiProfile.createdAt) might be needed.
              // Our mock API currently returns new Date() objects directly, which might serialize to strings.
              // Let's assume it's a string that needs conversion or is directly compatible.
              // If the API sends a string, and the Realm model expects a Date object:
              createdAt: apiProfile.createdAt ? new Date(apiProfile.createdAt) : new Date(), 
              // Add other fields from apiProfile as defined in your Realm 'Profile' schema
            };
            
            realm.create('Profile', profilePayload, 'modified'); // Upsert profile
            console.log(`Upserted profile: ${apiProfile.name}`);

            // 2. Fetch Health Entries for this profile
            // This needs to be async and outside the realm.write for profile,
            // then another realm.write for health entries.
            // This is a bit complex if done serially inside the loop.
            // A better approach might be to fetch all profiles, then all relevant health entries, then do all writes.

          } catch (profileError) {
            console.error(`Error processing profile ID ${apiProfile._id}:`, profileError);
            errors.push({ type: 'profile', id: apiProfile._id, error: profileError.message });
          }
        });
      });

      // After profiles are synced, fetch and sync health entries for each profile
      for (const apiProfile of apiProfiles) {
        try {
          console.log(`Fetching health entries for profile ID: ${apiProfile._id}`);
          const apiHealthEntries = await apiService.getHealthEntriesForProfile(token, apiProfile._id);
          console.log(`Received ${apiHealthEntries?.length || 0} health entries for profile ${apiProfile._id}.`);

          if (apiHealthEntries && apiHealthEntries.length > 0) {
            realm.write(() => {
              apiHealthEntries.forEach(apiEntry => {
                try {
                  console.log(`Processing health entry ID: ${apiEntry._id} for profile ${apiProfile._id}`);
                  const healthEntryPayload = {
                    _id: new Realm.BSON.ObjectId(apiEntry._id),
                    profileId: new Realm.BSON.ObjectId(apiProfile._id), // Link to the profile
                    date: apiEntry.date ? new Date(apiEntry.date) : new Date(),
                    systolic: apiEntry.systolic,
                    diastolic: apiEntry.diastolic,
                    pulse: apiEntry.pulse,
                    spO2: apiEntry.spO2,
                    weight: apiEntry.weight,
                    medications: apiEntry.medications,
                    notes: apiEntry.notes,
                    createdAt: apiEntry.createdAt ? new Date(apiEntry.createdAt) : new Date(),
                    // Add other fields from apiEntry as defined in your Realm 'HealthEntry' schema
                  };
                  realm.create('HealthEntry', healthEntryPayload, 'modified'); // Upsert health entry
                  console.log(`Upserted health entry: ${apiEntry._id}`);
                } catch (entryError) {
                  console.error(`Error processing health entry ID ${apiEntry._id}:`, entryError);
                  errors.push({ type: 'healthEntry', id: apiEntry._id, error: entryError.message });
                }
              });
            });
          }
        } catch (fetchEntriesError) {
          console.error(`Error fetching/processing health entries for profile ID ${apiProfile._id}:`, fetchEntriesError);
          errors.push({ type: 'healthEntriesFetch', id: apiProfile._id, error: fetchEntriesError.message });
        }
      }
    }

    if (errors.length > 0) {
      console.warn('Sync completed with some errors.');
      return { success: false, message: 'Sync completed with errors.', errors };
    }

    console.log('Backend data sync to local Realm completed successfully.');
    return { success: true, message: 'Data synced successfully.', errors: [] };

  } catch (error) {
    console.error('General error during syncBackendDataToLocal:', error);
    errors.push({ type: 'general', id: 'N/A', error: error.message });
    return { success: false, message: 'Sync failed due to a general error.', errors };
  }
};

// Example of how this might be called (not part of this file's direct execution):
// import { useRealm } from '@realm/react'; // If used in a component
// // ...
// // const realm = useRealm(); // In a component
// // const userToken = "some_jwt_token"; // From auth state
// // syncBackendDataToLocal(realm, userToken)
// //   .then(result => console.log("Sync result:", result))
// //   .catch(err => console.error("Sync failed:", err));

// --- Functions for Pushing Local Changes to Backend ---

/**
 * Pushes a new local profile creation to the backend.
 * @param {string} token - The JWT token for authentication.
 * @param {object} profileData - Plain JS object representing the profile (e.g., { name: 'New Profile' }).
 *                                Local _id should not be sent if backend generates it.
 * @returns {Promise<{success: boolean, message: string, data?: any, error?: any}>}
 */
export const pushProfileCreation = async (token, profileData) => {
  console.log('Attempting to push profile creation to backend:', profileData);
  if (!token) {
    return { success: false, message: 'Auth token is required.' };
  }
  if (!profileData || !profileData.name) { // Basic validation
    return { success: false, message: 'Profile data (with name) is required.' };
  }

  try {
    // apiService.createProfile expects (token, name)
    const response = await apiService.createProfile(token, profileData.name);
    console.log('API pushProfileCreation Success:', response);
    // Backend returns mock: { _id: "...", name: "...", createdAt: "..." }
    // If backend generated _id, this response.data would be crucial to update local Realm object.
    return { success: true, message: 'Profile creation pushed successfully.', data: response };
  } catch (error) {
    console.error('API pushProfileCreation Error:', error);
    return { success: false, message: 'Failed to push profile creation.', error };
  }
};

/**
 * Pushes a local profile update to the backend.
 * @param {string} token - The JWT token for authentication.
 * @param {string} profileId - The string representation of the profile's _id.
 * @param {object} profileData - Plain JS object with fields to update (e.g., { name: 'Updated Name' }).
 * @returns {Promise<{success: boolean, message: string, data?: any, error?: any}>}
 */
export const pushProfileUpdate = async (token, profileId, profileData) => {
  console.log(`Attempting to push profile update to backend for ID ${profileId}:`, profileData);
  if (!token) {
    return { success: false, message: 'Auth token is required.' };
  }
  if (!profileId) {
    return { success: false, message: 'Profile ID is required.' };
  }
  if (!profileData || !profileData.name) { // Basic validation for what our API expects
    return { success: false, message: 'Profile data (with name) is required for update.' };
  }

  try {
    // apiService.updateProfile expects (token, profileId (string), name)
    const response = await apiService.updateProfile(token, profileId, profileData.name);
    console.log('API pushProfileUpdate Success:', response);
    // Backend returns mock: { _id: profileId, name, createdAt, updatedAt }
    return { success: true, message: 'Profile update pushed successfully.', data: response };
  } catch (error) {
    console.error('API pushProfileUpdate Error:', error);
    return { success: false, message: 'Failed to push profile update.', error };
  }
};

/**
 * Pushes a new local health entry creation to the backend.
 * @param {string} token - The JWT token for authentication.
 * @param {object} healthEntryData - Plain JS object representing the health entry.
 *                                   Must include `profileId` (string).
 *                                   Local _id should not be sent if backend generates it.
 * @returns {Promise<{success: boolean, message: string, data?: any, error?: any}>}
 */
export const pushHealthEntryCreation = async (token, healthEntryData) => {
  console.log('Attempting to push health entry creation to backend:', healthEntryData);
  if (!token) {
    return { success: false, message: 'Auth token is required.' };
  }
  if (!healthEntryData || !healthEntryData.profileId) { // Basic validation
    return { success: false, message: 'Health entry data (with profileId) is required.' };
  }

  // Ensure profileId is a string for the API
  const apiPayload = {
    ...healthEntryData,
    profileId: String(healthEntryData.profileId), // Ensure it's a string
    date: healthEntryData.date ? new Date(healthEntryData.date).toISOString() : new Date().toISOString(),
  };
  // Remove _id if it's a local temporary ID, backend should generate the canonical _id
  delete apiPayload._id; 


  try {
    // apiService.createHealthEntry expects (token, entryData)
    // entryData should be a plain object matching backend expectations
    const response = await apiService.createHealthEntry(token, apiPayload);
    console.log('API pushHealthEntryCreation Success:', response);
    // Backend returns mock: { _id: "...", profileId, date, ..., createdAt }
    return { success: true, message: 'Health entry creation pushed successfully.', data: response };
  } catch (error) {
    console.error('API pushHealthEntryCreation Error:', error);
    return { success: false, message: 'Failed to push health entry creation.', error };
  }
};

/**
 * Pushes a local health entry update to the backend.
 * @param {string} token - The JWT token for authentication.
 * @param {string} entryId - The string representation of the health entry's _id.
 * @param {object} healthEntryData - Plain JS object with fields to update.
 *                                   `profileId` should not be part of updates.
 * @returns {Promise<{success: boolean, message: string, data?: any, error?: any}>}
 */
export const pushHealthEntryUpdate = async (token, entryId, healthEntryData) => {
  console.log(`Attempting to push health entry update to backend for ID ${entryId}:`, healthEntryData);
  if (!token) {
    return { success: false, message: 'Auth token is required.' };
  }
  if (!entryId) {
    return { success: false, message: 'Health entry ID is required.' };
  }
  if (!healthEntryData || Object.keys(healthEntryData).length === 0) {
    return { success: false, message: 'Health entry data for update is required.' };
  }

  // Prepare payload: remove protected fields like _id, profileId, createdAt
  const apiPayload = { ...healthEntryData };
  delete apiPayload._id;
  delete apiPayload.profileId; // profileId should not be changed on update
  delete apiPayload.createdAt;
  if (apiPayload.date) {
    apiPayload.date = new Date(apiPayload.date).toISOString();
  }


  try {
    // apiService.updateHealthEntry expects (token, entryId (string), updates)
    const response = await apiService.updateHealthEntry(token, entryId, apiPayload);
    console.log('API pushHealthEntryUpdate Success:', response);
    // Backend returns mock: { _id: entryId, ...updatedFields, updatedAt }
    return { success: true, message: 'Health entry update pushed successfully.', data: response };
  } catch (error) {
    console.error('API pushHealthEntryUpdate Error:', error);
    return { success: false, message: 'Failed to push health entry update.', error };
  }
};
