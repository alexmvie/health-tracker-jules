import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as apiService from '../apiService'; // Adjust path as necessary

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // e.g., { id, email }
  const [isLoading, setIsLoading] = useState(true); // For checking token from storage initially

  useEffect(() => {
    const bootstrapAsync = async () => {
      let storedToken = null;
      let storedUser = null;
      try {
        storedToken = await AsyncStorage.getItem('userToken');
        const storedUserString = await AsyncStorage.getItem('currentUser');
        if (storedUserString) {
          storedUser = JSON.parse(storedUserString);
        }
      } catch (e) {
        console.error('Failed to load auth state from AsyncStorage', e);
        // Could also report this to an error tracking service
      }
      
      setUserToken(storedToken);
      setCurrentUser(storedUser);
      setIsLoading(false);
      console.log('AuthContext: Initial bootstrap complete. Token:', storedToken, 'User:', storedUser);
    };

    bootstrapAsync();
  }, []);

  const login = async (email, password) => {
    console.log('AuthContext: Attempting login for', email);
    try {
      const response = await apiService.loginUser(email, password);
      if (response && response.token) {
        setUserToken(response.token);
        // Assuming the API response includes user details in a 'user' field or similar
        // Our mock login in apiService returns { token }, it doesn't have full user object.
        // For now, let's mock a user object based on the token or a separate API call would be needed.
        // The JWT payload has { userId, email }. We can decode it (not recommended on client) or have API return it.
        // Our mock JWT payload is { userId: 'mockUserId-' + email.split('@')[0], email: email }
        // Let's assume the API's /login route is enhanced to return { token, user: {id, email} }
        // For this placeholder, if apiService.loginUser returns {token, user}, use response.user.
        // Our current apiService.loginUser just returns the raw response which is { token: "..." }
        // So, we'll manually create a mock user object upon successful login for now.
        const mockUserPayload = { 
            id: 'mockUserId-' + email.split('@')[0], // Derived from JWT logic in server's auth.js
            email: email 
        };
        setCurrentUser(mockUserPayload);

        await AsyncStorage.setItem('userToken', response.token);
        await AsyncStorage.setItem('currentUser', JSON.stringify(mockUserPayload));
        console.log('AuthContext: Login successful. Token and user stored.');
        return { success: true, data: response }; // Return success and full response
      } else {
        // This case might not be hit if apiService throws an error for non-2xx responses
        console.warn('AuthContext: Login response missing token.', response);
        throw new Error(response?.message || 'Login failed, token not received.');
      }
    } catch (error) {
      console.error('AuthContext: Login error', error);
      // Ensure error is an actual Error object for consistent handling
      const errToThrow = error instanceof Error ? error : new Error(JSON.stringify(error));
      throw errToThrow;
    }
  };

  const register = async (email, password) => {
    console.log('AuthContext: Attempting registration for', email);
    try {
      // apiService.registerUser returns { message, user: {id, email} } on mock success
      const response = await apiService.registerUser(email, password);
      console.log('AuthContext: Registration successful (mock).', response);
      // Optionally, auto-login after registration or prompt user to login
      // For this example, we won't auto-login to keep it simple.
      return { success: true, data: response };
    } catch (error) {
      console.error('AuthContext: Registration error', error);
      const errToThrow = error instanceof Error ? error : new Error(JSON.stringify(error));
      throw errToThrow;
    }
  };

  const logout = async () => {
    console.log('AuthContext: Logging out.');
    setUserToken(null);
    setCurrentUser(null);
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('currentUser');
      console.log('AuthContext: Token and user removed from storage.');
    } catch (e) {
      console.error('AuthContext: Failed to remove auth state from AsyncStorage', e);
    }
    // In a real app, you might also want to call a backend /logout endpoint if it exists
    // to invalidate the token on the server-side if possible.
  };

  const authContextValue = {
    userToken,
    currentUser,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
