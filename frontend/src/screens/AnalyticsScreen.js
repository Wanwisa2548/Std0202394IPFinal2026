import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getEmployees, getSalaryClusters } from '../api';
import { useAuth } from '../AuthContext';
import { formatMoney, showAlert } from '../utils';
import { colors, gradients, shadow, tierStyles } from '../theme';
import CuteIcon from '../CuteIcons';
import Mascot from '../Mascot';
import TierCard from '../TierCard';

/** Index of the cluster whose centroid is nearest to `salary` (clusters sorted ascending). */
function nearestTier(salary, clusters) {
  let best = 0;
  clusters.forEach((c, i) => {
    if (Math.abs(salary - c.centroid) < Math.abs(salary - clusters[best].centroid)) best = i;
  });
  return best;
}

export default function AnalyticsScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [employees, setEmployees] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [run, setRun] = useState(0);

  const load = useCallback(async () => {
    try {
      const [list, result] = await Promise.all([getEmployees(token), getSalaryClusters(token)]);
      setEmployees(Array.isArray(list) ? list : []);
      setClusters(result && Array.isArray(result.clusters) ? result.clusters : []);
      setRun((n) => n + 1);
    } catch (err) {
      showAlert('Error loading analytics', err.message);
    }
  }, [token]);

  // Reload every time the tab is opened, so it reflects adds/deletes on the Dashboard.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        await load();
        if (active) setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const insight = useMemo(() => {
    const valid = employees.filter((e) => Number.isFinite(Number(e.salary)));
    if (valid.length === 0) return null;
    const sorted = [...valid].sort((a, b) => Number(b.salary) - Number(a.salary));
    const values = sorted.map((e) => Number(e.salary)).reverse();
    const mid = Math.floor(values.length / 2);
    const median = values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
    const active = valid.filter((e) => e.status === 'Active').length;
    return {
      sorted,
      highest: sorted[0],
      lowest: sorted[sorted.length - 1],
      median: Math.round(median),
      max: Number(sorted[0].salary) || 1,
      active,
      onLeave: valid.length - active,
      total: valid.length,
    };
  }, [employees]);

  const totalClustered = clusters.reduce((acc, c) => acc + c.count, 0);

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <LinearGradient
        colors={gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 18 }]}
      >
        <View style={styles.heroRow}>
          <View style={styles.heroIcon}>
            <CuteIcon name="chart" size={36} />
          </View>
          <View style={styles.flexShrink}>
            <Text style={styles.heroSub}>K-Means · k = 3</Text>
            <Text style={styles.heroTitle}>Salary Insights</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator style={styles.spinner} size="large" color={colors.primary} />
        ) : !insight ? (
          <View style={[styles.section, shadow.card, styles.emptyBox]}>
            <Mascot size={72} />
            <Text style={styles.emptyText}>No employee data</Text>
          </View>
        ) : (
          <>
            {/* Highlights */}
            <View style={styles.highlightRow}>
              <Highlight icon="crown" label="Highest" value={insight.highest.salary} who={insight.highest.name} />
              <Highlight icon="coin" label="Median" value={insight.median} who={`${insight.total} employees`} />
              <Highlight icon="sprout" label="Lowest" value={insight.lowest.salary} who={insight.lowest.name} />
            </View>

            {/* Tiers */}
            <Text style={styles.heading}>Salary tiers</Text>
            {clusters.map((c, i) => (
              <TierCard key={`${run}-${c.group}`} cluster={c} index={i} total={totalClustered} delay={i * 120} />
            ))}

            {/* Distribution */}
            <Text style={styles.heading}>Salary by employee</Text>
            <View style={[styles.section, shadow.card]}>
              {insight.sorted.map((e) => {
                const tier = clusters.length ? nearestTier(Number(e.salary), clusters) : 0;
                const look = tierStyles[Math.min(tier, tierStyles.length - 1)];
                const width = Math.max((Number(e.salary) / insight.max) * 100, 4);
                return (
                  <View key={e.id} style={styles.distRow}>
                    <View style={styles.distHead}>
                      <Text style={styles.distName} numberOfLines={1}>{e.name}</Text>
                      <Text style={styles.distValue}>฿ {formatMoney(e.salary)}</Text>
                    </View>
                    <View style={styles.distTrack}>
                      <LinearGradient
                        colors={look.colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.distFill, { width: `${width}%` }]}
                      />
                    </View>
                  </View>
                );
              })}
              <View style={styles.legend}>
                {clusters.map((c, i) => (
                  <View key={c.group} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: tierStyles[Math.min(i, tierStyles.length - 1)].colors[0] }]} />
                    <Text style={styles.legendText}>{c.group}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Status breakdown */}
            <Text style={styles.heading}>Workforce status</Text>
            <View style={[styles.section, shadow.card]}>
              <View style={styles.statusBar}>
                {insight.active > 0 && (
                  <LinearGradient colors={['#34D399', '#059669']} style={{ flex: insight.active }} />
                )}
                {insight.onLeave > 0 && (
                  <LinearGradient colors={['#FDE68A', '#F59E0B']} style={{ flex: insight.onLeave }} />
                )}
              </View>
              <View style={styles.statusRow}>
                <StatusStat icon="check" label="Active" count={insight.active} total={insight.total} />
                <StatusStat icon="beach" label="On Leave" count={insight.onLeave} total={insight.total} />
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Highlight({ icon, label, value, who }) {
  return (
    <View style={[styles.highlight, shadow.card]}>
      <View style={styles.highlightIcon}>
        <CuteIcon name={icon} size={30} />
      </View>
      <Text style={styles.highlightLabel}>{label}</Text>
      <Text style={styles.highlightValue} numberOfLines={1} adjustsFontSizeToFit>
        ฿{formatMoney(value)}
      </Text>
      <Text style={styles.highlightWho} numberOfLines={1}>{who}</Text>
    </View>
  );
}

