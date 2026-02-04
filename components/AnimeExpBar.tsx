import { View, Text, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

interface AnimeExpBarProps {
  currentExp: number;
  expToNextLevel: number;
  currentLevel: number;
}

export default function AnimeExpBar({
  currentExp,
  expToNextLevel,
  currentLevel,
}: AnimeExpBarProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const levelPulse = useRef(new Animated.Value(1)).current;
  const prevLevel = useRef(currentLevel);

  useEffect(() => {
    const progress = Math.min(currentExp / expToNextLevel, 1);

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 700,
      useNativeDriver: false,
    }).start();

    if (currentLevel > prevLevel.current) {
      Animated.sequence([
        Animated.timing(levelPulse, {
          toValue: 1.4,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(levelPulse, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    prevLevel.current = currentLevel;
  }, [currentExp, currentLevel]);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[styles.level, { transform: [{ scale: levelPulse }] }]}
      >
        LEVEL {currentLevel}
      </Animated.Text>

      <View style={styles.barBackground}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <Text style={styles.expText}>
        {currentExp} / {expToNextLevel} XP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  level: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  barBackground: {
    height: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  expText: {
    marginTop: 6,
    color: '#aaa',
    textAlign: 'center',
    fontSize: 12,
  },
});
