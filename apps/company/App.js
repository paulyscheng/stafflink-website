import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { ModalProvider } from '../../shared/components/Modal/ModalService';
import ErrorBoundary from '../../shared/components/Error/ErrorBoundary';
import LoginScreen from './src/screens/LoginScreen';
import BottomTabNavigator from './src/components/BottomTabNavigator';
import ProjectDetailScreen from './src/screens/ProjectDetailScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import CompletedJobsScreen from './src/screens/CompletedJobsScreen';
import ConfirmJobScreen from './src/screens/ConfirmJobScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import CompanyInfoScreen from './src/screens/CompanyInfoScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <ModalProvider>
                <NavigationContainer>
                  <StatusBar style="light" />
                  <Stack.Navigator
                    screenOptions={{
                      headerShown: false,
                    }}
                  >
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Main" component={BottomTabNavigator} />
                    <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
                    <Stack.Screen name="Notifications" component={NotificationScreen} />
                    <Stack.Screen name="CompletedJobs" component={CompletedJobsScreen} />
                    <Stack.Screen name="ConfirmJob" component={ConfirmJobScreen} />
                    <Stack.Screen name="Payment" component={PaymentScreen} />
                    <Stack.Screen name="CompanyInfo" component={CompanyInfoScreen} />
                  </Stack.Navigator>
                </NavigationContainer>
              </ModalProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}