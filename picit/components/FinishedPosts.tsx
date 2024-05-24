import { Session } from '@supabase/supabase-js'
import React from 'react'
import { useState, useEffect } from 'react'
import { View, Text, Image } from 'react-native'
import { supabase } from '../lib/supabase'
import { ScrollView } from 'react-native-gesture-handler'

interface UserIdProps {
  route: any
}

const FinishedPosts: React.FC<UserIdProps> = ({ route }) => {
  const { user } = route.params
  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    getPosts()
    console.log('id: ', user)
  }, [])

  const getPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
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
                marginVertical: 10
              }}>
              <View style={{ flex: 0.8 }}>
                <Text style={{ fontSize: 18 }}>{post.task_name}</Text>
                <Text>{post.task_description}</Text>
              </View>
              <View>
                <Image
                  source={{ uri: post.task_image }}
                  style={{ width: 150, height: 150, borderRadius: 10 }}
                />
              </View>
            </View>
          )
        )
      )}
    </ScrollView>
  )
}

export default FinishedPosts
