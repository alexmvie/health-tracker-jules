// expo/my-expo-app/lib/realm/healthEntryService.js
import Realm from 'realm';
import { HealthEntry, Profile } from './schemas'; // Profile might be used for validation if desired

/**
 * Creates a new health entry for a given profile.
 * @param {Realm} realm - The Realm instance.
 * @param {Realm.BSON.ObjectId} profileId - The ID of the profile this entry belongs to.
 * @param {object} entryData - Data for the new health entry.
 * @returns {HealthEntry | undefined} The created health entry object or undefined on error.
 */
export const createHealthEntry = (realm, profileId, entryData = {}) => {
  if (!realm || typeof realm.write !== 'function') {
    console.error("createHealthEntry: Invalid Realm instance provided.");
    return undefined;
  }
  if (!profileId || !(profileId instanceof Realm.BSON.ObjectId)) {
    console.error("createHealthEntry: Invalid profileId (must be a Realm.BSON.ObjectId).");
    return undefined;
  }

  // Optional: Validate if profileId (as a Profile object) exists in the database
  // const parentProfile = realm.objectForPrimaryKey('Profile', profileId);
  // if (!parentProfile) {
  //   console.error("createHealthEntry: Profile with given profileId does not exist.");
  //   return undefined;
  // }

  let healthEntry;
  realm.write(() => {
    const newEntryPayload = {
      // _id and createdAt have defaults in schema, so they are optional here
      // _id: new Realm.BSON.ObjectId(), 
      profileId: profileId,
      date: entryData.date ? new Date(entryData.date) : new Date(),
      // createdAt: new Date(), // Schema has default
    };

    // Assign optional fields from entryData
    const optionalFields = ['systolic', 'diastolic', 'pulse', 'spO2', 'weight', 'medications', 'notes'];
    optionalFields.forEach(field => {
      if (entryData[field] !== undefined) {
        newEntryPayload[field] = entryData[field];
      }
    });
    
    healthEntry = realm.create('HealthEntry', newEntryPayload);
  });
  return healthEntry;
};

/**
 * Retrieves all health entries for a specific profile, optionally sorted by date.
 * @param {Realm} realm - The Realm instance.
 * @param {Realm.BSON.ObjectId} profileId - The ID of the profile.
 * @param {'asc' | 'desc'} sortByDate - Sort order for the 'date' field ('asc' or 'desc').
 * @returns {Realm.Results<HealthEntry> | undefined} A Realm Results collection of health entries or undefined on error.
 */
export const getHealthEntriesForProfile = (realm, profileId, sortByDate = 'desc') => {
  if (!realm || typeof realm.objects !== 'function') {
    console.error("getHealthEntriesForProfile: Invalid Realm instance provided.");
    return undefined;
  }
  if (!profileId || !(profileId instanceof Realm.BSON.ObjectId)) {
    console.error("getHealthEntriesForProfile: Invalid profileId (must be a Realm.BSON.ObjectId).");
    return undefined;
  }
  
  const entries = realm.objects('HealthEntry').filtered('profileId == $0', profileId);
  // Realm's sorted method: second argument `true` for descending, `false` for ascending.
  return entries.sorted('date', sortByDate === 'desc');
};

/**
 * Retrieves a health entry by its ID.
 * @param {Realm} realm - The Realm instance.
 * @param {Realm.BSON.ObjectId} entryId - The ID of the health entry.
 * @returns {HealthEntry | null | undefined} The health entry object, null if not found, or undefined on error.
 */
export const getHealthEntryById = (realm, entryId) => {
  if (!realm || typeof realm.objectForPrimaryKey !== 'function') {
    console.error("getHealthEntryById: Invalid Realm instance provided.");
    return undefined;
  }
  if (!entryId || !(entryId instanceof Realm.BSON.ObjectId)) {
    console.error("getHealthEntryById: Invalid entryId (must be a Realm.BSON.ObjectId).");
    return null; 
  }
  return realm.objectForPrimaryKey('HealthEntry', entryId);
};

/**
 * Updates an existing health entry.
 * @param {Realm} realm - The Realm instance.
 * @param {Realm.BSON.ObjectId} entryId - The ID of the health entry to update.
 * @param {object} updates - An object containing fields to update.
 * @returns {HealthEntry | null | undefined} The updated health entry, null if not found, or undefined on error.
 */
export const updateHealthEntry = (realm, entryId, updates) => {
  if (!realm || typeof realm.write !== 'function' || typeof realm.objectForPrimaryKey !== 'function') {
    console.error("updateHealthEntry: Invalid Realm instance provided.");
    return undefined;
  }
  if (!entryId || !(entryId instanceof Realm.BSON.ObjectId)) {
    console.error("updateHealthEntry: Invalid entryId (must be a Realm.BSON.ObjectId).");
    return null;
  }

  const entry = realm.objectForPrimaryKey('HealthEntry', entryId);
  if (entry) {
    realm.write(() => {
      for (const key in updates) {
        // Ensure the property is part of the updates object and not a protected/immutable field
        if (Object.prototype.hasOwnProperty.call(updates, key) && 
            key !== '_id' && key !== 'profileId' && key !== 'createdAt') {
          
          if (key === 'date' && typeof updates[key] === 'string') {
            entry[key] = new Date(updates[key]);
          } else {
            entry[key] = updates[key];
          }
        }
      }
    });
    return entry;
  }
  return null; // Entry not found
};

/**
 * Deletes a health entry by its ID.
 * @param {Realm} realm - The Realm instance.
 * @param {Realm.BSON.ObjectId} entryId - The ID of the health entry to delete.
 * @returns {boolean | undefined} True if deleted, false if not found or ID invalid, or undefined on error.
 */
export const deleteHealthEntry = (realm, entryId) => {
  if (!realm || typeof realm.write !== 'function' || typeof realm.objectForPrimaryKey !== 'function' || typeof realm.delete !== 'function') {
    console.error("deleteHealthEntry: Invalid Realm instance provided.");
    return undefined;
  }
  if (!entryId || !(entryId instanceof Realm.BSON.ObjectId)) {
    console.error("deleteHealthEntry: Invalid entryId (must be a Realm.BSON.ObjectId).");
    return false; 
  }

  const entry = realm.objectForPrimaryKey('HealthEntry', entryId);
  if (entry) {
    realm.write(() => {
      realm.delete(entry);
    });
    return true;
  }
  return false; // Entry not found
};
