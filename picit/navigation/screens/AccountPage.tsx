import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import {
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { decode } from 'base64-arraybuffer'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { ImagePickerResult, ImagePickerSuccessResult } from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import React from 'react'
import { SCREEN_HEIGHT } from '@gorhom/bottom-sheet'
import UserProfile from '../../components/UserProfile'
import FinishedPosts from '../../components/FinishedPosts'
import CurrentTasks from '../../components/CurrentTasks'

export default function AccountPage({ route }: { route: any }) {
  const { userId } = route.params
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  const [username, setUsername] = useState('')
  const [website, setWebsite] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [pullImg, setPullImg] = useState<string[]>([])
  const [image, setImage] = useState<{ uri: string } | null>(null)
  const [imageUrls, setImageUrls] = useState<string[]>([])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select()
          .eq('id', userId)
          .single()

        if (error) throw error
        setUser(data)
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId])

  const Tab = createMaterialTopTabNavigator()

  async function getProfile(user: any) {
    try {
      setLoading(true)
      const { data, error, status } = await supabase
        .from('users')
        .select(`username, website, avatar_url`)
        .eq('id', user)
        .single()
      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setUsername(data.username)
        setWebsite(data.website)
        setAvatarUrl(data.avatar_url)
        console.log('Profile fetched:', data)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const getImagesFromSupabase = async (user: any) => {
    try {
      const { data, error } = await supabase.storage.from('posts').list()
      let files: string[] = []
      if (data) {
        data.map(file => {
          if (file.name !== '.emptyFolderPlaceholder') {
            const { data } = supabase.storage
              .from('posts')
              .getPublicUrl(file.name)
            files.push(data.publicUrl)
          }
        })
      }
      setPullImg(files)
    } catch (error) {
      console.error('Error fetching images:', error)
      return []
    }
  }

  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    getImagesFromSupabase(user)
    getProfile(user).then(() => setRefreshing(false))
  }, [])

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <UserProfile user={user} />
      )}
      <Tab.Navigator
        style={{ height: SCREEN_HEIGHT - 400 }}
        initialRouteName="Finished Posts"
        screenOptions={{
          tabBarLabelStyle: { fontSize: 12 },
          tabBarActiveTintColor: 'blue',
          tabBarInactiveTintColor: 'gray',
          tabBarIndicatorStyle: { backgroundColor: 'blue' }
        }}>
        <Tab.Screen
          name="Finished Posts"
          component={FinishedPosts}
          initialParams={{ user: userId }}
        />
        <Tab.Screen
          name="Current Tasks"
          component={CurrentTasks}
          initialParams={{ user: userId }}
        />
      </Tab.Navigator>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch'
  },
  mt20: {
    marginTop: 20
  },
  imageCont: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2
  },
  buttonClose: {
    backgroundColor: '#2196F3'
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center'
  }
})
