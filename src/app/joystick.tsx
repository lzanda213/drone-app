import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import dgram from 'react-native-udp';

import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function JoystickControls() {
  const [armed, setArmed] = useState(false);
  const [inputs, setInputs] = useState({
    thrust: 0,
    yaw: 127,
    pitch: 127,
    roll: 127,
  });

  const socket = useRef<any>(null);

  const YAW_TRAVEL = 92.5;
  const THROTTLE_TRAVEL = SCREEN_HEIGHT / 2;

  const leftX = useSharedValue(0);
  const leftY = useSharedValue(0);
  const leftBaseY = useSharedValue(0);

  const rightX = useSharedValue(0);
  const rightY = useSharedValue(0);

  useEffect(() => {
    socket.current = dgram.createSocket({ type: 'udp4' });
    socket.current?.bind(0);

    const interval = setInterval(() => {
      const thrustRaw = ((-leftY.value) / THROTTLE_TRAVEL) * 1000;

      const currentInputs = {
        thrust: Math.round(thrustRaw),
        yaw: Math.round((leftX.value / YAW_TRAVEL) * 500 + 500),
        pitch: Math.round((-rightY.value / YAW_TRAVEL) * 500 + 500),
        roll: Math.round((rightX.value / YAW_TRAVEL) * 500 + 500),
      };

      const clamped = {
        thrust: Math.max(0, Math.min(1000, currentInputs.thrust)),
        yaw: Math.max(0, Math.min(1000, currentInputs.yaw)),
        pitch: Math.max(0, Math.min(1000, currentInputs.pitch)),
        roll: Math.max(0, Math.min(1000, currentInputs.roll)),
      };

      setInputs(clamped);

      socket.current?.send(
        JSON.stringify({ ...clamped, armed }),
        undefined,
        undefined,
        4210,
        '192.168.4.1'
      );
    }, 20);

    return () => {
      clearInterval(interval);
      socket.current?.close();
    };
  }, [armed]);

  const leftGesture = Gesture.Pan()
    .onBegin(() => {
      leftBaseY.value = leftY.value;
    })
    .onUpdate((e) => {
      let x = e.translationX;
      let y = leftBaseY.value + e.translationY;

      x = Math.max(-YAW_TRAVEL, Math.min(YAW_TRAVEL, x));
      y = Math.max(-THROTTLE_TRAVEL, Math.min(0, y));

      leftX.value = x;
      leftY.value = y;
    })
    .onEnd(() => {
      leftX.value = withTiming(0, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      });

    });

  const rightGesture = Gesture.Pan()
    .onUpdate((e) => {
      let x = e.translationX;
      let y = e.translationY;

      const dist = Math.sqrt(x * x + y * y);

      if (dist > YAW_TRAVEL) {
        const angle = Math.atan2(y, x);
        x = YAW_TRAVEL * Math.cos(angle);
        y = YAW_TRAVEL * Math.sin(angle);
      }

      rightX.value = x;
      rightY.value = y;
    })
    .onEnd(() => {
      rightX.value = withTiming(0, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      });

      rightY.value = withTiming(0, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      });
    });

  const leftStickStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: leftX.value },
      { translateY: leftY.value },
    ],
  }));

  const rightStickStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: rightX.value },
      { translateY: rightY.value },
    ],
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.debugBox}>
          <Text style={styles.debugText}>
            T:{inputs.thrust} Y:{inputs.yaw} P:{inputs.pitch} R:{inputs.roll}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.armBtn,
            { backgroundColor: armed ? '#FF4444' : '#44BB44' },
          ]}
          onPress={() => setArmed(!armed)}
        >
          <Text style={styles.btnText}>{armed ? 'Disarm' : 'Arm'}</Text>
        </TouchableOpacity>

        <View style={styles.controlsRow}>
          <GestureDetector gesture={leftGesture}>
            <View style={[styles.joystickBase, styles.joystickBaseLeft]}>
              <Animated.View
                style={[styles.joystickStick, leftStickStyle]}
              />
            </View>
          </GestureDetector>

          <GestureDetector gesture={rightGesture}>
            <View style={styles.joystickBase}>
              <Animated.View
                style={[styles.joystickStick, rightStickStyle]}
              />
            </View>
          </GestureDetector>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    padding: 20,
  },
  debugBox: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 100,
  },
  debugText: {
    color: '#0f0',
    fontFamily: 'monospace',
  },
  armBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  controlsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  joystickBase: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joystickBaseLeft: {
    height: (SCREEN_HEIGHT / 4) * 2 + 70,
    justifyContent: 'flex-end',
  },
  joystickStick: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007AFF',
    position: 'absolute',
  },
});