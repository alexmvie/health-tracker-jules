import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../lib/context/AuthContext'; // Adjusted path
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    // Password length validation is handled by auth.register via apiService -> server validation
    // but a client-side check could be added here too for immediate feedback.

    setIsLoading(true);
    try {
      console.log('RegisterScreen: Attempting registration for email:', email);
      // AuthContext's register function returns { success: true, data: response }
      const result = await auth.register(email, password); 
      
      if (result.success) {
        console.log('RegisterScreen: Registration successful', result.data);
        Alert.alert(
          'Registration Successful', 
          result.data?.message || 'You can now log in.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
      } else {
        // This case might not be hit if auth.register throws an error for non-2xx responses
        // or if the error is already an Error object with a message.
        const errorMessage = result.message || (result.errors && result.errors[0]?.msg) || 'Registration failed.';
        console.warn('RegisterScreen: Registration failed (non-thrown error).', result);
        Alert.alert('Registration Failed', errorMessage);
      }
    } catch (error) {
      // This catches errors thrown by auth.register (e.g., network issues, or if it re-throws API errors)
      const errorMessage = error.message || (error.errors && error.errors[0]?.msg) || 'An unexpected error occurred.';
      console.error('RegisterScreen: Registration error:', errorMessage, error);
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
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
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Register" onPress={handleRegister} />
      )}
      <View style={styles.linkContainer}>
        <Button 
          title="Already have an account? Login" 
          onPress={() => router.push('/login')} 
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
