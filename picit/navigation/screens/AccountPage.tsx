import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import {
  StyleSheet,
  View,
  Alert,
  Button,
  TextInput,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  Modal,
  Pressable,
  ActivityIndicator,
  ScrollView,
  RefreshControl
} from 'react-native'
import { Session } from '@supabase/supabase-js'
import * as ImagePicker from 'expo-image-picker'
import { decode } from 'base64-arraybuffer'
import moment from 'moment'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs' // Use MaterialTopTabNavigator

import { ImagePickerResult, ImagePickerSuccessResult } from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import React from 'react'
import BottomSheet, { SCREEN_HEIGHT } from '@gorhom/bottom-sheet'
import UpdateProfile from '../../components/UpdateProfile'
import TaskList from '../../components/TaskList'
import UserProfile from '../../components/UserProfile'
import FinishedPosts from '../../components/FinishedPosts'
import CurrentTasks from '../../components/CurrentTasks'

export default function AccountPage({ route }: { route: any }) {
  const { userId } = route.params
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  const [name, setName] = useState('')
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
          .eq('id', userId) // Fetch based on the userId
          .single()

        if (error) throw error
        setUser(data)
      } catch (error) {
        console.error('Error fetching user data:', error)
        // Handle error gracefully
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

  async function updateProfile({
    username,
    website,
    avatar_url
  }: {
    username: string
    website: string
    avatar_url: string
  }) {
    try {
      setLoading(true)
      if (!user) throw new Error('No user on the session!')

      const updates = {
        id: user.id,
        username,
        website,
        avatar_url,
        updated_at: new Date()
      }

      const { error } = await supabase.from('users').upsert(updates)

      if (error) {
        throw error
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const pickImage = async () => {
    let result: ImagePickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1
    })

    if (!result.canceled) {
      setImage({ uri: result.assets[0].uri })
      console.log('Image picked:', result.assets[0].uri)
    }

    uploadImage()
  }

  const uploadImage = async () => {
    if (image) {
      const filePath = `${image.uri.split('/').pop()}`

      const base64 = await FileSystem.readAsStringAsync(image.uri, {
        encoding: FileSystem.EncodingType.Base64
      })

      if (base64) {
        const { error } = await supabase.storage
          .from('posts')
          .upload(filePath, decode(base64), {
            contentType: 'image/jpeg',
            upsert: true
          })

        if (error) {
          console.error('Error uploading image:', error)
        } else {
          console.log('Image uploaded successfully')
          const result = await supabase.storage
            .from('posts')
            .getPublicUrl(filePath)
          if (error) {
            console.error('Error getting image URL:', error)
          } else {
            setImageUrls([result.data.publicUrl])
          }
        }
      } else {
        console.error('Error reading image data')
      }
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

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.log('Error logging out:')
    } finally {
      localStorage.clear()
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
