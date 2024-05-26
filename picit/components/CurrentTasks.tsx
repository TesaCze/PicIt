import React from 'react'
import { useState, useEffect } from 'react'
import { View, Text } from 'react-native'
import { supabase } from '../lib/supabase'
import { ScrollView } from 'react-native-gesture-handler'
import moment from 'moment'

interface UserIdProps {
  route: any
}

const CurrentTasks: React.FC<UserIdProps> = ({ route }) => {
  const { user } = route.params
  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    getPosts()
  }, [])

  const getPosts = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select()
      .eq('is_completed', false)
      .eq('user_id', user)
    if (error) {
      throw error
    }
    setPosts(data)
  }

  useEffect(() => {
    console.log(posts)
  }, [posts])

  return (
    <ScrollView>
      {posts.length === 0 ? (
        <Text
          style={{
            fontSize: 22,
            textAlign: 'center',
            marginVertical: 50
          }}>
          No current tasks :(
        </Text>
      ) : (
        <>
          {posts.map(
            (post, index) => (
              console.log(post),
              (
                <View
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    width: '90%',
                    margin: 'auto',
                    marginVertical: 10,
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: moment(post.deadline).isBefore(moment())
                      ? '#f56e6e'
                      : 'transparent'
                  }}>
                  <View style={{ flex: 0.8 }}>
                    <Text style={{ fontSize: 18 }}>{post.name}</Text>
                    <Text>{post.description}</Text>
                  </View>
                  {post.deadline && (
                    <View>
                      <Text>{moment(post.deadline).fromNow()}</Text>
                    </View>
                  )}
                </View>
              )
            )
          )}
        </>
      )}
    </ScrollView>
  )
}

export default CurrentTasks
