import React, { useEffect, useState } from 'react'
import {
  Image,
  TouchableOpacity,
  ActivityIndicator,
  View,
  Text,
  Modal
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { postStyle } from '../assets/styles/post'
import { supabase } from '../lib/supabase'
import AccountPage from '../navigation/screens/AccountPage'

const icon = require('../assets/public/default-user-icon.jpg')

function Post({
  post,
  openComments,
  openAccount
}: {
  post: any
  openComments: (post: any) => void
  openAccount: (userId: string) => void
}) {
  const { user } = post
  const [isLoading, setIsLoading] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  useEffect(() => {
    const getSessionAndFetchLikeStatus = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession()
        if (session && session.user) {
          setSession(session)

          const { data: likeStatusData } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', session.user.id)

          if (likeStatusData) {
            setIsLiked(likeStatusData?.length > 0)
          }
          const { data: likeCountData, error: likeCountError } = await supabase
            .from('likes')
            .select('id', { count: 'exact' })
            .eq('post_id', post.id)
          if (likeCountData) {
            setLikeCount(likeCountData.length || 0)
          }
          if (likeCountError) throw likeCountError

          const { data: commentCountData, error: commentCountError } =
            await supabase
              .from('comments')
              .select('id', { count: 'exact' })
              .eq('post_id', post.id)
          if (commentCountData) {
            setCommentCount(commentCountData.length || 0)
          }
          if (likeCountError) throw likeCountError
        }
      } catch (error) {
        console.error('Error fetching session and like status:', error)
      }
    }

    getSessionAndFetchLikeStatus()
  }, [post.id])

  const toggleLike = async () => {
    try {
      const newLikeCount = isLiked ? likeCount - 1 : likeCount + 1

      const { data: existingLikes, error: existingLikesError } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', session?.user?.id)

      if (isLiked && (existingLikes?.length ?? 0) > 0) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', session?.user?.id)
      } else if (!isLiked) {
        await supabase
          .from('likes')
          .insert({ post_id: post.id, user_id: session?.user?.id })
      }

      setLikeCount(newLikeCount)
      setIsLiked(!isLiked)

      await supabase
        .from('posts')
        .update({ likes_count: newLikeCount })
        .eq('id', post.id)
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  return (
    <>
      <View style={postStyle.post}>
        <TouchableOpacity onPress={() => openAccount(post)}>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              marginBottom: 15,
              gap: 10,
              alignItems: 'center'
            }}>
            {user.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={{ width: 50, height: 50, borderRadius: 50 }}
              />
            ) : (
              <Image
                source={icon}
                style={{ width: 50, height: 50, borderRadius: 50 }}
              />
            )}
            <Text style={{ fontSize: 18 }}>{user?.name}</Text>
            <Text style={{ fontSize: 12, color: '#5c5c5c' }}>
              @{user?.username}
            </Text>
          </View>
        </TouchableOpacity>
        <View>
          <Text>{post?.task_name}</Text>
          <Text style={{ marginBottom: 10 }}>{post?.task_description}</Text>
        </View>
        <TouchableOpacity>
          <Image
            source={{ uri: post?.task_image }}
            style={postStyle.image}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
          />
          {isLoading && (
            <ActivityIndicator
              size="large"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: [{ translateX: -25 }, { translateY: -25 }]
              }}
              color="#0000ff"
            />
          )}
        </TouchableOpacity>
        <View style={{ display: 'flex', flexDirection: 'row', marginTop: 15 }}>
          <TouchableOpacity style={postStyle.likeButton} onPress={toggleLike}>
            <Ionicons
              name="heart"
              size={24}
              color={isLiked ? '#1f83ed' : 'black'}
            />
            <Text>{likeCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              justifyContent: 'center',
              display: 'flex',
              flexDirection: 'row',
              width: 70,
              alignItems: 'center'
            }}
            onPress={() => openComments(post)}>
            <Ionicons name="chatbubble" size={24} color="black" />
            <Text>{commentCount}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  )
}

export default Post
