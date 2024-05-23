import { useEffect, useRef, useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Image,
  Button,
  Alert,
  TextInput
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { NavigationContainer } from '@react-navigation/native'
import {
  createBottomTabNavigator,
  BottomTabNavigationOptions
} from '@react-navigation/bottom-tabs'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

import BottomSheet from '@gorhom/bottom-sheet'
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry'

import * as ImagePicker from 'expo-image-picker'
import { decode } from 'base64-arraybuffer'

import { ImagePickerResult, ImagePickerSuccessResult } from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import React from 'react'

const icon = require('../assets/public/default-user-icon.jpg')

export interface UpdateProfileProps {
  user: any
  username: string
  name: string
  website: string
  avatarUrl: string
}

const UpdateProfile: React.FC<UpdateProfileProps> = ({ user }) => {
  const [image, setImage] = useState<{ uri: string } | null>(null)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [pullImg, setPullImg] = useState<string[]>([])

  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [website, setWebsite] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [name, setName] = useState('')
  const [hasRegistered, setHasRegistered] = useState(false)

  const getUser = async (userId: string) => {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)

    if (error) {
      throw error
    }

    return users[0]
  }

  const fetchData = async () => {
    try {
      if (user) {
        setUsername(user.username)
        setName(user.name)
        setWebsite(user.website)
        setHasRegistered(user.reg_complete)

        if (user.avatar_url) {
          setImageUrls([user.avatar_url])
        }
        console.log('user:', user)
      }
    } catch (error) {
      console.error('Error getting user: ', error)
    }
  }

  const pickImage = async () => {
    setLoading(true)
    let result: ImagePickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.5
    })

    if (!result.canceled) {
      setImage({ uri: result.assets[0].uri })
      console.log('Image picked:', result.assets[0].uri)
    } else {
      console.log('Image pick cancelled')
    }
    setLoading(false)
    uploadImage()
  }

  const uploadImage = async () => {
    setLoading(true)
    if (image) {
      const avatarName = `${user.username}.jpg`
      if (user.avatar_url) {
        const existingFilename = user.avatar_url.split('/').pop() || ''

        const { error } = await supabase.storage
          .from('avatars')
          .remove([existingFilename])
        if (error) {
          console.error('Error deleting existing avatar:', error)
        } else {
          console.log('Existing avatar deleted successfully')
        }
      }

      const result = await supabase.storage
        .from('avatars')
        .getPublicUrl(avatarName)
      console.log('result:', result.data.publicUrl)
      setAvatarUrl(result.data.publicUrl)

      const base64 = await FileSystem.readAsStringAsync(image.uri, {
        encoding: FileSystem.EncodingType.Base64
      })
      if (base64) {
        const { error } = await supabase.storage
          .from('avatars')
          .upload(avatarName, decode(base64), {
            contentType: 'image/jpeg',
            upsert: true
          })

        if (error) {
          console.error('Error uploading image:', error)
        } else {
          console.log('Image uploaded successfully')
          const result = await supabase.storage
            .from('avatars')
            .getPublicUrl(avatarName)
          console.log('result:', result.data.publicUrl)
          setAvatarUrl(result.data.publicUrl)

          setImageUrls([result.data.publicUrl])
          const { error } = await supabase.auth.updateUser({
            data: { avatar_url: result.data.publicUrl }
          })

          if (error) {
            console.error('Error updating user profile:', error)
          } else {
            console.log('User profile updated successfully')
          }
        }
      } else {
        console.error('Error reading image data')
      }
    }
    setLoading(false)
  }

  async function updateProfile({
    username,
    name,
    website,
    avatar_url
  }: {
    username: string
    name: string
    website: string
    avatar_url: string
  }) {
    username = username.trim()
    username = username.toLowerCase()

    try {
      setLoading(true)
      if (!user) throw new Error('No user on the session!')

      const updates = {
        id: user.id,
        username,
        name,
        website,
        avatar_url: avatarUrl,
        updated_at: new Date(),
        reg_complete: true
      }

      console.log('updates:', updates)

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
    fetchData()
  }

  async function finishRegister() {
    try {
      setLoading(true)
      const updates = {
        reg_complete: true
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
    fetchData()
  }

  useEffect(() => {
    fetchData()
    setUsername(user.username)
    setName(user.name)
    setWebsite(user.website)
  }, [])

  return (
    <View style={styles.containerStyle}>
      <Text style={styles.headingStyle}>Finish setting up your profile</Text>
      <View style={styles.profilePictureSectionStyle}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.imageStyle} />
        ) : (
          <View style={styles.placeholderImageStyle}>
            <Image source={icon} style={styles.imageStyle} />
          </View>
        )}
      </View>
      <View style={styles.inputFieldStyle}>
        <TextInput placeholder="Email" value={user?.email} />
      </View>
      <View style={styles.inputFieldStyle}>
        <TextInput
          placeholder="Username"
          value={username || ''}
          onChangeText={text => setUsername(text)}
        />
      </View>
      <View style={styles.buttonContainerStyle}>
        <Button
          title={loading ? 'Loading ...' : 'Pick Image'}
          onPress={pickImage}
          disabled={loading}
        />
        <Button
          title={loading ? 'Loading ...' : 'Update'}
          onPress={() =>
            updateProfile({ username, name, website, avatar_url: avatarUrl })
          }
          disabled={loading}
        />
        <Button title="Sign out" onPress={() => supabase.auth.signOut()} />

        {user.reg_complete ? null : (
          <Button
            title={loading ? 'Loading ...' : 'Finish Registration'}
            onPress={() => finishRegister()}
            disabled={loading}
          />
        )}
      </View>
    </View>
  )
}

export default UpdateProfile

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    textDecorationColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 500,
    margin: 10
  },
  text: {
    color: '#000',
    fontSize: 30
  },
  button: {
    color: '#fff',
    fontSize: 30
  },
  div: {
    flexDirection: 'row',
    gap: 20
  },
  containerStyle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5', // Light gray background
    padding: 20,
    borderRadius: 5 // Rounded corners for a polished look
  },
  headingStyle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  profilePictureSectionStyle: {
    width: 100,
    height: 100,
    borderRadius: 50, // Circular profile picture
    overflow: 'hidden', // Prevent image overflow
    marginBottom: 10,
    borderColor: '#ddd', // Light border
    borderWidth: 1
  },
  imageStyle: {
    width: '100%',
    height: '100%'
  },
  placeholderImageStyle: {
    flex: 1, // Take up all available space within the profilePictureSection
    alignItems: 'center',
    justifyContent: 'center'
  },
  placeholderTextStyle: {
    color: '#aaa' // Light gray text for placeholder
  },
  userIdStyle: {
    fontSize: 14,
    color: '#888', // Lighter color for less emphasis
    marginBottom: 10
  },
  inputFieldStyle: {
    marginBottom: 10
  },
  inputStyle: {
    backgroundColor: '#fff', // White background
    borderColor: '#ddd', // Light border
    borderWidth: 1,
    padding: 10,
    borderRadius: 5 // Rounded corners for input fields
  },
  buttonContainerStyle: {
    flexDirection: 'row', // Arrange buttons horizontally
    justifyContent: 'space-around', // Distribute buttons evenly
    marginTop: 20
  },
  buttonStyle: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#007bff',
    color: '#fff'
  }
})
