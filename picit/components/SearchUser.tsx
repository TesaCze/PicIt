import React from 'react'
import { TouchableOpacity, View, Image, Text } from 'react-native'

export default function SearchUser({
  user,
  index,
  setSelectedUser
}: {
  user: any
  index: number
  setSelectedUser: any
}) {
  return (
    <TouchableOpacity key={index} onPress={() => setSelectedUser(user)}>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
          gap: 10,
          marginVertical: 5,
          marginHorizontal: 10,
          backgroundColor: '#f0f0f0'
        }}>
        <Image
          source={{ uri: user.avatar_url }}
          style={{ width: 50, height: 50, borderRadius: 25 }}
        />
        <Text style={{ fontSize: 16 }}>{user.name}</Text>
        <Text style={{ color: '#9e9e9e' }}>@{user.username}</Text>
      </View>
    </TouchableOpacity>
  )
}
