import { UVCCamera } from '@prasiddha-n/react-native-uvc-camera';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

export default function VideoFeed() {
  const cameraRef = useRef<UVCCamera>(null);

  useEffect(() => {
    cameraRef.current?.openCamera();
    return () => { cameraRef.current?.closeCamera(); };
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      <UVCCamera ref={cameraRef} style={StyleSheet.absoluteFill} />
    </View>
  );
}