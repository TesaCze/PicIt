import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  RefreshControl
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { TouchableOpacity } from 'react-native-gesture-handler'
import ChatScreen from '../../components/ChatScreen'
import { Ionicons } from '@expo/vector-icons'
import { styles } from '../../assets/styles/styles'
import SearchPage from './SearchPage'
import { Moment } from 'moment'
import moment from 'moment'
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry'

interface Conversation {
  id: string
  last_message_content: string
  last_message_timestamp: string
  user1_id: string
  user2_id: string
}

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  timestamp: string // Use the appropriate type from your database
  conversation_id: string
}

export default function ChatApp() {
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [session, setSession] = useState<any | null>(null)
  const [diffUserUsername, setDiffUserUsername] = useState<string | ''>('')
  const [diffUserAvatarUrl, setDiffUserAvatarUrl] = useState<string | ''>('')

  const [isLoading, setIsLoading] = useState(true)
  const [otherUserData, setOtherUserData] = useState<any>(null) // Store data of the other user

  useEffect(() => {
    fetchSessionAndConversations()
  }, [])

  const fetchSessionAndConversations = async () => {
    setIsLoading(true)
    const {
      data: { session }
    } = await supabase.auth.getSession()
    setSession(session)

    try {
      const { data, error } = await supabase.from('conversations').select()
      if (error) throw error

      if (data.length > 0) {
        const conversation = data[0]
        const otherUserId =
          conversation.user1_id === session?.user.id
            ? conversation.user2_id
            : conversation.user1_id
        if (!otherUserId) throw new Error('Other user ID is missing.')

        const userData = await getUserData(otherUserId)
        setOtherUserData(userData)
      }

      setConversations(data)
    } catch (error) {
      console.error('Error fetching conversations or user data:', error)
      // Consider displaying an error message to the user
    } finally {
      setIsLoading(false)
    }
  }

  const handleConversationPress = (conversationId: string) => {
    setActiveConversationId(conversationId)
  }

  const getUserData = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('id', userId)
      .single()
    setDiffUserAvatarUrl(data?.avatar_url)
    setDiffUserUsername(data?.username)

    if (error) {
      console.error('Error fetching user data:', error)
    } else {
      return data
    }
  }

  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    fetchSessionAndConversations().then(() => setRefreshing(false))
  }, [])

  return (
    <View>
      {activeConversationId ? (
        <>
          <View
            style={{
              position: 'absolute',
              top: 30,
              left: 10,
              zIndex: 10
            }}>
            <TouchableOpacity onPress={() => setActiveConversationId(null)}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
          </View>
          <ChatScreen
            route={{ params: { conversationId: activeConversationId } }}
          />
        </>
      ) : (
        <ScrollView
          contentContainerStyle={{
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 10
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <FlatList
            data={conversations}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleConversationPress(item.id)}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 15,
                    marginVertical: 10,
                    marginHorizontal: 20,
                    flex: 0.8,
                    width: '90%'
                  }}>
                  <Image
                    source={{ uri: diffUserAvatarUrl }}
                    style={{ width: 65, height: 65, borderRadius: 50 }}
                  />
                  <View>
                    <Text style={{ fontSize: 20 }}>
                      {diffUserUsername || ''}
                    </Text>
                    <Text>{item.last_message_content || 'nefakaaaa'}</Text>
                  </View>
                  <Text style={{ marginLeft: 100 }}>
                    {moment(item.last_message_timestamp).format(
                      'h:mm a, MMMM D'
                    )}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={item => item.id}
          />
        </ScrollView>
      )}
    </View>
  )
}
