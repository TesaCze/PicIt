import 'react-native-url-polyfill/auto'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Session } from '@supabase/supabase-js'

import Auth from './components/Auth'
import MainContainer from './navigation/MainContainer'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import React from 'react'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)

  const fetchUser = async () => {
    if (session) {
      const { data: user, error } = await supabase
        .from('users')
        .select('reg_complete')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Error fetching user:', error)
      } else if (user) {
        setIsRegistered(user.reg_complete)
      }
    }
  }
  fetchUser()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  const handleRegComplete = async () => {
    setIsRegistered(true)
  }

  return (
    <>
      {session && session.user && isRegistered && isRegistered != null ? (
        <GestureHandlerRootView style={{ flex: 1 }}>
          <MainContainer session={session} key={session.user.id} />
        </GestureHandlerRootView>
      ) : (
        <Auth onRegistrationComplete={handleRegComplete} />
      )}
    </>
  )
}
