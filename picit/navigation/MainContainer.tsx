import { useEffect, useRef, useState } from 'react'
import { StyleSheet } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Session, User } from '@supabase/supabase-js'

import { HomePage } from './screens/HomePage'
import AccountPage from './screens/AccountPage'
import CreateTaskPage from './screens/CreateTastPage'
import ChatScreenPage from './screens/ChatScreenPage'

import React from 'react'
import SearchPage from './screens/SearchPage'

const homeName = 'Home'
const taskName = 'Tasks'
const accountName = 'Account'
const searchName = 'Search'
const chatName = 'Chat'

const Tab = createBottomTabNavigator()

type MainContainerProps = {
  session: (session: boolean) => void
}

export default function MainContainer({ session }: { session: Session }) {
  const [user, setUser] = useState<User | null>(session?.user || null)

  useEffect(() => {
    if (session?.user) {
      setUser(session.user)
    }
  }, [session])

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName={homeName}
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: any
            if (route.name === homeName) {
              iconName = focused ? 'home' : 'home-outline'
            } else if (route.name === chatName) {
              iconName = focused ? 'mail' : 'mail-outline'
            } else if (route.name === taskName) {
              iconName = focused ? 'checkbox' : 'checkbox-outline'
            } else if (route.name === searchName) {
              iconName = focused ? 'search' : 'search-outline'
            } else if (route.name === accountName) {
              iconName = focused ? 'person' : 'person-outline'
            }
            return <Ionicons name={iconName} size={size} color={color} />
          },
          tabBarActiveTintColor: '#2f95dc',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: styles.tabBarStyle,
          tabBarLabelStyle: styles.tabBarLabelStyle,
          headerStyle: styles.headerStyle,
          headerTintColor: '#fff',
          headerTitleStyle: styles.headerTitleStyle
        })}>
        <Tab.Screen
          name={homeName}
          component={HomePage}
          initialParams={{ session, user }}
        />
        <Tab.Screen name={chatName} component={ChatScreenPage} />
        <Tab.Screen name={searchName} component={SearchPage} />
        <Tab.Screen name={taskName} component={CreateTaskPage} />
        <Tab.Screen name={accountName}>
          {() => (
            <AccountPage route={{ params: { userId: session.user.id } }} />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  tabBarStyle: {
    backgroundColor: '#f5f5f5',
    borderTopWidth: 0,
    height: 80,
    paddingBottom: 30,
    paddingTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 5
  },
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: '600'
  },
  headerStyle: {
    backgroundColor: '#2f95dc'
  },
  headerTitleStyle: {
    fontWeight: 'bold'
  }
})
