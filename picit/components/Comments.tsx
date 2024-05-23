import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView
} from 'react-native'
import { supabase } from '../lib/supabase'
import { Ionicons } from '@expo/vector-icons'

function Comments({ post }: { post: any }) {
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [session, setSession] = useState<any | null>(null)

  useEffect(() => {
    const fetchSessionAndComments = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession()
        setSession(session)

        if (post?.id) {
          await fetchComments()
        }
      } catch (error) {
        console.error('Error fetching session and comments:', error)
      }
    }

    fetchSessionAndComments()
  }, [post?.id])

  const handleAddComment = async () => {
    if (newComment.trim() === '') return
    try {
      const { error } = await supabase.from('comments').insert({
        post_id: post.id,
        user_id: session?.user?.id,
        text: newComment
      })

      if (error) throw error
      setNewComment('')
      fetchComments()
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, user:user_id(username)')
        .eq('post_id', post.id)

      if (error) throw error
      setComments(data)
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const renderComment = ({ item }: { item: any }) => (
    <View style={styles.commentItem}>
      {item.user ? (
        <>
          <Text style={styles.commentUser}>{item.user.username}:</Text>
          <Text>{item.text || 'No comment text'}</Text>
        </>
      ) : (
        <Text>Comment from deleted user</Text>
      )}
    </View>
  )

  return (
    <View style={styles.outerContainer}>
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.flatListContent}
        ListHeaderComponent={<Text style={styles.commentHeader}>Comments</Text>}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          value={newComment}
          onChangeText={setNewComment}
          multiline={true}
        />

        <TouchableOpacity onPress={handleAddComment}>
          <Ionicons name={'send'} size={25} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default Comments

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    height: '100%'
  },
  flatListContent: {
    flexGrow: 1,
    paddingBottom: 60 // Adjust to accommodate the input area
  },
  commentHeader: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 'bold'
  },
  commentItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  commentUser: {
    fontWeight: 'bold',
    marginBottom: 5
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    position: 'absolute', // Position at the bottom
    bottom: 0,
    left: 0,
    right: 0
  },
  commentInput: {
    flex: 1,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: '#f0f0f0'
  },
  commentSubmitButton: {
    padding: 10,
    backgroundColor: '#0095f6', // Instagram blue
    color: '#fff',
    borderRadius: 20
  }
})
