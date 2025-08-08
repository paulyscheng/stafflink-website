import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useLanguage } from '../contexts/LanguageContext';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import WorkersScreen from '../screens/WorkersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CreateProjectWizard from '../screens/CreateProjectWizard';

const Tab = createBottomTabNavigator();

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { t } = useLanguage();

  const getTabIcon = (routeName, focused) => {
    let iconName = 'home';
    let iconSize = 22;

    switch (routeName) {
      case 'Home':
        iconName = focused ? 'home' : 'home';
        break;
      case 'Projects':
        iconName = focused ? 'folder' : 'folder-o';
        break;
      case 'CreateProject':
        iconName = 'plus';
        iconSize = 24;
        break;
      case 'Workers':
        iconName = focused ? 'users' : 'users';
        break;
      case 'Profile':
        iconName = focused ? 'user' : 'user-o';
        break;
    }

    return { iconName, iconSize };
  };

  const getTabLabel = (routeName) => {
    switch (routeName) {
      case 'Home':
        return t('home');
      case 'Projects':
        return t('projects');
      case 'CreateProject':
        return '';
      case 'Workers':
        return t('workers');
      case 'Profile':
        return t('profile');
      default:
        return '';
    }
  };

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = getTabLabel(route.name);
        const isFocused = state.index === index;
        const isCreateButton = route.name === 'CreateProject';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const { iconName, iconSize } = getTabIcon(route.name, isFocused);

        if (isCreateButton) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.createButton}
            >
              <View style={styles.createButtonInner}>
                <Icon name={iconName} size={iconSize} color="#ffffff" />
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
          >
            <Icon 
              name={iconName} 
              size={iconSize} 
              color={isFocused ? '#3b82f6' : '#9ca3af'} 
            />
            <Text style={[
              styles.tabLabel,
              { color: isFocused ? '#3b82f6' : '#9ca3af' }
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Projects" 
        component={ProjectsScreen}
        options={{
          tabBarLabel: 'Projects',
        }}
      />
      <Tab.Screen 
        name="CreateProject" 
        component={CreateProjectWizard}
        options={{
          tabBarLabel: '',
          presentation: 'modal',
        }}
      />
      <Tab.Screen 
        name="Workers" 
        component={WorkersScreen}
        options={{
          tabBarLabel: 'Workers',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    paddingBottom: 24, // Extra padding for iPhone safe area
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  createButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  createButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default BottomTabNavigator;