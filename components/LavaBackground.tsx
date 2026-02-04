import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function LavaBackground() {
  const blob1 = useRef(new Animated.Value(0)).current;
  const blob2 = useRef(new Animated.Value(0)).current;
  const blob3 = useRef(new Animated.Value(0)).current;
  const blob4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(blob1, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(blob1, {
            toValue: 0,
            duration: 8000,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(blob2, {
            toValue: 1,
            duration: 10000,
            useNativeDriver: true,
          }),
          Animated.timing(blob2, {
            toValue: 0,
            duration: 10000,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(blob3, {
            toValue: 1,
            duration: 12000,
            useNativeDriver: true,
          }),
          Animated.timing(blob3, {
            toValue: 0,
            duration: 12000,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(blob4, {
            toValue: 1,
            duration: 9000,
            useNativeDriver: true,
          }),
          Animated.timing(blob4, {
            toValue: 0,
            duration: 9000,
            useNativeDriver: true,
          }),
        ])
      ),
    ];

    animations.forEach(anim => anim.start());

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, [blob1, blob2, blob3, blob4]);

  const blob1TranslateY = blob1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -150],
  });

  const blob1TranslateX = blob1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 50],
  });

  const blob2TranslateY = blob2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180],
  });

  const blob2TranslateX = blob2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -60],
  });

  const blob3TranslateY = blob3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -120],
  });

  const blob3TranslateX = blob3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });

  const blob4TranslateY = blob4.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 160],
  });

  const blob4TranslateX = blob4.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 70],
  });

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Animated.View
        style={[
          styles.blob,
          {
            top: -100,
            left: -100,
            transform: [
              { translateY: blob1TranslateY },
              { translateX: blob1TranslateX },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(135, 206, 250, 0.3)', 'rgba(135, 206, 250, 0.1)']}
          style={styles.blobGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.blob,
          {
            top: height * 0.3,
            right: -120,
            transform: [
              { translateY: blob2TranslateY },
              { translateX: blob2TranslateX },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(135, 206, 250, 0.25)', 'rgba(135, 206, 250, 0.08)']}
          style={styles.blobGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.blob,
          {
            bottom: -80,
            left: -80,
            transform: [
              { translateY: blob3TranslateY },
              { translateX: blob3TranslateX },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(135, 206, 250, 0.28)', 'rgba(135, 206, 250, 0.1)']}
          style={styles.blobGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.blob,
          {
            bottom: height * 0.25,
            right: -90,
            transform: [
              { translateY: blob4TranslateY },
              { translateX: blob4TranslateX },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(135, 206, 250, 0.32)', 'rgba(135, 206, 250, 0.12)']}
          style={styles.blobGradient}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute' as const,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  blobGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 150,
  },
});
