import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useTheme } from '@/hooks/useTheme';
import { useRef, useEffect } from 'react';

interface AnimeExpBarProps {
  currentExp: number;
  expToNextLevel: number;
  currentLevel: number;
}

export default function AnimeExpBar({ currentExp, expToNextLevel, currentLevel }: AnimeExpBarProps) {
  const { settings } = useAppSettings();
  const theme = useTheme();
  const expProgress = (currentExp / expToNextLevel) * 100;
  const fillColor = settings.xpBarFillColor || theme.dark.accent;
  const xpBarTheme = settings.xpBarTheme;

  const isWeb = Platform.OS === 'web';
  const shimmerEnabled = xpBarTheme === 'neon' || xpBarTheme === 'gradient' || xpBarTheme === 'cyber';
  const pulseEnabled = xpBarTheme !== 'minimalist';
  const sparkleEnabled = xpBarTheme === 'cyber' || xpBarTheme === 'gradient';
  const notchEnabled = xpBarTheme === 'classic';
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    if (shimmerEnabled) shimmer.start();
    if (pulseEnabled) pulse.start();

    return () => {
      shimmer.stop();
      pulse.stop();
    };
  }, [pulseEnabled, pulseAnim, shimmerAnim, shimmerEnabled]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        styles.container,
        xpBarTheme === 'minimalist' && {
          borderWidth: 1,
          borderColor: theme.dark.border,
          shadowOpacity: 0,
          elevation: 0,
        },
        xpBarTheme === 'neon' && {
          borderColor: fillColor + '70',
          shadowColor: fillColor,
          shadowOpacity: isWeb ? 0 : 0.45,
        },
        xpBarTheme === 'cyber' && {
          borderColor: fillColor + '55',
        },
      ]}
      testID="xp-bar"
    >
      <View style={styles.header}>
        <View
          style={[
            styles.levelBadge,
            {
              backgroundColor:
                xpBarTheme === 'minimalist' ? theme.dark.surfaceSecondary : fillColor + '20',
              borderColor: xpBarTheme === 'minimalist' ? theme.dark.border : fillColor,
            },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Zap size={20} color={fillColor} fill={fillColor} />
          </Animated.View>
          <Text style={[styles.levelText, { color: xpBarTheme === 'minimalist' ? theme.dark.text : fillColor }]}>
            LV {currentLevel}
          </Text>
        </View>
        <Text style={styles.expValue}>
          {currentExp.toLocaleString()} / {expToNextLevel.toLocaleString()} XP
        </Text>
      </View>

      <View style={styles.barContainer}>
        <View style={styles.barOuter}>
          <View
            style={[
              styles.barBorder,
              xpBarTheme === 'minimalist' && {
                backgroundColor: theme.dark.border + '50',
                borderColor: theme.dark.border,
                borderWidth: 1,
              },
              xpBarTheme !== 'minimalist' && {
                backgroundColor: fillColor + '30',
                borderColor: fillColor,
              },
              xpBarTheme === 'neon' && {
                shadowColor: fillColor,
                shadowOpacity: isWeb ? 0 : 0.65,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 0 },
                elevation: 14,
              },
            ]}
          />
          <View
            style={[
              styles.barBackground,
              xpBarTheme === 'minimalist' && {
                top: 6,
                left: 6,
                right: 6,
                bottom: 6,
                borderRadius: 12,
              },
            ]}
          >
            <LinearGradient
              colors={
                xpBarTheme === 'gradient'
                  ? [fillColor, theme.dark.accentLight]
                  : xpBarTheme === 'cyber'
                    ? [fillColor, '#00D1FF']
                    : [fillColor, fillColor]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.barFill,
                {
                  width: `${expProgress}%`,
                  borderRadius: xpBarTheme === 'classic' ? 2 : 12,
                },
              ]}
            >
              {shimmerEnabled && (
                <Animated.View
                  style={[
                    styles.shimmer,
                    {
                      opacity: xpBarTheme === 'neon' ? 0.55 : 0.4,
                      backgroundColor:
                        xpBarTheme === 'cyber'
                          ? 'rgba(255, 255, 255, 0.25)'
                          : 'rgba(255, 255, 255, 0.4)',
                      transform: [{ translateX: shimmerTranslate }],
                    },
                  ]}
                />
              )}

              {sparkleEnabled && (
                <View style={styles.sparkles} pointerEvents="none">
                  {[...Array(5)].map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.sparkle,
                        {
                          left: `${20 + i * 15}%`,
                          backgroundColor:
                            xpBarTheme === 'cyber'
                              ? 'rgba(0, 209, 255, 0.85)'
                              : 'rgba(255, 255, 255, 0.9)',
                        },
                      ]}
                    />
                  ))}
                </View>
              )}

              {xpBarTheme === 'classic' && (
                <View style={styles.segmentOverlay} pointerEvents="none">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <View key={i} style={[styles.segment, { left: `${(i / 12) * 100}%` }]} />
                  ))}
                </View>
              )}

              {xpBarTheme === 'cyber' && (
                <View style={styles.cyberNoise} pointerEvents="none" />
              )}
            </LinearGradient>
          </View>

          {notchEnabled && (
            <View style={styles.notches}>
              {[25, 50, 75].map((position) => (
                <View
                  key={position}
                  style={[styles.notch, { left: `${position}%` }]}
                />
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.expRemaining}>
          {(expToNextLevel - currentExp).toLocaleString()} XP to Level {currentLevel + 1}
        </Text>
        <Text
          style={[styles.percentage, { color: xpBarTheme === 'minimalist' ? theme.dark.textSecondary : fillColor }]}
          testID="xp-percentage"
        >
          {Math.floor(expProgress)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dark.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 3,
    borderColor: colors.dark.gold + '40',
    shadowColor: colors.dark.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dark.gold + '20',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.dark.gold,
  },
  levelText: {
    color: colors.dark.gold,
    fontSize: 18,
    fontWeight: '900' as const,
    letterSpacing: 1,
  },
  expValue: {
    color: colors.dark.text,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  barContainer: {
    marginBottom: 12,
  },
  barOuter: {
    position: 'relative' as const,
    height: 32,
  },
  barBorder: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.dark.gold + '30',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.dark.gold,
  },
  barBackground: {
    position: 'absolute' as const,
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    backgroundColor: colors.dark.surfaceSecondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 12,
    position: 'relative' as const,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ skewX: '-20deg' }],
  },
  sparkles: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkle: {
    position: 'absolute' as const,
    top: '50%',
    width: 6,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 3,
    transform: [{ translateY: -3 }],
  },
  notches: {
    position: 'absolute' as const,
    top: 0,
    left: 4,
    right: 4,
    bottom: 0,
  },
  notch: {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.dark.border,
    transform: [{ translateX: -1 }],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expRemaining: {
    color: colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  percentage: {
    color: colors.dark.gold,
    fontSize: 16,
    fontWeight: '900' as const,
  },
  segmentOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  segment: {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  cyberNoise: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
});
