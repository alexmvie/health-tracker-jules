import { StyleSheet, Button, Alert } from 'react-native'; // Added Button, Alert
import { useEffect, useState } from 'react'; // Added useState
import { useRealm } from '@realm/react';
// import Realm from 'realm'; // No longer needed for local tests here
import * as RealmProfileService from '../../lib/realm/profileService'; // Renamed import
// import * as HealthEntryService from '../../lib/realm/healthEntryService'; // Commented out
import { syncBackendDataToLocal, pushProfileCreation as SyncServicePushProfileCreation } from '../../lib/syncService'; // Renamed import
import { loginUser as ApiLoginUser } from '../../lib/apiService'; // Renamed import
import { Profile } from '../../lib/realm/schemas'; // Added Profile schema import
import { HealthEntry } from '../../lib/realm/schemas'; // Added HealthEntry schema import
import { useAuth } from '../../lib/context/AuthContext'; // Added useAuth import


import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';

export default function TabOneScreen() {
  const realm = useRealm();
  const { userToken, login: authContextLogin } = useAuth(); // Get auth context
  const [isSyncing, setIsSyncing] = useState(false); // For UI feedback
  const [isPushing, setIsPushing] = useState(false); // For UI feedback for push button
  const [isCreatingAndPushingProfile, setIsCreatingAndPushingProfile] = useState(false);

  const handleCreateAndPushProfile = async () => {
    if (isCreatingAndPushingProfile) return;
    setIsCreatingAndPushingProfile(true);
    Alert.alert("Create & Push Started", "Attempting to create local profile and push to backend...");
    console.log('Attempting to create local profile and push to backend...');

    let currentToken = userToken; // From useAuth()

    try {
      // Step 1: Ensure user is authenticated
      if (!currentToken) {
        console.log("No token found from context, attempting mock login for test...");
        try {
          // authContextLogin is the login function from useAuth()
          const loginResponse = await authContextLogin('testuser@example.com', 'password123'); 
          // Assuming loginResponse from AuthContext's login is { success: true, data: { token: ... } } 
          // or directly the API response { token: ... }
          // The AuthContext login function was designed to return { success: true, data: response (from apiService) }
          if (loginResponse && loginResponse.success && loginResponse.data && loginResponse.data.token) {
            currentToken = loginResponse.data.token;
            console.log("Mock login successful, token obtained for test.");
          } else {
            Alert.alert("Authentication Error", "Mock login failed for test. Cannot proceed.");
            setIsCreatingAndPushingProfile(false);
            return;
          }
        } catch (e) {
          console.error("Mock login exception:", e);
          Alert.alert("Authentication Error", `Mock login exception: ${e.message || 'Unknown error'}`);
          setIsCreatingAndPushingProfile(false);
          return;
        }
      }

      // Step 2: Create Profile Locally
      const localProfileName = 'Local Synced Profile ' + Date.now();
      console.log(`Creating local profile: "${localProfileName}"`);
      const newLocalProfile = RealmProfileService.createProfile(realm, localProfileName);

      if (!newLocalProfile || !newLocalProfile.name) { // Check if profile creation was successful
        Alert.alert("Local Error", "Failed to create profile locally.");
        setIsCreatingAndPushingProfile(false);
        return;
      }
      console.log('Local profile created:', JSON.stringify(newLocalProfile, null, 2));

      // Step 3: Push Profile to Backend
      console.log(`Pushing profile "${newLocalProfile.name}" to backend...`);
      // SyncServicePushProfileCreation expects (token, { name: string })
      const pushResult = await SyncServicePushProfileCreation(currentToken, { name: newLocalProfile.name });
      
      console.log('Push Profile to Backend complete:', JSON.stringify(pushResult, null, 2));
      if (pushResult.success) {
        Alert.alert("Push Successful", pushResult.message || `Profile "${newLocalProfile.name}" pushed! API response: ${JSON.stringify(pushResult.data)}`);
        // Optional: Update local profile with _id from backend if needed, or trigger full sync
        // if (pushResult.data && pushResult.data._id) {
        //   realm.write(() => {
        //     const localProfileToUpdate = realm.objectForPrimaryKey('Profile', newLocalProfile._id);
        //     if (localProfileToUpdate) {
        //       // This assumes backend _id should replace local one, or be stored in a separate field.
        //       // This part requires careful schema design for synced objects.
        //       // For now, we just log.
        //       console.log(`Backend assigned ID ${pushResult.data._id} to profile originally named ${newLocalProfile.name}`);
        //     }
        //   });
        // }
      } else {
        Alert.alert("Push Failed", pushResult.message || "Failed to push profile. Check console.");
      }
    } catch (error) {
      console.error('Error during create and push profile process:', error);
      Alert.alert("Process Error", `An error occurred: ${error.message || 'Unknown error'}`);
    } finally {
      setIsCreatingAndPushingProfile(false);
    }
  };

  // Comment out the existing useEffect for local CRUD tests to avoid interference
  /*
  useEffect(() => {
    const runCrudTests = async () => {
      // ... existing local CRUD test code ...
    };
    if (realm) { runCrudTests().catch(console.error); }
  }, [realm]);
  */

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    Alert.alert("Sync Started", "Attempting to sync data with the backend...");
    console.log('Attempting manual sync...');

    try {
      // 1. Get Auth Token (Test Implementation)
      console.log('Attempting to log in for sync token...');
      // Use different credentials than server-side tests if needed, or make them configurable
      const loginData = await loginUser('testuser@example.com', 'password123');
      
      if (!loginData || !loginData.token) {
        console.error('Sync failed: Could not get auth token.');
        Alert.alert("Sync Failed", "Could not get authentication token.");
        setIsSyncing(false);
        return;
      }
      const receivedToken = loginData.token;
      console.log('Auth token received for sync.');

      // 2. Call Sync Function
      console.log('Calling syncBackendDataToLocal...');
      const syncResult = await syncBackendDataToLocal(realm, receivedToken);
      
      console.log('Sync complete:', JSON.stringify(syncResult, null, 2));
      if (syncResult.success) {
        console.log('Sync successful, logging local data...');
        const localProfiles = realm.objects('Profile');
        console.log('Local Profiles after sync:', JSON.stringify(Array.from(localProfiles), null, 2));
        const localHealthEntries = realm.objects('HealthEntry');
        console.log('Local HealthEntries after sync:', JSON.stringify(Array.from(localHealthEntries), null, 2));
        Alert.alert("Sync Successful", syncResult.message || "Data synced successfully! Check console for local data.");
      } else {
        Alert.alert("Sync Issues", syncResult.message || "Sync completed with some issues. Check console for details.");
        if (syncResult.errors && syncResult.errors.length > 0) {
          console.error("Sync errors details:", syncResult.errors);
        }
      }
    } catch (error) {
      console.error('Error during manual sync process:', error);
      Alert.alert("Sync Error", `An error occurred: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestPushProfile = async () => {
    if (isPushing) return;
    setIsPushing(true);
    Alert.alert("Push Started", "Attempting to push new profile...");
    console.log('Attempting to push test profile...');

    try {
      const loginData = await loginUser('testuser@example.com', 'password123'); // Use same test credentials
      if (!loginData || !loginData.token) {
        console.error('Push failed: Could not get auth token.');
        Alert.alert("Push Failed", "Could not get authentication token.");
        setIsPushing(false);
        return;
      }
      const token = loginData.token;

      const profileName = 'Pushed Test Profile ' + Date.now();
      const pushResult = await pushProfileCreation(token, { name: profileName });
      
      console.log('Push Profile complete:', JSON.stringify(pushResult, null, 2));
      if (pushResult.success) {
        Alert.alert("Push Successful", pushResult.message || `Profile "${profileName}" pushed successfully! API response: ${JSON.stringify(pushResult.data)}`);
        // Optionally, you could trigger a new sync here or update local Realm if backend returns the created object with ID
        // For example, if pushResult.data contains the created profile from the backend:
        // realm.write(() => {
        //   realm.create('Profile', {
        //     _id: new Realm.BSON.ObjectId(pushResult.data._id), // Assuming backend _id is string
        //     name: pushResult.data.name,
        //     createdAt: new Date(pushResult.data.createdAt)
        //   }, 'modified');
        // });
      } else {
        Alert.alert("Push Failed", pushResult.message || "Failed to push profile. Check console.");
      }
    } catch (error) {
      console.error('Error during test push profile process:', error);
      Alert.alert("Push Error", `An error occurred: ${error.message || 'Unknown error'}`);
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab One Sync & Push</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <Button 
        title={isSyncing ? "Syncing..." : "Manual Sync with Backend"} 
        onPress={handleManualSync} 
        disabled={isSyncing} 
      />
      <View style={{ marginVertical: 10 }} /> 
      <Button
        title={isPushing ? "Pushing Profile..." : "Test Push New Profile"}
        onPress={handleTestPushProfile}
        disabled={isPushing}
        color="#841584" // Optional: different color for different button
      />
      <View style={{ marginVertical: 10 }} /> 
      <Button
        title={isCreatingAndPushingProfile ? "Creating & Pushing..." : "Create Local & Push Profile"}
        onPress={handleCreateAndPushProfile}
        disabled={isCreatingAndPushingProfile}
        color="#28a745" // Another color
      />
      <EditScreenInfo path="app/(tabs)/index.tsx" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});

// Need to define handleCreateAndPushProfile function.
// This was missed in the initial diff planning.
// The previous diff only added the button and state.
// I will create a new diff to insert the handleCreateAndPushProfile function.
// This is because the original diff was complex and missed this part.
// The function definition should be within TabOneScreen.

// For now, the diff above handles imports, state, and button.
// The next step would be to add the function logic.
// The current diff is not complete as per the full plan in the thought block.
// I need to ensure the `handleCreateAndPushProfile` function is added.
// Let's reconstruct the diff to include the function.

// The previous diff was not applied. I am re-doing it to be complete.
// The search blocks need to be accurate.
// First search block: for imports.
// Second search block: for state variables.
// Third search block: for the function definition.
// Fourth search block: for the button in JSX.
// This is too many blocks for one `replace_with_git_merge_diff`.

// I will do this in stages.
// Stage 1: Imports and state (this diff).
// Stage 2: `handleCreateAndPushProfile` function definition.
// Stage 3: Adding the button to JSX.

// The current diff above (the one the tool generated) only covers imports and the button addition.
// It does not add the `handleCreateAndPushProfile` function or the new state variable `isCreatingAndPushingProfile`.
// This is an error in my diff construction.

// Let's simplify. I will make one large diff.
// The search block will be the entire `TabOneScreen` function.
// The replacement will be the new `TabOneScreen` function with all changes.
// This is risky if the original function is very long or changes often.
// But given the context, it might be the most reliable for the tool.

// Re-reading the file content from the tool output.
// The current diff provided by the tool is only adding the button and the state.
// And modifying imports. This is fine for a first step.
// I will then add the function logic in the next step.
// The `replace_with_git_merge_diff` tool output for the last attempt was:
// `Edit applied successfully. Patch applied was: ...` (showing changes to imports, state, and button)
// So, the file *does* have the new state `isCreatingAndPushingProfile` and the new button.
// And the imports were updated (e.g. `useAuth`).
// What is missing is the `handleCreateAndPushProfile` function itself.

// The file state after the above successful diff (from the tool output):
// - Imports are updated (useAuth, RealmProfileService, SyncServicePushProfileCreation, ApiLoginUser).
// - State `isCreatingAndPushingProfile` is added.
// - A new button "Create Local & Push Profile" is added.
// - The `handleCreateAndPushProfile` function is *MISSING*.

// My next action must be to insert the `handleCreateAndPushProfile` function definition.
// I'll search for the line `const [isCreatingAndPushingProfile, setIsCreatingAndPushingProfile] = useState(false);`
// and insert the function definition after it.
