import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  StyleSheet,
  View,
  Alert,
  Button,
  TextInput,
  Switch,
  Text,
  TouchableOpacity
} from 'react-native'
import { Session } from '@supabase/supabase-js'
import DatePicker from '@react-native-community/datetimepicker'
import moment from 'moment'
import React from 'react'
import TaskList from '../../components/TaskList'

export default function CreateTask() {
  const [taskName, setTaskName] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasDeadline, setHasDeadline] = useState(false)
  const [deadline, setDeadline] = useState('')
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  const createTask = async () => {
    setIsSubmitting(true)
    if (taskName.trim() === '' || taskName === null) {
      Alert.alert('Task name cannot be empty')
      setIsSubmitting(false)
      return
    }

    if (taskDescription.trim() === '' || taskDescription === null) {
      Alert.alert('Task description cannot be empty')
      setIsSubmitting(false)
      return
    }

    console.log('Creating task...')
    if (session) {
      const formattedDeadline = moment(deadline).toISOString()
      console.log('Formatted deadline:', formattedDeadline)

      const { data, error } = await supabase.from('tasks').insert([
        {
          user_id: session.user?.id,
          name: taskName,
          description: taskDescription,
          is_completed: false,
          has_deadline: hasDeadline,
          deadline: hasDeadline ? formattedDeadline : null
        }
      ])

      console.log('Data:', data)

      if (error) {
        Alert.alert('Error creating task', error.message)
      }
    } else {
      Alert.alert('Error creating task', 'No session found')
    }
    setIsSubmitting(false)
    setTaskName('')
    setTaskDescription('')
    setHasDeadline(false)
    setDeadline('')
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Task Name"
          value={taskName}
          onChangeText={setTaskName}
        />
      </View>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Task Description"
          value={taskDescription}
          onChangeText={setTaskDescription}
          multiline
        />
      </View>

      <View style={styles.switchContainer}>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={hasDeadline ? '#f5dd4b' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          onValueChange={setHasDeadline}
          value={hasDeadline}
        />
        <Text style={styles.switchLabel}>Has Deadline</Text>
      </View>

      {hasDeadline && (
        <DatePicker
          value={deadline ? new Date(deadline) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            if (selectedDate) {
              try {
                const formattedDate = moment(selectedDate).format('YYYY-MM-DD')
                setDeadline(formattedDate)
              } catch (error) {
                console.error('Error formatting date:', error)
              }
            }
          }}
        />
      )}

      <TouchableOpacity
        style={styles.createButton}
        onPress={createTask}
        disabled={isSubmitting}>
        <Text style={styles.buttonText}>Create Task</Text>
      </TouchableOpacity>

      {session && (
        <>
          <Text style={styles.taskListHeader}>Tasks:</Text>
          <TaskList session={session} />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3
  },
  inputWrapper: {
    marginBottom: 15
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  switchLabel: {
    marginLeft: 10
  },
  datePicker: {
    width: '100%',
    marginBottom: 15
  },
  createButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  taskListHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20
  }
})
