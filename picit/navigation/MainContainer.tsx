import { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View, Image, Button, Alert } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { NavigationContainer } from '@react-navigation/native'
import {
  createBottomTabNavigator,
  BottomTabNavigationOptions
} from '@react-navigation/bottom-tabs'
import { Session, User } from '@supabase/supabase-js'
import * as Notifications from 'expo-notifications'

import BottomSheet from '@gorhom/bottom-sheet'

import { HomePage } from './screens/HomePage'
import AccountPage from './screens/AccountPage'
import UpdateProfile from '../components/UpdateProfile'
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
  const bottomSheetRef = useRef(null)
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
        screenOptions={({ route }): BottomTabNavigationOptions => ({
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
          }
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
      <BottomSheet ref={bottomSheetRef} index={0} snapPoints={['1%', '110%']}>
        <Text>Bottom Sheet Content</Text>
        <UpdateProfile
          user={user}
          username={''}
          name={''}
          website={''}
          avatarUrl={''}
        />
      </BottomSheet>
    </NavigationContainer>
  )
}
