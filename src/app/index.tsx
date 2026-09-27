import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import JoystickControls from './joystick';
import VideoFeed from './video';

export default function HomeScreen() {
  const lastSent = useRef(0);

  const handleCommand = (cmd: any) => {
    const now = Date.now();
    if (now - lastSent.current > 50) {
      fetch('http://192.168.4.1/cmd', {
        method: 'POST',
        body: JSON.stringify(cmd),
        headers: { 'Content-Type': 'application/json' },
      }).catch(err => console.error(err));
      lastSent.current = now;
    }
  };

  return (
    <View style={styles.container}>
      {}
      <View style={StyleSheet.absoluteFill}>
        <VideoFeed />
      </View>
      
      {}
      <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]}>
        <JoystickControls onCommand={handleCommand} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' }
});