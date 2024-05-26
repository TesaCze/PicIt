import { useEffect, useRef, useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Image,
  Button,
  Alert,
  TextInput,
  TouchableOpacity
} from 'react-native'
import { supabase } from '../lib/supabase'

import * as ImagePicker from 'expo-image-picker'
import { decode } from 'base64-arraybuffer'

import { ImagePickerResult } from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import React from 'react'

const icon = require('../assets/public/default-user-icon.jpg')

export interface UpdateProfileProps {
  user: any
  username: string
  name: string
  website: string
  avatarUrl: string
  onRegistrationComplete: () => void
}

const UpdateProfile: React.FC<UpdateProfileProps> = ({
  user,
  onRegistrationComplete
}) => {
  const [image, setImage] = useState<{ uri: string } | null>(null)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [website, setWebsite] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [name, setName] = useState('')
  const [hasRegistered, setHasRegistered] = useState(false)
  const [newImagePicked, setNewImagePicked] = useState(false)

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      if (user) {
        setUsername(user.username || '')
        setName(user.name || '')
        setWebsite(user.website || '')
        setHasRegistered(user.reg_complete || false)
        if (user.avatar_url) {
          setImageUrls([user.avatar_url])
        } else {
          setImageUrls([icon])
        }
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
      setNewImagePicked(true)
      await uploadImage(result.assets[0].uri)
    } else {
      console.log('Image pick cancelled')
      setNewImagePicked(false)
    }
    setLoading(false)
  }

  const uploadImage = async (uri: string) => {
    setLoading(true)

    if (uri) {
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

      const base64 = await FileSystem.readAsStringAsync(uri, {
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
          const { error: updateUserError } = await supabase.auth.updateUser({
            data: { avatar_url: result.data.publicUrl }
          })
          fetchData()

          if (updateUserError) {
            console.error('Error updating user profile:', updateUserError)
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

  const updateProfile = async ({
    username,
    name,
    website,
    avatar_url
  }: {
    username: string
    name: string
    website: string
    avatar_url: string
  }) => {
    try {
      setLoading(true)
      if (!user) throw new Error('No user on the session!')
      username = username.trim().toLowerCase() // fix nekdy u registrace se rozbije

      const updates = {
        id: user.id,
        username,
        name,
        website: website.trim(),
        updated_at: new Date(),
        reg_complete: true,
        ...(newImagePicked && { avatar_url })
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

  const finishRegister = async () => {
    try {
      setLoading(true)
      const updates = {
        reg_complete: true
      }

      const { error } = await supabase.from('users').upsert(updates)
      if (error) {
        throw error
      } else {
        onRegistrationComplete()
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      onRegistrationComplete()
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
      <TouchableOpacity
        style={styles.profilePictureSectionStyle}
        onPress={pickImage}>
        {user.avatar_url && imageUrls.length >= 0 ? (
          <Image
            source={{
              uri: avatarUrl || user.avatar_url || imageUrls[0] || icon
            }}
            style={styles.imageStyle}
          />
        ) : (
          <View style={styles.placeholderImageStyle}>
            <Image source={icon} style={styles.imageStyle} />
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.userImageText}>
        Tap on the picture to change your profile avatar
      </Text>
      <View style={styles.inputFieldContainer}>
        <Text>Username: </Text>
        {!hasRegistered ? (
          <TextInput
            style={styles.inputStyle}
            placeholder="Username"
            value={username}
            onChangeText={text => setUsername(text)}
          />
        ) : (
          <Text style={styles.usernameStyle}>@{username || ''}</Text>
        )}
      </View>

      <View style={styles.inputFieldContainer}>
        <Text>Full name: </Text>
        <TextInput
          style={styles.inputStyle}
          placeholder="Name"
          value={name}
          onChangeText={text => setName(text)}
        />
      </View>

      <View
        style={[styles.inputFieldContainer, styles.descriptionInputContainer]}>
        <Text>Description: </Text>
        <TextInput
          style={[styles.inputStyle, styles.descriptionInput]}
          placeholder="Bio"
          value={website}
          onChangeText={text => setWebsite(text)}
          multiline
        />
      </View>
      <View style={styles.buttonContainerStyle}>
        <Button
          title={loading ? 'Loading ...' : 'Update'}
          onPress={() =>
            updateProfile({ username, name, website, avatar_url: avatarUrl })
          }
          disabled={loading}
          color="#007bff"
        />

        {!user.reg_complete && username !== null && name !== null && (
          <Button
            title={loading ? 'Loading ...' : 'Finish Registration'}
            onPress={finishRegister}
            disabled={loading}
            color="#28a745"
          />
        )}
      </View>
      <Button
        title="Sign out"
        onPress={() => supabase.auth.signOut()}
        color="#dc3545"
      />
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
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 5
  },
  headingStyle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  profilePictureSectionStyle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 10,
    borderColor: '#ddd',
    borderWidth: 1
  },
  imageStyle: {
    width: '100%',
    height: '100%'
  },
  placeholderImageStyle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  placeholderTextStyle: {
    color: '#aaa'
  },
  userImageText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
    width: '60%',
    textAlign: 'center'
  },
  inputFieldStyle: {
    marginBottom: 10
  },
  usernameStyle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 10
  },
  buttonContainerStyle: {
    marginTop: 20
  },
  buttonStyle: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10
  },
  inputFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%'
  },
  descriptionInputContainer: {
    alignItems: 'flex-start' // Align description text to the top left
  },
  inputStyle: {
    flex: 1, // Allow input to take up remaining space
    backgroundColor: '#fff',
    borderColor: '#ced4da',
    borderWidth: 1,
    padding: 15,
    borderRadius: 5,
    minHeight: 40 // Set a minimum height for consistency
  },
  descriptionInput: {
    minHeight: 80 // Make the description input larger
  }
})
