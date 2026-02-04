import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Phone, User, ArrowRight, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import colors from '@/constants/colors';
import LavaBackground from '@/components/LavaBackground';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { loginAsGuest, loginWithPhone } = useUser();
  const theme = useTheme();
  const { t } = useTranslation();
  
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, logoScale]);

  const handleGuestLogin = async () => {
    console.log('[Login] Guest login initiated');
    setIsLoading(true);
    await loginAsGuest();
    setIsLoading(false);
    router.replace('/(tabs)');
  };

  const handleSendCode = () => {
    if (phoneNumber.length < 8) return;
    console.log('[Login] Sending verification code to:', phoneNumber);
    setShowVerification(true);
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length < 4) return;
    console.log('[Login] Verifying code:', verificationCode);
    setIsLoading(true);
    await loginWithPhone(phoneNumber);
    setIsLoading(false);
    router.replace('/(tabs)');
  };

  const handleBack = () => {
    if (showVerification) {
      setShowVerification(false);
      setVerificationCode('');
    } else {
      setShowPhoneInput(false);
      setPhoneNumber('');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={[theme.dark.gradientStart, theme.dark.gradientEnd]}
        style={StyleSheet.absoluteFillObject}
      />
      <LavaBackground />

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {(showPhoneInput || showVerification) && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ChevronLeft size={24} color="#FFFFFF" />
            <Text style={styles.backText}>{t.auth.back}</Text>
          </TouchableOpacity>
        )}

        <Animated.View 
          style={[
            styles.logoContainer,
            { 
              opacity: fadeAnim, 
              transform: [{ scale: logoScale }] 
            }
          ]}
        >
          <LinearGradient
            colors={[theme.dark.accent, theme.dark.accentDark]}
            style={styles.logoGradient}
          >
            <Text style={styles.logoText}>G</Text>
          </LinearGradient>
          <Text style={styles.brandName}>G-PRIME</Text>
          <Text style={styles.tagline}>{t.auth.subtitle}</Text>
        </Animated.View>

        <Animated.View 
          style={[
            styles.formContainer,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {!showPhoneInput && !showVerification ? (
            <>
              <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: theme.dark.accent }]}
                onPress={() => setShowPhoneInput(true)}
                disabled={isLoading}
              >
                <Phone size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>{t.auth.phoneLogin}</Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleGuestLogin}
                disabled={isLoading}
              >
                <User size={20} color="#FFFFFF" />
                <Text style={styles.secondaryButtonText}>{t.auth.guestLogin}</Text>
              </TouchableOpacity>
            </>
          ) : showPhoneInput && !showVerification ? (
            <>
              <Text style={styles.inputLabel}>{t.auth.enterPhone}</Text>
              <View style={styles.inputContainer}>
                <Phone size={20} color={theme.dark.accent} />
                <TextInput
                  style={styles.textInput}
                  placeholder="+52 123 456 7890"
                  placeholderTextColor={colors.dark.textSecondary}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  autoFocus
                />
              </View>

              <TouchableOpacity 
                style={[
                  styles.primaryButton, 
                  { backgroundColor: theme.dark.accent },
                  phoneNumber.length < 8 && styles.buttonDisabled
                ]}
                onPress={handleSendCode}
                disabled={phoneNumber.length < 8 || isLoading}
              >
                <Text style={styles.primaryButtonText}>{t.auth.sendCode}</Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.inputLabel}>{t.auth.enterCode}</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.textInput, styles.codeInput]}
                  placeholder="0000"
                  placeholderTextColor={colors.dark.textSecondary}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>

              <TouchableOpacity 
                style={[
                  styles.primaryButton, 
                  { backgroundColor: theme.dark.accent },
                  verificationCode.length < 4 && styles.buttonDisabled
                ]}
                onPress={handleVerifyCode}
                disabled={verificationCode.length < 4 || isLoading}
              >
                <Text style={styles.primaryButtonText}>{t.auth.verify}</Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute' as const,
    top: 20,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '800' as const,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800' as const,
    letterSpacing: 4,
    marginBottom: 8,
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.8,
  },
  formContainer: {
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
    flex: 1,
    textAlign: 'center' as const,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginHorizontal: 16,
    opacity: 0.6,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.dark.border,
    gap: 12,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  codeInput: {
    textAlign: 'center' as const,
    letterSpacing: 8,
    fontSize: 24,
  },
});
