import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  addEmployee,
  deleteEmployee,
  getEmployees,
  getSalaryClusters,
  toggleEmployeeStatus,
} from '../api';
import { useAuth } from '../AuthContext';
import { confirmDelete, formatMoney, parseSalary, showAlert } from '../utils';
import { colors, gradients, shadow, tierStyles } from '../theme';
import { Avatar, FadeInView, GradientButton } from '../components';
import Mascot from '../Mascot';

const FILTERS = ['All', 'Active', 'On Leave'];

export default function DashboardScreen({ navigation }) {
  const { token, setToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [employees, setEmployees] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [salary, setSalary] = useState('');
  const [adding, setAdding] = useState(false);

  // id of the employee currently being toggled/deleted (disables its buttons)
  const [busyId, setBusyId] = useState(null);

  const [clusters, setClusters] = useState(null); // null = not analyzed yet
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisRun, setAnalysisRun] = useState(0); // re-triggers card animation

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchEmployees = useCallback(async () => {
    try {
      const data = await getEmployees(token);
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      showAlert('Error loading employees', err.message);
    }
  }, [token]);

  // Load on mount
  useEffect(() => {
    (async () => {
      setLoadingList(true);
      await fetchEmployees();
      setLoadingList(false);
    })();
  }, [fetchEmployees]);

  const stats = useMemo(() => {
    const active = employees.filter((e) => e.status === 'Active').length;
    const total = employees.length;
    const sum = employees.reduce((acc, e) => acc + (Number(e.salary) || 0), 0);
    return {
      total,
      active,
      onLeave: total - active,
      average: total ? Math.round(sum / total) : 0,
    };
  }, [employees]);

  const visibleEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (statusFilter !== 'All' && e.status !== statusFilter) return false;
      if (!q) return true;
      return (
        String(e.name).toLowerCase().includes(q) || String(e.position).toLowerCase().includes(q)
      );
    });
  }, [employees, search, statusFilter]);

  const handleLogout = () => {
    setToken(null);
    navigation.replace('Login');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEmployees();
    setRefreshing(false);
  };

  const handleAdd = async () => {
    if (adding) return;
    const trimmedName = name.trim();
    const trimmedPosition = position.trim();

    if (!trimmedName || !trimmedPosition || !salary.trim()) {
      showAlert('Validation Error', 'Please fill in name, position and salary.');
      return;
    }
    const salaryNumber = parseSalary(salary);
    if (salaryNumber === null) {
      showAlert('Validation Error', 'Salary must be a valid positive number.');
      return;
    }

    setAdding(true);
    try {
      await addEmployee(token, {
        name: trimmedName,
        position: trimmedPosition,
        salary: salaryNumber,
      });
      setName('');
      setPosition('');
      setSalary('');
      setClusters(null); // previous analysis is now out of date
      await fetchEmployees();
    } catch (err) {
      showAlert('Error adding employee', err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (id) => {
    if (busyId) return;
    setBusyId(id);
    try {
      await toggleEmployeeStatus(token, id);
      await fetchEmployees();
    } catch (err) {
      showAlert('Error updating status', err.message);
      await fetchEmployees();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = (id) => {
    if (busyId) return;
    confirmDelete(async () => {
      setBusyId(id);
      try {
        await deleteEmployee(token, id);
        setClusters(null); // previous analysis is now out of date
        await fetchEmployees();
      } catch (err) {
        showAlert('Error deleting employee', err.message);
        await fetchEmployees();
      } finally {
        setBusyId(null);
      }
    });
  };

  const handleAnalyze = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    try {
      const data = await getSalaryClusters(token);
      setClusters(data && Array.isArray(data.clusters) ? data.clusters : []);
      setAnalysisRun((n) => n + 1);
    } catch (err) {
      showAlert('Error analyzing salaries', err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const renderEmployee = ({ item }) => {
    const isActive = item.status === 'Active';
    const isBusy = busyId === item.id;
    return (
      <View
        style={[
          styles.empCard,
          shadow.card,
          { borderLeftColor: isActive ? colors.success : colors.warning },
        ]}
      >
        <View style={styles.empRow}>
          <Avatar name={item.name} />
          <View style={styles.empInfo}>
            <Text style={styles.empName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.inlineRow}>
              <Ionicons name="briefcase-outline" size={13} color={colors.muted} />
              <Text style={styles.empPosition} numberOfLines={1}>{item.position}</Text>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: isActive ? colors.successBg : colors.warningBg }]}>
            <View style={[styles.badgeDot, { backgroundColor: isActive ? colors.success : colors.warning }]} />
            <Text style={[styles.badgeText, { color: isActive ? colors.success : colors.warning }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.salaryRow}>
          <Ionicons name="cash-outline" size={18} color={colors.primary} />
          <Text style={styles.salaryLabel}>Salary</Text>
          <Text style={styles.salaryValue}>฿ {formatMoney(item.salary)}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.toggleButton,
              pressed && styles.pressed,
              !!busyId && styles.disabled,
            ]}
            onPress={() => handleToggle(item.id)}
            disabled={!!busyId}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="swap-horizontal" size={16} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>Toggle Status</Text>
              </>
            )}
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.deleteButton,
              pressed && styles.pressed,
              !!busyId && styles.disabled,
            ]}
            onPress={() => handleDelete(item.id)}
            disabled={!!busyId}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const totalClustered = clusters ? clusters.reduce((acc, c) => acc + c.count, 0) : 0;

  // Passed as an element (not a component) so the TextInputs keep focus between renders.
  const header = (
    <View>
      {/* Hero */}
      <LinearGradient
        colors={gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 18 }]}
      >
        <View style={[styles.blob, styles.blobHero]} />
        <View style={styles.heroTop}>
          <View style={styles.heroIdentity}>
            <View style={styles.heroMascot}>
              <Mascot size={46} />
            </View>
            <View style={styles.flexShrink}>
              <Text style={styles.heroHello}>Hello, Admin</Text>
              <Text style={styles.heroTitle}>HR Dashboard</Text>
            </View>
          </View>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <StatTile icon="people" label="Employees" value={stats.total} />
          <StatTile icon="checkmark-circle" label="Active" value={stats.active} />
          <StatTile icon="airplane" label="On Leave" value={stats.onLeave} />
          <StatTile icon="wallet" label="Avg. Salary" value={formatMoney(stats.average)} />
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Add Employee form */}
        <View style={[styles.section, shadow.card]}>
          <SectionTitle icon="person-add" title="Add Employee" />
          <IconInput icon="person-outline" placeholder="Name" value={name} onChangeText={setName} editable={!adding} />
          <IconInput
            icon="briefcase-outline"
            placeholder="Position"
            value={position}
            onChangeText={setPosition}
            editable={!adding}
          />
          <IconInput
            icon="cash-outline"
            placeholder="Salary"
            value={salary}
            onChangeText={setSalary}
            keyboardType="numeric"
            editable={!adding}
          />
          <GradientButton title="Add Employee" icon="add-circle-outline" onPress={handleAdd} loading={adding} />
        </View>

        {/* Salary analysis */}
        <View style={[styles.section, shadow.card]}>
          <SectionTitle icon="analytics" title="Salary Analytics" subtitle="K-Means clustering (k = 3)" />
          <GradientButton
            title={analyzing ? 'Analyzing...' : 'Analyze Salary Structure'}
            icon="sparkles"
            colors={gradients.analyze}
            onPress={handleAnalyze}
            disabled={analyzing}
          />

          {analyzing && <ActivityIndicator style={styles.spinner} size="large" color={colors.primary} />}

          {!analyzing && clusters !== null && clusters.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons name="file-tray-outline" size={32} color={colors.muted} />
              <Text style={styles.emptyText}>No employee data</Text>
            </View>
          )}

          {!analyzing && clusters !== null && clusters.length > 0 && (
            <View style={styles.tierList}>
              {clusters.map((c, i) => {
                const look = tierStyles[Math.min(i, tierStyles.length - 1)];
                const pct = totalClustered ? Math.round((c.count / totalClustered) * 100) : 0;
                return (
                  <FadeInView key={`${analysisRun}-${c.group}`} delay={i * 140}>
                    <LinearGradient
                      colors={look.colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.tierCard, shadow.card]}
                    >
                      <View style={styles.tierHead}>
                        <View style={styles.tierIcon}>
                          <Ionicons name={look.icon} size={20} color="#fff" />
                        </View>
                        <View style={styles.flexShrink}>
                          <Text style={styles.tierName}>{c.group}</Text>
                          <Text style={styles.tierLabel}>{look.label}</Text>
                        </View>
                        <View style={styles.tierCount}>
                          <Text style={styles.tierCountValue}>{c.count}</Text>
                          <Text style={styles.tierCountLabel}>{c.count === 1 ? 'employee' : 'employees'}</Text>
                        </View>
                      </View>
                      <Text style={styles.tierAvgLabel}>Average salary</Text>
                      <Text style={styles.tierAvg}>฿ {formatMoney(c.centroid)}</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={styles.barText}>{pct}% of all employees</Text>
                    </LinearGradient>
                  </FadeInView>
                );
              })}
            </View>
          )}
        </View>

        {/* List header: search + filter */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Employees</Text>
          <Text style={styles.listCount}>
            {visibleEmployees.length} / {employees.length}
          </Text>
        </View>
        <View style={[styles.searchRow, shadow.card]}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name or position"
            placeholderTextColor="#A8A5C7"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>
        <View style={styles.chips}>
          {FILTERS.map((f) => {
            const selected = statusFilter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setStatusFilter(f)}
                style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{f}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={visibleEmployees}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderEmployee}
        ListHeaderComponent={header}
        ListEmptyComponent={
          loadingList ? (
            <ActivityIndicator style={styles.spinner} size="large" color={colors.primary} />
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={36} color={colors.muted} />
              <Text style={styles.emptyText}>
                {employees.length === 0 ? 'No employees yet.' : 'No employees match your search.'}
              </Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      />
    </KeyboardAvoidingView>
  );
}

function StatTile({ icon, label, value }) {
  return (
    <View style={styles.statTile}>
      <Ionicons name={icon} size={18} color="#fff" />
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function IconInput({ icon, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.inputRow, focused && styles.inputFocused]}>
      <Ionicons name={icon} size={18} color={focused ? colors.primary : colors.muted} />
      <TextInput
        style={styles.input}
        placeholderTextColor="#A8A5C7"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  flexShrink: { flexShrink: 1 },
  listContent: { paddingBottom: 40 },
  body: { paddingHorizontal: 16 },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  disabled: { opacity: 0.5 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },

  // Hero
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    marginBottom: 18,
  },
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.10)' },
  blobHero: { width: 220, height: 220, top: -70, right: -60 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  heroIdentity: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, marginRight: 10 },
  heroMascot: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heroHello: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '700', marginTop: 2 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  logoutText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  statTile: {
    flexGrow: 1,
    flexBasis: 130,
    margin: 5,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 6 },
  statLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },

  // Sections
  section: { backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 16 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  sectionSub: { fontSize: 12, color: colors.muted, marginTop: 1 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  inputFocused: { borderColor: colors.primary, backgroundColor: '#fff' },
  input: { flex: 1, paddingVertical: 11, paddingHorizontal: 10, fontSize: 16, color: colors.text },
  spinner: { marginVertical: 18 },
  emptyBox: { alignItems: 'center', paddingVertical: 18 },
  emptyText: { textAlign: 'center', color: colors.muted, fontSize: 15, marginTop: 6 },

  // Tier cards
  tierList: { marginTop: 14 },
  tierCard: { borderRadius: 18, padding: 16, marginBottom: 12 },
  tierHead: { flexDirection: 'row', alignItems: 'center' },
  tierIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  tierName: { color: '#fff', fontSize: 18, fontWeight: '700' },
  tierLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  tierCount: { marginLeft: 'auto', alignItems: 'flex-end' },
  tierCountValue: { color: '#fff', fontSize: 24, fontWeight: '700' },
  tierCountLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11 },
  tierAvgLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 14 },
  tierAvg: { color: '#fff', fontSize: 26, fontWeight: '700' },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginTop: 12,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: '#fff' },
  barText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 6 },

  // List header
  listHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  listTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  listCount: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchInput: { flex: 1, paddingVertical: 11, paddingHorizontal: 8, fontSize: 15, color: colors.text },
  chips: { flexDirection: 'row', marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  chipTextSelected: { color: '#fff' },

  // Employee card
  empCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    marginHorizontal: 16,
    borderLeftWidth: 4,
  },
  empRow: { flexDirection: 'row', alignItems: 'center' },
  empInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
  empName: { fontSize: 16, fontWeight: '700', color: colors.text },
  empPosition: { fontSize: 13, color: colors.muted, marginLeft: 4, flexShrink: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  salaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 12,
  },
  salaryLabel: { color: colors.muted, fontSize: 13, marginLeft: 8 },
  salaryValue: { marginLeft: 'auto', fontSize: 17, fontWeight: '700', color: colors.primary },
  actions: { flexDirection: 'row', marginTop: 12 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 42,
  },
  toggleButton: { backgroundColor: colors.primaryLight, marginRight: 8 },
  deleteButton: { backgroundColor: colors.dangerBg },
  actionText: { fontSize: 14, fontWeight: '700', marginLeft: 6 },
});
