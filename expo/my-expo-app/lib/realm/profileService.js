// expo/my-expo-app/lib/realm/profileService.js
import Realm from 'realm';
import { Profile, HealthEntry } from './schemas'; // Assuming schemas.js is in the same directory

/**
 * Creates a new profile.
 * @param {Realm} realm - The Realm instance.
 * @param {string} name - The name of the profile.
 * @returns {Profile | undefined} The created profile object, or undefined if realm is not valid.
 */
export const createProfile = (realm, name) => {
  if (!realm || typeof realm.write !== 'function') {
    console.error("createProfile: Invalid Realm instance provided.");
    return undefined;
  }
  let profile;
  realm.write(() => {
    profile = realm.create('Profile', {
      // _id will be set by default as per schema if not provided
      // but it's good practice to ensure it's a new ObjectId if you want to be explicit
      // _id: new Realm.BSON.ObjectId(), 
      name: name,
      // createdAt will be set by default as per schema
    });
  });
  return profile;
};

/**
 * Retrieves all profiles.
 * @param {Realm} realm - The Realm instance.
 * @returns {Realm.Results<Profile> | undefined} A Realm Results collection of all profiles, or undefined if realm is not valid.
 */
export const getAllProfiles = (realm) => {
  if (!realm || typeof realm.objects !== 'function') {
    console.error("getAllProfiles: Invalid Realm instance provided.");
    return undefined;
  }
  return realm.objects('Profile');
};

/**
 * Retrieves a profile by its ID.
 * @param {Realm} realm - The Realm instance.
 * @param {Realm.BSON.ObjectId} profileId - The ID of the profile to retrieve.
 * @returns {Profile | null | undefined} The profile object, null if not found, or undefined if realm/profileId is invalid.
 */
export const getProfileById = (realm, profileId) => {
  if (!realm || typeof realm.objectForPrimaryKey !== 'function') {
    console.error("getProfileById: Invalid Realm instance provided.");
    return undefined;
  }
  if (!profileId || !(profileId instanceof Realm.BSON.ObjectId)) {
    // console.warn('getProfileById: profileId must be a valid ObjectId.');
    return null; // Or undefined, depending on desired strictness for invalid ID format
  }
  return realm.objectForPrimaryKey('Profile', profileId);
};

/**
 * Updates the name of an existing profile.
 * @param {Realm} realm - The Realm instance.
 * @param {Realm.BSON.ObjectId} profileId - The ID of the profile to update.
 * @param {string} newName - The new name for the profile.
 * @returns {Profile | null | undefined} The updated profile object, null if not found, or undefined if realm/profileId is invalid.
 */
export const updateProfileName = (realm, profileId, newName) => {
  if (!realm || typeof realm.write !== 'function' || typeof realm.objectForPrimaryKey !== 'function') {
    console.error("updateProfileName: Invalid Realm instance provided.");
    return undefined;
  }
  if (!profileId || !(profileId instanceof Realm.BSON.ObjectId)) {
    return null; 
  }
  const profile = realm.objectForPrimaryKey('Profile', profileId);
  if (profile) {
    realm.write(() => {
      profile.name = newName;
    });
    return profile;
  }
  return null;
};

/**
 * Deletes a profile and all its associated health entries.
 * @param {Realm} realm - The Realm instance.
 * @param {Realm.BSON.ObjectId} profileId - The ID of the profile to delete.
 * @returns {boolean | undefined} True if the profile was deleted, false if not found or ID invalid, undefined if realm is invalid.
 */
export const deleteProfile = (realm, profileId) => {
  if (!realm || typeof realm.write !== 'function' || typeof realm.objectForPrimaryKey !== 'function' || typeof realm.objects !== 'function' || typeof realm.delete !== 'function') {
    console.error("deleteProfile: Invalid Realm instance provided.");
    return undefined;
  }
  if (!profileId || !(profileId instanceof Realm.BSON.ObjectId)) {
    return false; 
  }
  const profile = realm.objectForPrimaryKey('Profile', profileId);
  if (profile) {
    realm.write(() => {
      const healthEntriesToDelete = realm.objects('HealthEntry').filtered('profileId == $0', profileId);
      realm.delete(healthEntriesToDelete);
      realm.delete(profile);
    });
    return true;
  }
  return false;
};
