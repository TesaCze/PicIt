import React, { useContext, useState } from 'react'
import {
  Alert,
  StyleSheet,
  View,
  AppState,
  Button,
  TextInput,
  Text
} from 'react-native'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'
import UpdateProfile from './UpdateProfile'

AppState.addEventListener('change', state => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

type MainContainerProps = {
  session: (session: boolean) => void
}

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any | null>(null)

  async function signInWithEmail() {
    setLoading(true)
    console.log('signing in')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      console.log(data)
      if (error) throw error

      setSession(data.session)
      setRegister(false)
      setIsUpdating(false)
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      } else {
        Alert.alert('An unexpected error occurred during sign-in.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function signUpWithEmail() {
    if (password !== passwordConfirm) {
      Alert.alert('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const {
        data: { session },
        error
      } = await supabase.auth.signUp({
        email: email,
        password: password
      })

      if (error) {
        console.log(error)
        Alert.alert(error.message)
      }
      if (!session)
        Alert.alert('Please check your inbox for email verification!')
    } catch (error) {
      console.log(error)
      Alert.alert('An unexpected error occurred.')
    } finally {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      console.log('session: ' + session + ' user: ' + session?.user)
      setSession(session)
      const user = await getUser(session?.user?.id)
      user.avatarUrl =
        'https://jqgspngcahxhvxmkyuep.supabase.co/storage/v1/object/public/avatars/default-user-icon.jpg'
      setLoading(false)
      setIsUpdating(true)
    }
  }

  const getUser = async (userId: any) => {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)

    if (error) {
      throw error
    }

    setUser(users[0])
    setIsUpdating(true)

    return users[0]
  }

  const [register, setRegister] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [session, setSession] = useState<Session | null>(null)

  return (
    <>
      {!register ? (
        <View style={styles.container}>
          <Text style={styles.heading}>PicIt</Text>
          <View style={[styles.verticallySpaced, styles.mt20]}>
            <TextInput
              style={styles.text}
              placeholder="Email"
              onChangeText={text => setEmail(text)}
              value={email}
              autoCapitalize={'none'}
            />
          </View>
          <View style={styles.verticallySpaced}>
            <TextInput
              style={styles.text}
              placeholder="Password"
              onChangeText={text => setPassword(text)}
              value={password}
              secureTextEntry={true}
              autoCapitalize={'none'}
            />
          </View>

          <View style={[styles.verticallySpaced, styles.mt100, styles.button]}>
            <Button
              title="Sign in"
              disabled={loading}
              onPress={signInWithEmail}
            />
          </View>
          <Text>New here?</Text>
          <View style={[styles.verticallySpaced, styles.button]}>
            <Button
              title="Sign up"
              disabled={loading}
              onPress={() => setRegister(true)}
            />
          </View>
        </View>
      ) : (
        <>
          {!isUpdating ? (
            <View style={styles.container}>
              <Text style={styles.heading}>PicIt Register</Text>
              <View style={[styles.verticallySpaced, styles.mt20]}>
                <TextInput
                  style={styles.text}
                  placeholder="Email"
                  onChangeText={text => setEmail(text)}
                  value={email}
                  autoCapitalize={'none'}
                />
              </View>
              <View style={styles.verticallySpaced}>
                <TextInput
                  style={styles.text}
                  placeholder="Password"
                  onChangeText={text => setPassword(text)}
                  value={password}
                  secureTextEntry={true}
                  autoCapitalize={'none'}
                />
              </View>
              <View style={styles.verticallySpaced}>
                <TextInput
                  style={styles.text}
                  placeholder="Confirm password"
                  onChangeText={text => setPasswordConfirm(text)}
                  value={passwordConfirm}
                  secureTextEntry={true}
                  autoCapitalize={'none'}
                />
              </View>

              <View
                style={[styles.verticallySpaced, styles.mt100, styles.button]}>
                <Button
                  title="Sign up"
                  disabled={loading}
                  onPress={() => signUpWithEmail()}
                />
              </View>
              <Text>Already have an account?</Text>
              <View style={[styles.verticallySpaced, styles.button]}>
                <Button
                  title="Sign in"
                  disabled={loading}
                  onPress={() => setRegister(false)}
                />
              </View>
            </View>
          ) : (
            <UpdateProfile
              user={user}
              username=""
              name=""
              avatarUrl="https://jqgspngcahxhvxmkyuep.supabase.co/storage/v1/object/public/avatars/default-user-icon.jpg"
              website=""
            />
          )}
        </>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch'
  },
  mt100: {
    marginTop: 100
  },
  mt20: {
    marginTop: 20
  },
  text: {
    color: '#000',
    fontSize: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#95e8cb',
    backgroundColor: '#bff2e0',
    borderRadius: 30
  },
  heading: {
    color: '#000',
    fontSize: 35,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40
  },
  button: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 30,
    backgroundColor: '#f0f0f0'
  }
})
