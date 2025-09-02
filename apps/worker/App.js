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
import NotificationScreen from './src/screens/NotificationScreen';
import InvitationDetailScreen from './src/screens/InvitationDetailScreen';
import ProjectDetailScreen from './src/screens/ProjectDetailScreen';
import PaymentDetailScreen from './src/screens/PaymentDetailScreen';
import ActiveJobScreen from './src/screens/ActiveJobScreen';
import CompleteJobScreen from './src/screens/CompleteJobScreen';

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
              <Stack.Screen name="Notification" component={NotificationScreen} />
              <Stack.Screen name="InvitationDetail" component={InvitationDetailScreen} />
              <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
              <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
              <Stack.Screen name="ActiveJob" component={ActiveJobScreen} />
              <Stack.Screen name="CompleteJob" component={CompleteJobScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </JobProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}