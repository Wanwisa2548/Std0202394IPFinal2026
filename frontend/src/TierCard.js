import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CuteIcon from './CuteIcons';
import { FadeInView } from './components';
import { shadow, tierStyles } from './theme';
import { formatMoney } from './utils';

/** One K-Means salary tier: name, employee count, average salary and share bar. */
export default function TierCard({ cluster, index, total, delay = 0 }) {
  const look = tierStyles[Math.min(index, tierStyles.length - 1)];
  const pct = total ? Math.round((cluster.count / total) * 100) : 0;
  return (
    <FadeInView delay={delay}>
      <LinearGradient colors={look.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, shadow.card]}>
        <View style={styles.head}>
          <View style={styles.icon}>
            <CuteIcon name={look.icon} size={34} />
          </View>
          <View style={styles.flexShrink}>
            <Text style={styles.name}>{cluster.group}</Text>
            <Text style={styles.label}>{look.label}</Text>
          </View>
          <View style={styles.count}>
            <Text style={styles.countValue}>{cluster.count}</Text>
            <Text style={styles.countLabel}>{cluster.count === 1 ? 'employee' : 'employees'}</Text>
          </View>
        </View>
        <Text style={styles.avgLabel}>Average salary</Text>
        <Text style={styles.avg}>฿ {formatMoney(cluster.centroid)}</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.barText}>{pct}% of all employees</Text>
      </LinearGradient>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  flexShrink: { flexShrink: 1 },
  card: { borderRadius: 18, padding: 16, marginBottom: 12 },
  head: { flexDirection: 'row', alignItems: 'center' },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    boxShadow: '0px 4px 10px rgba(0,0,0,0.20)',
  },
  name: { color: '#fff', fontSize: 18, fontWeight: '700' },
  label: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  count: { marginLeft: 'auto', alignItems: 'flex-end' },
  countValue: { color: '#fff', fontSize: 24, fontWeight: '700' },
  countLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11 },
  avgLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 14 },
  avg: { color: '#fff', fontSize: 26, fontWeight: '700' },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginTop: 12,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: '#fff' },
  barText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 6 },
});
