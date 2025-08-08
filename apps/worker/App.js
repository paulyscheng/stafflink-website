import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { JobProvider } from './src/contexts/JobContext';
import LoginScreen from './src/screens/LoginScreen';
import BottomTabNavigator from './src/components/BottomTabNavigator';
import JobDetailScreen from './src/screens/JobDetailScreen';
import CompletedJobDetailScreen from './src/screens/CompletedJobDetailScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <JobProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Main" component={BottomTabNavigator} />
              <Stack.Screen name="JobDetail" component={JobDetailScreen} />
              <Stack.Screen name="CompletedJobDetail" component={CompletedJobDetailScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </JobProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}