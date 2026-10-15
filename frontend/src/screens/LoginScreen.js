import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { login } from '../api';
import { useAuth } from '../AuthContext';
import { showAlert } from '../utils';
import { colors, gradients, shadow } from '../theme';
import { FadeInView, GradientButton } from '../components';

export default function LoginScreen({ navigation }) {
  const { setToken } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;
    if (!username.trim() || !password) {
      showAlert('Login Failed', 'Please enter both username and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await login(username.trim(), password);
      if (!data || !data.success || !data.token) {
        throw new Error((data && data.message) || 'Invalid username or password');
      }
      setToken(data.token);
      // replace() so the Back button does not return to Login
      navigation.replace('Dashboard');
    } catch (err) {
      showAlert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.flex}>
      {/* decorative blobs */}
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <FadeInView style={styles.inner}>
            <View style={styles.logoWrap}>
              <View style={styles.logo}>
                <Ionicons name="people" size={38} color={colors.primary} />
              </View>
              <Text style={styles.brand}>HR Manager</Text>
              <Text style={styles.tagline}>Salary Analytics System</Text>
            </View>

            <View style={[styles.card, shadow.strong]}>
              <Text style={styles.welcome}>Welcome back 👋</Text>
              <Text style={styles.welcomeSub}>Sign in to manage your team</Text>

              <Text style={styles.label}>Username</Text>
              <View style={[styles.inputRow, focused === 'user' && styles.inputFocused]}>
                <Ionicons name="person-outline" size={20} color={colors.muted} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="admin"
                  placeholderTextColor="#A8A5C7"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  editable={!loading}
                  onFocus={() => setFocused('user')}
                  onBlur={() => setFocused(null)}
                />
              </View>

              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputRow, focused === 'pass' && styles.inputFocused]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.muted} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#A8A5C7"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                  editable={!loading}
                  onFocus={() => setFocused('pass')}
                  onBlur={() => setFocused(null)}
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
                </Pressable>
              </View>

              <GradientButton
                title="Log In"
                icon="log-in-outline"
                onPress={handleLogin}
                loading={loading}
                style={styles.loginButton}
              />
            </View>

            <Text style={styles.footer}>Internet Programming · Final 2026</Text>
          </FadeInView>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  inner: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  blobTop: { width: 260, height: 260, top: -80, right: -70 },
  blobBottom: { width: 320, height: 320, bottom: -120, left: -110 },

  logoWrap: { alignItems: 'center', marginBottom: 24 },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    boxShadow: '0px 8px 24px rgba(0,0,0,0.20)',
  },
  brand: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  card: { backgroundColor: colors.card, borderRadius: 24, padding: 24 },
  welcome: { fontSize: 22, fontWeight: '800', color: colors.text },
  welcomeSub: { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputFocused: { borderColor: colors.primary, backgroundColor: '#fff' },
  input: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 16, color: colors.text },
  loginButton: { marginTop: 8 },
  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.75)', marginTop: 24, fontSize: 13 },
});
