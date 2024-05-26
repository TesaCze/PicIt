import { useEffect, useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Image,
  Button,
  Modal,
  TouchableOpacity
} from 'react-native'
import { supabase } from '../lib/supabase'
import React from 'react'
import UpdateProfile from './UpdateProfile'
import { Ionicons } from '@expo/vector-icons'
import ChatScreen from './ChatScreen'

const icon = require('../assets/public/default-user-icon.jpg')

interface UserProfileProps {
  user: any
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [website, setWebsite] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [name, setName] = useState('')
  const [hasRegistered, setHasRegistered] = useState(false)
  const [taskCount, setTaskCount] = useState(0)
  const [completedTask, setCompletedTask] = useState(0)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isEditing, setIsEditing] = useState(false)

  const [sessionUser, setSessionUser] = useState<string>('')
  const [isFollowing, setIsFollowing] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [conversationId, setConversationId] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const userId = session?.user.id || ''
      setSessionUser(userId)

      if (userId) {
        checkFollowing(userId)
        getUserFollowing(userId)
      }
    })
  }, [user.id])

  const checkFollowing = async (userId: string) => {
    let { data: followingData, error } = await supabase
      .from('following')
      .select('followed_accounts')
      .eq('user_id', sessionUser)
      .single()

    setIsFollowing(followingData?.followed_accounts.includes(user.id))
  }

  const getUser = async (userId: any) => {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)

    if (error) {
      throw error
    }

    return users[0]
  }

  const getUserFollowing = async (userId: any) => {
    const { data: userFollowing, error } = await supabase
      .from('following')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      throw error
    }
    if (userFollowing.length === 0) {
      setFollowingCount(0)
      setFollowerCount(0)
    } else {
      setFollowerCount(userFollowing[0].follower_count)
      setFollowingCount(userFollowing[0].following_count)
    }

    return userFollowing
  }

  const followUser = async (userIdToFollow: string, sessionUser: string) => {
    if (
      (await supabase
        .from('following')
        .select()
        .eq('user_id', sessionUser)
        .single()) !== null
    ) {
      await supabase.from('following').insert([{ user_id: sessionUser }])
    }

    setIsFollowing(true)
    try {
      const { data: userData, error: userError } = await supabase
        .from('following')
        .select()
        .eq('user_id', sessionUser)
        .single()

      if (userError) {
        throw userError
      }

      const followedAccounts = userData?.followed_accounts || []
      const followingAccounts = userData?.following_accounts || []
      followedAccounts.push(userIdToFollow)
      followingAccounts.push(sessionUser)

      await supabase
        .from('following')
        .update({ followed_accounts: followedAccounts })
        .eq('user_id', sessionUser)

      await supabase
        .from('following')
        .update({ following_accounts: followingAccounts })
        .eq('user_id', userIdToFollow)

      const { data: followingData, error: followingError } = await supabase
        .from('following')
        .select('following_count')
        .eq('user_id', sessionUser)
        .single()

      const currentFollowingCount = followingData?.following_count || 0

      await supabase
        .from('following')
        .update({ following_count: currentFollowingCount + 1 })
        .eq('user_id', sessionUser)

      const { data: followedData, error: followedError } = await supabase
        .from('following')
        .select('following_count')
        .eq('user_id', userIdToFollow)
        .single()

      const currentFollowedCount = followedData?.following_count || 0

      await supabase
        .from('following')
        .update({ follower_count: currentFollowedCount + 1 })
        .eq('user_id', userIdToFollow)

      fetchData()
      getUserFollowing(user.id)
    } catch (error) {
      console.error('Error following user:', error)
    }
  }

  const unfollowUser = async (userIdToFollow: string, sessionUser: string) => {
    setIsFollowing(false)
    try {
      const { data: userData, error: userError } = await supabase
        .from('following')
        .select()
        .eq('user_id', sessionUser)
        .single()

      if (userError) {
        throw userError
      }

      const followedAccounts = userData?.followed_accounts || []
      const followingAccounts = userData?.following_accounts || []
      followedAccounts.splice(followedAccounts.indexOf(userIdToFollow), 1)
      followingAccounts.splice(followedAccounts.indexOf(sessionUser), 1)

      await supabase
        .from('following')
        .update({ followed_accounts: followedAccounts })
        .eq('user_id', sessionUser)

      await supabase
        .from('following')
        .update({ following_accounts: followingAccounts })
        .eq('user_id', userIdToFollow)

      const { data: followingData, error: followingError } = await supabase
        .from('following')
        .select('following_count')
        .eq('user_id', sessionUser)
        .single()

      const currentFollowingCount = followingData?.following_count || 0

      await supabase
        .from('following')
        .update({ following_count: currentFollowingCount - 1 })
        .eq('user_id', sessionUser)

      const { data: followedData, error: followedError } = await supabase
        .from('following')
        .select('follower_count')
        .eq('user_id', userIdToFollow)
        .single()

      const currentFollowedCount = followedData?.follower_count || 0

      await supabase
        .from('following')
        .update({ follower_count: currentFollowedCount - 1 })
        .eq('user_id', userIdToFollow)

      fetchData()
      getUserFollowing(user.id)
    } catch (error) {
      console.error('Error unfollowing user:', error)
    }
  }

  const message = async () => {
    try {
      const currentUser = sessionUser
      if (!currentUser) return
      const { data: conversations, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .or(`user1_id.eq.${currentUser},user2_id.eq.${currentUser}`)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .single()

      if (conversations) {
        setConversationId(conversations.id)
        setShowModal(true)
      } else {
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert([{ user1_id: currentUser, user2_id: user.id }])
          .single()

        if (createError) {
          console.error('Error creating conversation:', createError)
        } else {
          console.log('new conversation:', newConversation)
        }
        if (newConversation) {
          setConversationId(newConversation)
          setShowModal(true)
        }
      }
    } catch (error) {
      console.error('Unexpected error in message function:', error)
    }
  }

  const fetchData = async () => {
    try {
      if (user) {
        const { data: users, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)

        if (error) throw error
        setUsername(user.username)
        setName(user.name)
        setWebsite(user.website)
        setCompletedTask(user.completed_task)
        setFollowerCount(user.follower_count)
        setFollowingCount(user.following_count)

        const { data: tasks, error: taskError } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', user.id)

        if (taskError) throw taskError
        setTaskCount(tasks?.length || 0)
      }
    } catch (error) {
      console.error('Error getting user:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    getUser(user.id)
    getUserFollowing(user.id)
  }, [user])

  return (
    <View style={styles.containerStyle}>
      <Modal visible={showModal} animationType="slide">
        <View style={{ marginTop: 50 }}>
          <View
            style={{
              position: 'absolute',
              top: 30,
              left: 10,
              zIndex: 10
            }}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
          </View>
          <ChatScreen route={{ params: { conversationId: conversationId } }} />
        </View>
      </Modal>
      <View
        style={{
          width: '100%',
          justifyContent: 'space-between',
          flexDirection: 'row',
          alignItems: 'center'
        }}>
        <View style={styles.profilePictureSectionStyle}>
          {user.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={styles.imageStyle}
            />
          ) : (
            <View style={styles.placeholderImageStyle}>
              <Image source={icon} style={styles.imageStyle} />
            </View>
          )}
        </View>
        <View
          style={{
            flex: 0.95,
            justifyContent: 'space-evenly',
            flexDirection: 'row',
            alignItems: 'center'
          }}>
          <View>
            <Text style={{ textAlign: 'center', fontSize: 14 }}>Followers</Text>
            <Text style={{ textAlign: 'center', fontSize: 18 }}>
              {followerCount}
            </Text>
          </View>
          <View style={{}}>
            <Text style={{ textAlign: 'center', fontSize: 14 }}>Following</Text>
            <Text style={{ textAlign: 'center', fontSize: 18 }}>
              {followingCount}
            </Text>
          </View>
          <View style={{}}>
            <Text style={{ textAlign: 'center', fontSize: 14 }}>
              Finished tasks
            </Text>
            <Text style={{ textAlign: 'center', fontSize: 18 }}>
              {taskCount}
            </Text>
          </View>
        </View>
      </View>
      <View
        style={{
          width: '100%',
          paddingVertical: 20
        }}>
        <View>
          <Text style={{ fontSize: 18 }}>{name}</Text>
        </View>
        <View>
          <Text style={{ fontSize: 16, color: '#6c757d' }}>@{username}</Text>
        </View>
        <View>
          <Text style={{ fontSize: 16 }}>{website}</Text>
        </View>
      </View>
      <View
        style={{
          width: '100%',
          paddingVertical: 20
        }}>
        {user.id == sessionUser && (
          <Button title="Edit profile" onPress={() => setIsEditing(true)} />
        )}
        {user.id != sessionUser && (
          <>
            {isFollowing ? (
              <View>
                <Button
                  title="Unfollow"
                  onPress={() => {
                    unfollowUser(user.id, sessionUser)
                  }}
                />
              </View>
            ) : (
              <View>
                <Button
                  title="Follow"
                  onPress={() => {
                    followUser(user.id, sessionUser)
                  }}
                />
              </View>
            )}
            <Button title="Message" onPress={() => message()} />
          </>
        )}
      </View>
      {isEditing && (
        <Modal>
          <View style={{ position: 'absolute', top: 50, left: 10, zIndex: 10 }}>
            <Ionicons
              name="close"
              size={35}
              onPress={() => setIsEditing(false)}
            />
          </View>
          <View
            style={{
              display: 'flex',
              flex: 1
            }}>
            <UpdateProfile
              user={user}
              username={username}
              name={name}
              website={website}
              avatarUrl={''}
              onRegistrationComplete={() => null}
            />
          </View>
        </Modal>
      )}
    </View>
  )
}

export default UserProfile

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    textDecorationColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 500,
    margin: 10
  },
  text: {
    color: '#000',
    fontSize: 30
  },
  button: {
    color: '#fff',
    fontSize: 30
  },
  div: {
    flexDirection: 'row',
    gap: 20
  },
  containerStyle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5
  },
  headingStyle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  profilePictureSectionStyle: {
    width: 90,
    height: 90,
    borderRadius: 60,
    overflow: 'hidden',
    borderColor: '#ddd',
    borderWidth: 1,
    display: 'flex'
  },
  imageStyle: {
    width: '100%',
    height: '100%'
  },
  placeholderImageStyle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  placeholderTextStyle: {
    color: '#aaa'
  },
  userIdStyle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10
  },
  inputStyle: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5
  },
  buttonContainerStyle: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20
  },
  buttonStyle: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#007bff',
    color: '#fff'
  }
})
