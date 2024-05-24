import moment from 'moment'
import React, { useEffect, useState } from 'react'
import {
  View,
  Button,
  Alert,
  Text,
  RefreshControl,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity
} from 'react-native'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'
import { ScrollView } from 'react-native-gesture-handler'
import { decode } from 'base64-arraybuffer'
import * as FileSystem from 'expo-file-system'
import { useFocusEffect } from '@react-navigation/native'
import {
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  WINDOW_HEIGHT,
  WINDOW_WIDTH
} from '@gorhom/bottom-sheet'

import CameraComp from '../components/Camera'
import { Ionicons } from '@expo/vector-icons'

export default function TaskList({ session }: { session: Session }) {
  const [tasks, setTasks] = useState<any[] | null>(null)

  const screenWidth = Dimensions.get('window').width
  const screenHeight = Dimensions.get('window').height

  useEffect(() => {
    if (session) {
      getTasks()
      getProfile()
    }
  }, [session])

  const [username, setUsername] = useState('')

  async function getProfile() {
    try {
      if (!session?.user) throw new Error('No user on the session!')

      const { data, error, status } = await supabase
        .from('users')
        .select(`username`)
        .eq('id', session?.user.id)
        .single()
      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setUsername(data.username)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    }
  }

  const getTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session?.user.id)
        .eq('is_completed', false)
      console.log('Data:', data)
      setTasks(data)
      if (error) {
        throw error
      }
      if (data) {
        console.log('Tasks:', data)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    }
  }

  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [postCanceled, setPostCanceled] = useState(false)

  const [taskImage, setTaskImage] = useState('')

  const uploadImage = async ({ fileName }: { fileName: string }) => {
    if (!taskImage) return

    const base64 = await FileSystem.readAsStringAsync(taskImage, {
      encoding: FileSystem.EncodingType.Base64
    })
    if (base64) {
      try {
        const { error } = await supabase.storage
          .from('posts')
          .upload(fileName, decode(base64), {
            contentType: 'image/jpeg',
            upsert: true
          })

        if (error) {
          console.error('Error uploading image:', error)
          setPostCanceled(true)
        }
      } catch (error) {
        console.error('Error uploading image:', error)
        setPostCanceled(true)
      }
    } else {
      console.error('Error reading image data')
      setPostCanceled(true)
    }
  }

  const [taskToFinish, setTaskToFinish] = useState<any>(null)

  const finishTask = (task: { name: any; description: any }) => {
    setTaskToFinish(task)
    setIsCameraOpen(true)
  }

  useFocusEffect(
    React.useCallback(() => {
      const finishPendingTask = async () => {
        if (!taskImage) {
          setIsCameraOpen(false)
          return
        }

        try {
          const randomName = Math.random().toString(36).substring(7)
          const fileName = `${username}/${randomName}`
          await uploadImage({ fileName })

          const result = await supabase.storage
            .from('posts')
            .getPublicUrl(fileName)

          const newPost = {
            user_id: session.user.id,
            comment_count: 0,
            task_name: taskToFinish.name,
            likes_count: 0,
            task_image: result.data.publicUrl,
            task_description: taskToFinish.description,
            created_at: new Date()
          }

          const { data } = await supabase
            .from('tasks')
            .update({ is_completed: true })
            .eq('id', taskToFinish.id)
          console.log('Task completed:', data)

          const { error } = await supabase.from('posts').insert([newPost])
          if (error) {
            console.error('Error inserting post:', error)
          } else {
            console.log('Post inserted successfully')
          }
        } catch (error) {
          console.error('Error in finishPendingTask:', error)
        } finally {
          setTaskImage('')
          setIsCameraOpen(false)
        }
      }

      if (isCameraOpen && taskImage) {
        finishPendingTask()
      }
    }, [isCameraOpen, postCanceled, taskImage])
  )

  const deleteTask = async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
      if (error) {
        throw error
      }
      if (data) {
        console.log('Task deleted:', data)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    }
    getTasks()
  }

  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    getTasks().then(() => setRefreshing(false))
    console.log(tasks)
  }, [])

  return (
    <View>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {tasks &&
          tasks.map((task, index) => (
            <View
              key={index}
              style={[
                styles.taskItem,
                {
                  backgroundColor: moment(task.deadline).isBefore(moment())
                    ? '#f56e6e'
                    : '#fff'
                }
              ]}>
              <View style={styles.taskInfo}>
                <Text style={styles.taskName}>{task.name}</Text>
                <Text
                  style={[
                    styles.taskDescription,
                    {
                      color: moment(task.deadline).isBefore(moment())
                        ? '#fff'
                        : '#555'
                    }
                  ]}>
                  {task.description}
                </Text>
                {task.has_deadline && (
                  <Text
                    style={[
                      styles.taskDeadline,
                      {
                        color: moment(task.deadline).isBefore(moment())
                          ? '#dbd9d9'
                          : '#888'
                      }
                    ]}>
                    Deadline: {moment(task.deadline).fromNow()}
                  </Text>
                )}
              </View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.buttonIcon}
                  onPress={() => deleteTask(task.id)}>
                  <Ionicons name="trash-outline" size={24} color="red" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.buttonIcon}
                  onPress={() => {
                    finishTask(task)
                    setPostCanceled(true)
                  }}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={24}
                    color="green"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
      </ScrollView>
      <Modal
        style={{ width: screenWidth, height: screenHeight, flex: 1 }}
        animationType="slide"
        transparent={false}
        visible={isCameraOpen}
        onRequestClose={() => {
          setIsCameraOpen(false)
          setPostCanceled(true)
        }}>
        <View style={modalStyles.modalContainer}>
          <CameraComp
            onPictureTaken={uri => {
              console.log('Picture taken:', uri)
              setTaskImage(uri)
            }}
          />
          <Pressable
            style={modalStyles.closeButton}
            onPress={() => setIsCameraOpen(false)}>
            <Ionicons name="close" size={40} color="white" />
          </Pressable>
        </View>
      </Modal>
    </View>
  )
}

const modalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    aspectRatio: SCREEN_WIDTH / SCREEN_HEIGHT
  },
  closeButton: {
    position: 'absolute',
    bottom: 50,
    left: 50
  }
})

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    marginBottom: 100
  },
  taskItem: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2
  },
  taskInfo: {
    flex: 1,
    marginRight: 10
  },
  taskName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5
  },
  taskDescription: {
    fontSize: 14
  },
  taskDeadline: {
    fontSize: 12
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10
  },
  buttonIcon: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 5
  }
})
