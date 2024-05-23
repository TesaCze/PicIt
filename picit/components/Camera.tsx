import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Image } from 'react-native'
import { Camera, CameraView } from 'expo-camera'
import { Ionicons } from '@expo/vector-icons'

interface CameraCompProps {
  onPictureTaken: (uri: string) => void
}

const CameraComp: React.FC<CameraCompProps> = ({ onPictureTaken }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const cameraViewRef = useRef<CameraView | null>(null)

  useEffect(() => {
    ;(async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === 'granted')
    })()
  }, [])

  const takePhoto = async () => {
    if (cameraViewRef.current) {
      const photo = await cameraViewRef.current.takePictureAsync()
      if (photo) {
        setPhotoUri(photo.uri)
        onPictureTaken(photo.uri)
      }
    }
  }

  const [camDirection, setCamDirection] = useState<'front' | 'back'>('back')
  const flipCamera = () => {
    setCamDirection(prev => (prev === 'back' ? 'front' : 'back'))
  }

  const [torch, setTorch] = useState<false | true>(false)
  const toggleTorch = () => {
    setTorch(prev => (prev === true ? false : true))
  }

  if (hasPermission === null) {
    return <Text>Requesting Camera Permissions...</Text>
  }

  if (hasPermission === false) {
    return <Text>No access to camera</Text>
  }

  return (
    <>
      <View style={{ flex: 1 }}>
        <CameraView
          style={{ flex: 1 }}
          ref={cameraViewRef}
          autofocus={'on'}
          facing={camDirection}
          enableTorch={torch}>
          {camDirection === 'back' && (
            <TouchableOpacity
              style={{
                flex: 1,
                alignSelf: 'center',
                marginTop: 50,
                alignItems: 'center'
              }}
              onPress={toggleTorch}>
              {torch ? (
                <Ionicons name="flash" size={35} color="white" />
              ) : (
                <Ionicons name="flash-off" size={35} color="white" />
              )}
            </TouchableOpacity>
          )}
          <View
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              flexDirection: 'row',
              justifyContent: 'center',
              marginBottom: 30
            }}>
            <View
              style={{
                flex: 1,
                alignSelf: 'flex-end',
                alignItems: 'center'
              }}>
              <TouchableOpacity
                onPress={takePhoto}
                style={{ borderRadius: 50 }}>
                <Ionicons name="radio-button-off" size={100} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={{
              flex: 1,
              alignSelf: 'flex-end',
              alignItems: 'center',
              position: 'absolute',
              bottom: 50,
              right: 50
            }}
            onPress={flipCamera}>
            <Ionicons name="camera-reverse" size={35} color="white" />
          </TouchableOpacity>
        </CameraView>
        {photoUri && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0
            }}>
            <Image source={{ uri: photoUri }} style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={() => setPhotoUri(null)}
              style={{
                position: 'absolute',
                justifyContent: 'flex-end',
                top: 35,
                right: 35
              }}>
              <Ionicons name="close" size={35} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  )
}

export default CameraComp
