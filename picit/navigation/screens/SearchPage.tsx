import { useState, useEffect } from 'react'
import { View, TextInput, Text, Image, Modal, Button } from 'react-native'
import { supabase } from '../../lib/supabase'
import React from 'react'
import { TouchableOpacity } from 'react-native-gesture-handler'
import AccountPage from './AccountPage'
import { Session } from '@supabase/supabase-js'
import { SCREEN_HEIGHT } from '@gorhom/bottom-sheet'
import { Ionicons } from '@expo/vector-icons'
import SearchUser from '../../components/SearchUser'

function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any | null>(null) // [1]
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    if (searchTerm) {
      fetchUsers(searchTerm)
    } else {
      setUsers([])
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [searchTerm])

  const fetchUsers = async (searchTerm: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
        .limit(10)

      if (error) {
        console.error('Error fetching users:', error.message)
      } else {
        setUsers((data as { name: string; username: string }[]) || [])
      }
    } catch (error) {
      console.error('Unexpected error:', error)
    }
  }

  return (
    <View>
      <TextInput
        value={searchTerm}
        onChangeText={setSearchTerm}
        placeholder="Search users..."
        style={{
          width: '95%',
          padding: 15,
          fontSize: 16,
          marginHorizontal: 10,
          marginVertical: 10,
          borderRadius: 15,
          backgroundColor: '#e8e8e8'
        }}
      />
      {users.map((user, index) => (
        <SearchUser
          key={index}
          user={user}
          setSelectedUser={setSelectedUser}
          index={index}
        />
      ))}
      {selectedUser && selectedUser.id && (
        <Modal>
          <View style={{ position: 'absolute', top: 50, left: 10, zIndex: 10 }}>
            <Ionicons
              name="close"
              size={35}
              onPress={() => setSelectedUser(null)}
            />
          </View>
          <View
            style={{
              alignContent: 'center',
              display: 'flex',
              justifyContent: 'center',
              flex: 1,
              marginVertical: 100
            }}>
            <AccountPage route={{ params: { userId: selectedUser.id } }} />
          </View>
        </Modal>
      )}
    </View>
  )
}

export default SearchPage
