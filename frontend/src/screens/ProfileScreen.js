import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getHealth } from '../api';
import { useAuth } from '../AuthContext';
import { API_BASE_URL } from '../config';
import { confirmLogout } from '../utils';
import { colors, gradients, shadow } from '../theme';
import CuteIcon from '../CuteIcons';
import Mascot from '../Mascot';
import { Button3D } from '../components';

export default function ProfileScreen({ navigation }) {
  const { token, setToken } = useAuth();
  const insets = useSafeAreaInsets();
  const [health, setHealth] = useState(null); // { ok, storage, message }

  const checkServer = useCallback(async () => {
    try {
      const data = await getHealth();
      setHealth({ ok: true, storage: data && data.storage });
    } catch (err) {
      setHealth({ ok: false, message: err.message });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkServer(); // runs automatically every time the Profile tab is opened
    }, [checkServer])
  );

  const handleLogout = () => {
    confirmLogout(() => {
      setToken(null);
      navigation.replace('Login');
    });
  };

  const online = health && health.ok;
  const storageLabel =
    health && health.storage === 'mysql' ? 'MySQL database' : health && health.storage ? 'In-memory (fallback)' : '-';

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 26 }]}
      >
        <View style={styles.avatar}>
          <Mascot size={92} />
        </View>
        <Text style={styles.name}>Administrator</Text>
        <Text style={styles.handle}>@admin</Text>
        <View style={styles.rolePill}>
          <CuteIcon name="key" size={16} />
          <Text style={styles.roleText}>HR Manager · Full access</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Server */}
        <View style={[styles.section, shadow.card]}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionIcon}>
              <CuteIcon name="server" size={30} />
            </View>
            <Text style={styles.sectionTitle}>Server status</Text>
            <View
              style={[
                styles.pill,
                { backgroundColor: health === null ? colors.primaryLight : online ? colors.successBg : colors.dangerBg },
              ]}
            >
              <View
                style={[
                  styles.pillDot,
                  { backgroundColor: health === null ? colors.muted : online ? colors.success : colors.danger },
                ]}
              />
              <Text
                style={[
                  styles.pillText,
                  { color: health === null ? colors.muted : online ? colors.success : colors.danger },
                ]}
              >
                {health === null ? 'Checking' : online ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>

          <InfoRow label="API URL" value={API_BASE_URL} />
          <InfoRow label="Storage" value={online ? storageLabel : '-'} />
          {health && !health.ok ? <Text style={styles.errorText}>{health.message}</Text> : null}
        </View>

        {/* Session / about */}
        <View style={[styles.section, shadow.card]}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionIcon}>
              <CuteIcon name="lock" size={28} />
            </View>
            <Text style={styles.sectionTitle}>Session</Text>
          </View>
          <InfoRow label="Signed in as" value="admin" />
          <InfoRow label="Token" value={token ? 'Active' : '-'} />
          <InfoRow label="App" value="HR Manager v1.0.0" />
          <InfoRow label="Course" value="Internet Programming · Final 2026" />
        </View>

        <View style={styles.logoutRow}>
          <Button3D title="Log Out" subtitle="End this session" icon="door" variant="danger" onPress={handleLogout} />
        </View>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 24 },
  body: { paddingHorizontal: 16 },

  hero: {
    alignItems: 'center',
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 18,
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.9)',
    boxShadow: '0px 10px 26px rgba(15,30,61,0.25)',
  },
  name: { color: '#fff', fontSize: 24, fontWeight: '700', marginTop: 14 },
  handle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
  },
  roleText: { color: '#fff', fontWeight: '600', fontSize: 13, marginLeft: 6 },

  section: { backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 16 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, flex: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  pillDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  pillText: { fontSize: 12, fontWeight: '700' },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoLabel: { color: colors.muted, fontSize: 14, marginRight: 12 },
  infoValue: { color: colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 4 },
  logoutRow: { flexDirection: 'row' },
});
