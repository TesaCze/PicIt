import { Session } from '@supabase/supabase-js'
import React from 'react'
import { useState, useEffect } from 'react'
import { View, Text, Image } from 'react-native'
import { supabase } from '../lib/supabase'
import { ScrollView } from 'react-native-gesture-handler'
import moment from 'moment'

function FinishedPosts() {
  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    getPosts()
  }, [])

  const getPosts = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select()
      .eq('is_completed', false) // Fix filtr na splnene
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
    </ScrollView>
  )
}

export default FinishedPosts