function StatusStat({ icon, label, count, total }) {
  return (
    <View style={styles.statusStat}>
      <CuteIcon name={icon} size={28} />
      <View style={styles.statusText}>
        <Text style={styles.statusCount}>
          {count} <Text style={styles.statusPct}>({total ? Math.round((count / total) * 100) : 0}%)</Text>
        </Text>
        <Text style={styles.statusLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 24 },
  flexShrink: { flexShrink: 1 },
  body: { paddingHorizontal: 16 },
  spinner: { marginVertical: 40 },

  hero: {
    paddingHorizontal: 20,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 18,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    boxShadow: '0px 4px 12px rgba(0,0,0,0.2)',
  },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '700', marginTop: 2 },

  heading: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 8, marginBottom: 10 },
  section: { backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 16 },
  emptyBox: { alignItems: 'center', paddingVertical: 28 },
  emptyText: { color: colors.muted, fontSize: 15, marginTop: 10 },

  highlightRow: { flexDirection: 'row', marginHorizontal: -5, marginBottom: 8 },
  highlight: {
    flex: 1,
    margin: 5,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
  },
  highlightIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  highlightLabel: { fontSize: 12, color: colors.muted },
  highlightValue: { fontSize: 16, fontWeight: '700', color: colors.primary, marginTop: 2 },
  highlightWho: { fontSize: 11, color: colors.muted, marginTop: 2 },

  distRow: { marginBottom: 12 },
  distHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  distName: { flexShrink: 1, fontSize: 13, fontWeight: '600', color: colors.text, marginRight: 8 },
  distValue: { fontSize: 13, fontWeight: '700', color: colors.primary },
  distTrack: { height: 12, borderRadius: 6, backgroundColor: colors.primaryLight, overflow: 'hidden' },
  distFill: { height: '100%', borderRadius: 6 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 14, marginTop: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12, color: colors.muted },

  statusBar: { flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.primaryLight },
  statusRow: { flexDirection: 'row', marginTop: 14 },
  statusStat: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  statusText: { marginLeft: 10 },
  statusCount: { fontSize: 18, fontWeight: '700', color: colors.text },
  statusPct: { fontSize: 13, fontWeight: '500', color: colors.muted },
  statusLabel: { fontSize: 12, color: colors.muted },
});
