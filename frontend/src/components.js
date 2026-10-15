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

const styles = StyleSheet.create({
  buttonWrap: { borderRadius: 10, overflow: 'hidden' },
  button: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  buttonContent: { flexDirection: 'row', alignItems: 'center' },
  buttonIcon: { marginRight: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.92 },
  disabled: { opacity: 0.55 },
});
