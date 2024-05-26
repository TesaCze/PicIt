import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import {
  StyleSheet,
  View,
  Alert,
  Text,
  Modal,
  Dimensions,
  ScrollView,
  RefreshControl
} from 'react-native'
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
  const [pullImg, setPullImg] = useState<string[]>([])

  const { session, user } = route.params

  useEffect(() => {
    if (user) {
      getProfile()
      getImagesFromSupabase()
    }
  }, [user])

  async function getProfile() {
    try {
      if (!session?.user) throw new Error('No user on the session!')

      const { data, error, status } = await supabase
        .from('users')
        .select(`username, website, avatar_url, name`)
        .eq('id', session?.user.id)
        .single()

      if (error && status !== 406) {
        throw error
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    }
  }

  const getImagesFromSupabase = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
      if (postsError) {
        console.error('Error fetching posts:', postsError)
        return []
      }

      const postsWithUserData = await Promise.all(
        postsData.map(async post => {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('username, name, avatar_url')
            .eq('id', post.user_id)
            .single()

          if (userError) {
            console.error('Error fetching user data:', userError)
            return null
          }

          return { ...post, user: userData }
        })
      )

      const filteredPosts = postsWithUserData.filter(Boolean)
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
  }

  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [userOpened, setUserOpened] = useState(false)
  const openAccount = (user: any) => {
    if (user) {
      setSelectedUser(user.user_id)
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
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['50%', '100%']}
        handleComponent={bottomHandle}
        enablePanDownToClose={true}>
        <View style={styles.bottomSheetContent}>
          <Comments post={selectedPost} />
        </View>
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
