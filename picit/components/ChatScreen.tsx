import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  Button,
  StyleSheet,
  Platform,
  Image
} from 'react-native'
import { supabase } from '../lib/supabase' // Replace with your actual path
import { Session } from '@supabase/supabase-js'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '@gorhom/bottom-sheet'
import { KeyboardAvoidingView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { decrypt, encrypt } from './Cypher'

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  timestamp: string
  conversation_id: string
}

function ChatScreen({ route }: { route: any }) {
  const { conversationId } = route.params
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [session, setSession] = useState<Session | null>(null)
  const [recipientId, setRecipientId] = useState<string>('')
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [recipientUsername, setRecipientUsername] = useState('')
  const [recipientAvatarUrl, setRecipientAvatarUrl] = useState('')

  useEffect(() => {
    const fetchSessionAndData = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      setSession(session)
      if (session?.user && conversationId) {
        let temp = await fetchRecipientId(session)
        await fetchMessages()
        await fetchRecipientData(temp)

        const channel = supabase.channel(
          `public:messages:conversation_id=eq.${conversationId}`
        )
        const subscription = channel
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages' },
            (payload: any) => {
              const newMessage = payload.new as Message
              newMessage.content = decrypt(newMessage.content)
              setMessages(prevMessages => [...prevMessages, newMessage])
            }
          )
          .subscribe()

        return () => {
          subscription?.unsubscribe()
        }
      }
    }

    fetchSessionAndData()
  }, [conversationId])

  async function fetchRecipientData(temp: string) {
    if (!temp) {
      console.error('Recipient ID is empty')
      return
    }

    const { data: recipientData, error: recipientError } = await supabase
      .from('users')
      .select()
      .eq('id', temp)
      .single()

    if (recipientError) {
      console.error('Error fetching recipient data:', recipientError)
      return
    }

    if (recipientData) {
      setRecipientUsername(recipientData.username || '')
      setRecipientAvatarUrl(recipientData.avatar_url || '')
    }
  }

  async function fetchRecipientId(session: any) {
    const user = session?.user
    if (!user) {
      return
    }

    const { data: conversationData, error: conversationError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single()

    if (conversationError || !conversationData) {
      console.error(
        'Error fetching conversation data:',
        conversationError || 'Conversation not found'
      )
    }
    const otherUserId =
      conversationData?.user1_id == user.id
        ? conversationData?.user2_id
        : conversationData?.user1_id

    setRecipientId(otherUserId)
    return otherUserId
  }

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
    } else {
      const decryptedMessages = data.map((message: any) => {
        return { ...message, content: decrypt(message.content) }
      })
      setMessages(decryptedMessages as Message[])
    }
    setIsLoadingMessages(false)
  }

  const sendMessage = async (session: any) => {
    if (!newMessage.trim()) return
    try {
      const currentUser = session?.user
      if (!currentUser || !recipientId) {
        console.error('No session or recipient ID found')
        return
      }

      const encryptedMessage = encrypt(newMessage)

      const { error: messageError } = await supabase.from('messages').insert([
        {
          sender_id: currentUser.id,
          recipient_id: recipientId,
          content: encryptedMessage,
          conversation_id: conversationId,
          timestamp: new Date().toISOString()
        }
      ])

      if (messageError) {
        console.error('Error sending message:', messageError)
        return
      }

      await supabase
        .from('conversations')
        .update({
          last_message_content: encryptedMessage,
          last_message_timestamp: new Date().toISOString()
        })
        .eq('id', conversationId)
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  return (
    <View>
      <View
        style={{
          alignItems: 'center',
          paddingVertical: 10,
          backgroundColor: '#f5f5f5'
        }}>
        {recipientAvatarUrl ? (
          <Image
            source={{ uri: recipientAvatarUrl }}
            style={{ height: 50, width: 50, borderRadius: 25 }}
          />
        ) : (
          <Ionicons name="person-circle" size={50} color="#ccc" />
        )}
        <Text>{recipientUsername}</Text>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
        style={{ height: SCREEN_HEIGHT - 300 }}>
        {isLoadingMessages ? (
          <Text>Loading messages...</Text>
        ) : (
          <FlatList
            data={messages}
            style={{ backgroundColor: '#f0f0f0' }}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.message,
                  item.sender_id === session?.user?.id
                    ? styles.sentMessage
                    : styles.receivedMessage
                ]}>
                <Text style={styles.messageText}>{item.content}</Text>
              </View>
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.flatListContent}
          />
        )}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type your message..."
          />
          <Button title="Send" onPress={() => sendMessage(session)} />
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

export default ChatScreen

const styles = StyleSheet.create({
  flatListContent: {
    paddingBottom: 120
  },
  message: {
    padding: 10,
    margin: 5,
    borderRadius: 5,
    backgroundColor: '#DCF8C6'
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#90d3f0'
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF'
  },
  messageText: {
    fontSize: 16
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#f5f5f5'
  },
  input: {
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8
  }
})
