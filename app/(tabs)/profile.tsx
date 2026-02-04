import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Modal, Animated, TextInput, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, Award, ChevronRight, Trophy, Zap, X, Type, Camera, LogOut, Edit2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import colors from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { THEME_ACCENTS } from '@/constants/theme';
import type { ThemeAccent, XpBarTheme } from '@/contexts/AppSettingsContext';
import { useState, useRef, useEffect } from 'react';
import LavaBackground from '@/components/LavaBackground';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppSettings, FontFamily } from '@/contexts/AppSettingsContext';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const { settings, setFontFamily, setThemeAccent, setXpBarTheme, setXpBarFillColor } = useAppSettings();
  const { profile, stats, updateProfile, logout } = useUser();
  const theme = useTheme();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationGoal] = useState<string>('');
  const [showFontModal, setShowFontModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (profile?.name) {
      setEditName(profile.name);
    }
  }, [profile?.name]);

  useEffect(() => {
    if (showCelebration) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [showCelebration, scaleAnim, rotateAnim, fadeAnim]);

  const closeCelebration = () => {
    setShowCelebration(false);
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const achievements = [
    { icon: '🔥', title: 'Racha de 30 Días', unlocked: true },
    { icon: '💪', title: 'Primer RP', unlocked: true },
    { icon: '🏆', title: '100 Entrenamientos', unlocked: true },
    { icon: '⚡', title: 'Rey de la Consistencia', unlocked: false },
  ];

  const themeAccentOptions = (Object.keys(THEME_ACCENTS) as ThemeAccent[]).map((key) => ({
    key,
    ...THEME_ACCENTS[key],
  }));

  const xpBarThemeOptions: { key: XpBarTheme; label: string; subtitle: string }[] = [
    { key: 'minimalist', label: 'Minimalista', subtitle: 'Línea plana limpia' },
    { key: 'neon', label: 'Neón', subtitle: 'Efecto brillante' },
    { key: 'gradient', label: 'Gradiente', subtitle: 'Transición de dos tonos' },
    { key: 'classic', label: 'Clásico', subtitle: 'Bloques segmentados' },
    { key: 'cyber', label: 'Cyber', subtitle: 'Estilo futurista' },
  ];

  const colorPresets = ['#FFFFFF', theme.dark.accent, '#00D1FF', '#FF2D55', '#34C759', '#FFD60A', '#A855F7'];

  const normalizeHex = (value: string) => {
    const cleaned = value.trim().toUpperCase();
    if (cleaned.length === 0) return '';
    if (!cleaned.startsWith('#')) return `#${cleaned}`;
    return cleaned;
  };

  const isValidHex = (value: string) => /^#[0-9A-F]{6}$/.test(value);

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar la foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('[Profile] Image selected:', result.assets[0].uri);
        await updateProfile({ photoUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('[Profile] Error picking image:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (editName.trim()) {
      await updateProfile({ name: editName.trim() });
    }
    setShowEditProfileModal(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          }
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[theme.dark.gradientStart, theme.dark.gradientEnd]}
        style={StyleSheet.absoluteFillObject}
      />
      <LavaBackground />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.profile.title}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.brandText}>G-PRIME</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage}>
            {profile?.photoUri ? (
              <Image source={{ uri: profile.photoUri }} style={styles.avatarImage} />
            ) : (
              <LinearGradient
                colors={[theme.dark.accent, theme.dark.accentDark]}
                style={styles.avatarLarge}
              >
                <Text style={styles.avatarLargeText}>{getInitials(profile?.name || 'IN')}</Text>
              </LinearGradient>
            )}
            <View style={[styles.cameraButton, { backgroundColor: theme.dark.accent }]}>
              <Camera size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.nameContainer}>
            <Text style={styles.profileName}>{profile?.name || 'Invitado'}</Text>
            <TouchableOpacity onPress={() => setShowEditProfileModal(true)}>
              <Edit2 size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileBio}>Nivel {stats.level} • {stats.currentXp}/{stats.xpToNextLevel} XP</Text>
          
          <View style={styles.profileStats}>
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatValue}>{stats.totalExercises}</Text>
              <Text style={styles.profileStatLabel}>{t.profile.workouts}</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatValue}>{stats.totalSets}</Text>
              <Text style={styles.profileStatLabel}>Series</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatValue}>{stats.level}</Text>
              <Text style={styles.profileStatLabel}>Nivel</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.common.theme || 'Tema'}</Text>

          <View style={styles.themeGrid}>
            {themeAccentOptions.map((opt) => {
              const selected = settings.themeAccent === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.themeCard, selected && { borderColor: opt.color, borderWidth: 2 }]}
                  onPress={() => setThemeAccent(opt.key)}
                  testID={`theme-${opt.key}`}
                >
                  <View style={styles.themeCardTop}>
                    <LinearGradient
                      colors={[opt.gradientStart, opt.gradientEnd]}
                      style={styles.themeSwatch}
                    />
                    {selected && <Zap size={18} color={opt.color} />}
                  </View>
                  <Text style={styles.themeLabel}>{opt.label}</Text>
                  <Text style={styles.themeHex}>{opt.color}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.common.xpBar || 'Barra de XP'}</Text>

          <View style={styles.xpThemesList}>
            {xpBarThemeOptions.map((opt) => {
              const selected = settings.xpBarTheme === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.xpThemeRow, selected && { borderColor: theme.dark.accent, borderWidth: 2 }]}
                  onPress={() => setXpBarTheme(opt.key)}
                  testID={`xp-theme-${opt.key}`}
                >
                  <View style={styles.xpThemeRowLeft}>
                    <Text style={styles.xpThemeTitle}>{opt.label}</Text>
                    <Text style={styles.xpThemeSubtitle}>{opt.subtitle}</Text>
                  </View>
                  {selected && <Zap size={18} color={theme.dark.accent} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.xpColorCard}>
            <Text style={styles.xpColorTitle}>{t.common.fillColor || 'Color de Relleno'}</Text>

            <View style={styles.presetRow}>
              {colorPresets.map((c) => {
                const selected = (settings.xpBarFillColor || '').toUpperCase() === c.toUpperCase();
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.presetDot, { backgroundColor: c }, selected && { borderColor: theme.dark.accent, borderWidth: 3 }]}
                    onPress={() => setXpBarFillColor(c)}
                    testID={`xp-color-${c.replace('#', '').toLowerCase()}`}
                  />
                );
              })}
            </View>

            <View style={styles.hexRow}>
              <View
                style={[
                  styles.hexPreview,
                  {
                    backgroundColor: isValidHex(normalizeHex(settings.xpBarFillColor))
                      ? normalizeHex(settings.xpBarFillColor)
                      : theme.dark.surfaceSecondary,
                  },
                ]}
              />
              <View style={styles.hexInputWrap}>
                <Text style={styles.hexLabel}>{normalizeHex(settings.xpBarFillColor)}</Text>
                <TouchableOpacity
                  style={[styles.hexInputButton, { backgroundColor: theme.dark.accent }]}
                  onPress={() => {
                    const normalized = normalizeHex(settings.xpBarFillColor);
                    if (!isValidHex(normalized)) {
                      console.log('[XP] invalid hex', normalized);
                      return;
                    }
                    setXpBarFillColor(normalized);
                  }}
                  testID="xp-hex-apply"
                >
                  <Text style={styles.hexApplyText}>{t.common.apply || 'Aplicar'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.hexHint}>{t.common.tipHex || 'Consejo: usa formato #RRGGBB'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Award size={20} color={theme.dark.accent} />
            <Text style={styles.sectionTitle}>{t.profile.achievements}</Text>
          </View>

          <View style={styles.achievementsGrid}>
            {achievements.map((achievement, index) => (
              <View
                key={index}
                style={[
                  styles.achievementCard,
                  !achievement.unlocked && styles.achievementLocked,
                ]}
              >
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text
                  style={[
                    styles.achievementTitle,
                    !achievement.unlocked && styles.achievementTitleLocked,
                  ]}
                >
                  {achievement.title}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.profile.settings}</Text>
          
          {[
            { label: t.profile.accountSettings, icon: Settings },
            { label: t.profile.workoutPreferences, icon: Award },
            { label: t.profile.notifications, icon: Award },
          ].map((item, index) => (
            <TouchableOpacity key={index} style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: theme.dark.accent + '20' }]}>
                  <item.icon size={20} color={theme.dark.accent} />
                </View>
                <Text style={styles.settingLabel}>{item.label}</Text>
              </View>
              <ChevronRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.settingItem} onPress={() => setShowFontModal(true)}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: theme.dark.accent + '20' }]}>
                <Type size={20} color={theme.dark.accent} />
              </View>
              <Text style={styles.settingLabel}>{t.common.fontStyle}</Text>
            </View>
            <ChevronRight size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, styles.logoutButton]} onPress={handleLogout}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#FF3B3020' }]}>
                <LogOut size={20} color="#FF3B30" />
              </View>
              <Text style={[styles.settingLabel, { color: '#FF3B30' }]}>Cerrar Sesión</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showCelebration}
        transparent
        animationType="none"
        onRequestClose={closeCelebration}
      >
        <View style={styles.celebrationOverlay}>
          <Animated.View style={[styles.celebrationCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity style={styles.closeButton} onPress={closeCelebration}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <View style={styles.trophyContainer}>
                <Trophy size={80} color={colors.dark.gold} fill={colors.dark.gold} />
              </View>
            </Animated.View>
            
            <Text style={styles.congratsTitle}>{t.profile.congratulations}</Text>
            <Text style={styles.congratsMessage}>{t.profile.youveAchieved}</Text>
            <Text style={[styles.congratsExercise, { color: theme.dark.accent }]}>{celebrationGoal}</Text>
            
            <View style={[styles.rewardContainer, { backgroundColor: theme.dark.accent + '20' }]}>
              <Zap size={24} color={theme.dark.accent} fill={theme.dark.accent} />
              <Text style={[styles.rewardText, { color: theme.dark.accent }]}>+500 XP</Text>
            </View>
            
            <View style={styles.achievementBadge}>
              <Text style={styles.achievementText}>🏆 {t.profile.goalCrusher}</Text>
            </View>
            
            <TouchableOpacity style={styles.continueButton} onPress={closeCelebration}>
              <LinearGradient
                colors={[colors.dark.gold, colors.dark.warning]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueGradient}
              >
                <Text style={styles.continueText}>{t.profile.continue}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={showFontModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFontModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.common.fontStyle}</Text>
              <TouchableOpacity onPress={() => setShowFontModal(false)}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {(['default', 'rounded', 'modern', 'classic'] as FontFamily[]).map((font) => (
              <TouchableOpacity
                key={font}
                style={[styles.optionItem, settings.fontFamily === font && [styles.optionItemSelected, { borderColor: theme.dark.accent }]]}
                onPress={() => {
                  setFontFamily(font);
                  setShowFontModal(false);
                }}
              >
                <Text style={styles.optionText}>{t.common[font]}</Text>
                {settings.fontFamily === font && <Zap size={20} color={theme.dark.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.common.editProfile || 'Editar Perfil'}</Text>
              <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>{t.common.profileName || 'Nombre de Perfil'}</Text>
            <TextInput
              style={styles.textInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Tu nombre"
              placeholderTextColor={colors.dark.textSecondary}
            />

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: theme.dark.accent }]}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveButtonText}>{t.common.save}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700' as const,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 2.2,
    opacity: 0.7,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative' as const,
    marginBottom: 16,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarLargeText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700' as const,
  },
  cameraButton: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.dark.background,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700' as const,
  },
  profileBio: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 24,
    opacity: 0.8,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 20,
    gap: 24,
    borderWidth: 1,
    borderColor: colors.dark.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  profileStatItem: {
    alignItems: 'center',
  },
  profileStatValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  profileStatLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    opacity: 0.7,
  },
  profileStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.dark.border,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: '48%',
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.dark.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  achievementTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  achievementTitleLocked: {
    color: '#FFFFFF',
    opacity: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButton: {
    marginTop: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  celebrationCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.dark.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.dark.gold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  trophyContainer: {
    marginBottom: 24,
    marginTop: 20,
  },
  congratsTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  congratsMessage: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center' as const,
    opacity: 0.8,
  },
  congratsExercise: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 24,
    textAlign: 'center' as const,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  rewardText: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  achievementBadge: {
    backgroundColor: colors.dark.surfaceSecondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 24,
  },
  achievementText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  continueButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.dark.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: colors.dark.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeCard: {
    width: '48%',
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.dark.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  themeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  themeSwatch: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  themeLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  themeHex: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  xpThemesList: {
    gap: 10,
  },
  xpThemeRow: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.dark.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  xpThemeRowLeft: {
    flex: 1,
  },
  xpThemeTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700' as const,
  },
  xpThemeSubtitle: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  xpColorCard: {
    marginTop: 14,
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.dark.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  xpColorTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 10,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  presetDot: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  hexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  hexPreview: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  hexInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.dark.surfaceSecondary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  hexLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  hexInputButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  hexApplyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  hexHint: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 10,
    opacity: 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700' as const,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.dark.surfaceSecondary,
    marginBottom: 12,
  },
  optionItemSelected: {
    backgroundColor: colors.dark.accent + '20',
    borderWidth: 2,
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.dark.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
