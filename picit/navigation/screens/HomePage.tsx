import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import {
  StyleSheet,
  View,
  Alert,
  Text,
  Image,
  Modal,
  Pressable,
  Dimensions,
  ScrollView,
  RefreshControl
} from 'react-native'
import { Session, User } from '@supabase/supabase-js'
import Post from '../../components/Post'
import React from 'react'
import BottomSheet, {
  BottomSheetScrollView,
  SCREEN_HEIGHT
} from '@gorhom/bottom-sheet'
import Comments from '../../components/Comments'
import Ionicons from '@expo/vector-icons/Ionicons'
import AccountPage from './AccountPage'

function HomePage({ route }: { route: any }) {
  // Change route type to any

  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [website, setWebsite] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [pullImg, setPullImg] = useState<string[]>([])

  const { session, user } = route.params

  const postPush = {
    url: '',
    user_id: '',
    task_name: '',
    task_description: '',
    task_image: '',
    likes_count: 0,
    comments_count: 0
  }

  useEffect(() => {
    if (user) {
      getProfile()
      getImagesFromSupabase()
    }
  }, [user])

  async function getProfile() {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const { data, error, status } = await supabase
        .from('users')
        .select(`username, website, avatar_url, name`)
        .eq('id', session?.user.id)
        .single()
      console.log('data:', data)

      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setUsername(data.username)
        setWebsite(data.website)
        setAvatarUrl(data.avatar_url)
        setName(data.name)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  let files: string[] = []
  const getImagesFromSupabase = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*') // Select all columns from the 'posts' table

      if (postsError) {
        console.error('Error fetching posts:', postsError)
        return []
      }

      const postsWithUserData = await Promise.all(
        postsData.map(async post => {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('username, name, avatar_url') // Select relevant user data
            .eq('id', post.user_id) // Filter by post's user_id
            .single()

          if (userError) {
            console.error('Error fetching user data:', userError)
            return null // Handle potential user data fetch errors
          }

          return { ...post, user: userData } // Combine post and user data
        })
      )

      const filteredPosts = postsWithUserData.filter(Boolean)
      // sort the posts by the newest first
      filteredPosts.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setPullImg(filteredPosts)
    } catch (error) {
      console.error('Error fetching images:', error)
      return []
    }
  }

  const [modalVisible, setModalVisible] = useState(false)
  const [modalImage, setModalImage] = useState<string | null>(null)

  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    getImagesFromSupabase().then(() => setRefreshing(false))
  }, [])

  const bottomSheetRef = useRef<any>(null)
  const [selectedPost, setSelectedPost] = useState<any>(null)

  const openComments = (post: any) => {
    setSelectedPost(post)
    bottomSheetRef.current?.snapToIndex(0)
    console.log('selectedPost:', selectedPost)
    console.log(post.id)
  }

  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [userOpened, setUserOpened] = useState(false)
  const openAccount = (user: any) => {
    if (user) {
      console.log('user:', user.user_id)
      setSelectedUser(user.user_id)
      console.log('selectedUser:', selectedUser)
      console.log(user.id)
      setUserOpened(true)
    } else {
      console.error('No user to open')
    }
  }

  const bottomHandle = () => (
    <View
      style={{
        width: 40,
        height: 5,
        backgroundColor: '#000',
        borderRadius: 2.5,
        alignSelf: 'center',
        margin: 10
      }}></View>
  )

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.imageCont}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {pullImg.length === 0 ? (
          <View style={{ height: SCREEN_HEIGHT }}>
            <Text style={{ textAlign: 'center', fontSize: 25 }}>
              No posts yet
            </Text>
          </View>
        ) : (
          pullImg.map((post, index) => (
            <Post
              post={post}
              key={index}
              openComments={openComments}
              openAccount={openAccount}
            />
          ))
        )}
      </ScrollView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible)
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Image
              source={{ uri: modalImage ?? '' }}
              style={{ width: 300, height: 300 }}
            />
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => setModalVisible(!modalVisible)}>
              <Text style={styles.textStyle}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['50%', '100%']}
        handleComponent={bottomHandle}
        enablePanDownToClose={true}>
        <BottomSheetScrollView
          contentContainerStyle={styles.bottomSheetContent}>
          <Comments post={selectedPost} />
        </BottomSheetScrollView>
      </BottomSheet>

      {userOpened && (
        <Modal>
          <View style={{ position: 'absolute', top: 50, left: 10, zIndex: 10 }}>
            <Ionicons
              name="close"
              size={35}
              onPress={() => setUserOpened(false)}
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
            <AccountPage route={{ params: { userId: selectedUser } }} />
          </View>
        </Modal>
      )}
    </View>
  )
}

export { HomePage }

const screenWidth = Dimensions.get('window').width

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch'
  },
  mt20: {
    marginTop: 20
  },
  imageCont: {
    marginTop: 20,
    flexDirection: 'column',
    justifyContent: 'center'
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2
  },
  buttonClose: {
    backgroundColor: '#2196F3'
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  image: {
    width: screenWidth - 50,
    height: screenWidth - 50,
    alignSelf: 'center',
    borderRadius: 10
  },
  post: {
    width: screenWidth - 50,
    height: screenWidth,
    alignSelf: 'center',
    marginBottom: 100
  },

  bottomSheetContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
})
