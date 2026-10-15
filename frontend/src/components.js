import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { avatarPalette, gradients } from './theme';

/** Gradient button with press feedback, loading spinner and disabled state. */
export function GradientButton({ title, onPress, disabled, loading, icon, colors = gradients.primary, style }) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.buttonWrap,
        style,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.buttonContent}>
            {icon && <Ionicons name={icon} size={18} color="#fff" style={styles.buttonIcon} />}
            <Text style={styles.buttonText}>{title}</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

/** Round avatar with initials; colour is stable per name. */
export function Avatar({ name, size = 44 }) {
  const text = String(name || '?').trim();
  const initials =
    text
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?';
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  const pair = avatarPalette[hash % avatarPalette.length];
  return (
    <LinearGradient
      colors={pair}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.38 }}>{initials}</Text>
    </LinearGradient>
  );
}

/** Fades and slides its children in on mount; `delay` staggers a list. */
export function FadeInView({ delay = 0, children, style }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 450,
      delay,
      useNativeDriver: false,
    }).start();
  }, [progress, delay]);
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  return <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

/** Gradient status pill with glow; "Active" has a pulsing live dot. */
export function StatusBadge({ status }) {
  const isActive = status === 'Active';
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isActive) return undefined;
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: false })
    );
    loop.start();
    return () => loop.stop();
  }, [isActive, pulse]);

  const look = isActive
    ? { colors: ['#34D399', '#059669'], text: '#FFFFFF', glow: '0px 4px 12px rgba(5,150,105,0.35)' }
    : { colors: ['#FDE68A', '#F59E0B'], text: '#78350F', glow: '0px 4px 12px rgba(245,158,11,0.35)' };

  return (
    <LinearGradient
      colors={look.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.badge, { boxShadow: look.glow }]}
    >
      {isActive ? (
        <View style={styles.dotWrap}>
          <Animated.View
            style={[
              styles.dotHalo,
              {
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] }) }],
              },
            ]}
          />
          <View style={styles.dot} />
        </View>
      ) : (
        <Ionicons name="airplane" size={12} color={look.text} style={styles.badgeIcon} />
      )}
      <Text style={[styles.badgeText, { color: look.text }]}>{status}</Text>
    </LinearGradient>
  );
}

const BUTTON_LOOKS = {
  primary: { colors: ['#3B82F6', '#1D4ED8'], lip: '#1E3A8A', glow: 'rgba(37,99,235,0.35)' },
  danger: { colors: ['#F87171', '#DC2626'], lip: '#991B1B', glow: 'rgba(220,38,38,0.30)' },
};

/** Tactile 3D button: darker bottom lip, coloured glow, sinks when pressed. */
export function Button3D({ title, subtitle, icon, variant = 'primary', onPress, disabled, loading, style }) {
  const look = BUTTON_LOOKS[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.b3dWrap,
        { backgroundColor: look.lip },
        {
          boxShadow: pressed ? `0px 1px 3px ${look.glow}` : `0px 6px 14px ${look.glow}`,
          paddingBottom: pressed ? 1 : 4,
          marginTop: pressed ? 3 : 0,
        },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <LinearGradient colors={look.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.b3dFace}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <View style={styles.b3dIcon}>
              <Ionicons name={icon} size={16} color="#fff" />
            </View>
            <View style={styles.b3dTextWrap}>
              <Text style={styles.b3dTitle} numberOfLines={1}>{title}</Text>
              {subtitle ? <Text style={styles.b3dSub} numberOfLines={1}>{subtitle}</Text> : null}
            </View>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
  badgeIcon: { marginRight: 5 },
  dotWrap: { width: 10, height: 10, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  dotHalo: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

  b3dWrap: { flex: 1, borderRadius: 14 },
  b3dFace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 10,
    minHeight: 50,
  },
  b3dIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  b3dTextWrap: { flexShrink: 1 },
  b3dTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  b3dSub: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 1 },

  buttonWrap: { borderRadius: 10, overflow: 'hidden' },
  button: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  buttonContent: { flexDirection: 'row', alignItems: 'center' },
  buttonIcon: { marginRight: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.92 },
  disabled: { opacity: 0.55 },
});
