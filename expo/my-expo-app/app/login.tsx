import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../lib/context/AuthContext'; // Adjusted path
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    try {
      console.log('LoginScreen: Attempting login with email:', email);
      const result = await auth.login(email, password);
      // AuthContext's login now returns { success: true, data: response }
      // If login is successful, the AuthContext's useEffect in AuthProvider
      // will set userToken, and the conditional navigation in _layout.tsx
      // should automatically navigate to the main app.
      // We might not need an explicit router.replace('/') here if _layout handles it.
      // However, if _layout's redirect logic isn't immediate or if we want to be explicit:
      // router.replace('/(tabs)'); // or your main app route
      console.log('LoginScreen: Login successful (AuthContext will handle state update)', result);
      // No explicit navigation needed here if RootLayout handles it based on userToken
    } catch (error) {
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      console.error('LoginScreen: Login error:', errorMessage, error);
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}
      <View style={styles.linkContainer}>
        <Button 
          title="Don't have an account? Register" 
          onPress={() => router.push('/register')} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
});
