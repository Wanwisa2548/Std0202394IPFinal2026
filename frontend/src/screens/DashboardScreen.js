import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  addEmployee,
  deleteEmployee,
  getEmployees,
  getSalaryClusters,
  toggleEmployeeStatus,
} from '../api';
import { useAuth } from '../AuthContext';
import { confirmDelete, formatMoney, parseSalary, showAlert } from '../utils';
import { colors } from '../theme';

export default function DashboardScreen({ navigation }) {
  const { token, setToken } = useAuth();

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

  // Logout button in the header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            setToken(null);
            navigation.replace('Login');
          }}
          hitSlop={10}
        >
          <Text style={styles.headerLink}>Logout</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, setToken]);

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
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.flexShrink}>
            <Text style={styles.empName}>{item.name}</Text>
            <Text style={styles.empPosition}>{item.position}</Text>
          </View>
          <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeLeave]}>
            <Text style={[styles.badgeText, { color: isActive ? colors.success : colors.warning }]}>
              {item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.salary}>Salary: {formatMoney(item.salary)}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.smallButton, styles.toggleButton, (isBusy || busyId) && styles.buttonDisabled]}
            onPress={() => handleToggle(item.id)}
            disabled={!!busyId}
          >
            <Text style={styles.smallButtonText}>Toggle Status</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallButton, styles.deleteButton, (isBusy || busyId) && styles.buttonDisabled]}
            onPress={() => handleDelete(item.id)}
            disabled={!!busyId}
          >
            <Text style={styles.smallButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
        {isBusy && <ActivityIndicator style={styles.itemSpinner} color={colors.primary} />}
      </View>
    );
  };

  // Passed as an element (not a component) so the TextInputs keep focus between renders.
  const header = (
    <View>
      {/* Add Employee form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Employee</Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
          editable={!adding}
        />
        <TextInput
          style={styles.input}
          placeholder="Position"
          value={position}
          onChangeText={setPosition}
          editable={!adding}
        />
        <TextInput
          style={styles.input}
          placeholder="Salary"
          value={salary}
          onChangeText={setSalary}
          keyboardType="numeric"
          editable={!adding}
        />
        <TouchableOpacity
          style={[styles.button, adding && styles.buttonDisabled]}
          onPress={handleAdd}
          disabled={adding}
        >
          {adding ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Add Employee</Text>}
        </TouchableOpacity>
      </View>

      {/* Salary analysis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Salary Analytics</Text>
        <TouchableOpacity
          style={[styles.button, styles.analyzeButton, analyzing && styles.buttonDisabled]}
          onPress={handleAnalyze}
          disabled={analyzing}
        >
          <Text style={styles.buttonText}>Analyze Salary Structure</Text>
        </TouchableOpacity>

        {analyzing && <ActivityIndicator style={styles.spinner} size="large" color={colors.primary} />}

        {!analyzing && clusters !== null && clusters.length === 0 && (
          <Text style={styles.emptyText}>No employee data</Text>
        )}

        {!analyzing && clusters !== null && clusters.length > 0 && (
          <View style={styles.clusterRow}>
            {clusters.map((c) => (
              <View key={c.group} style={styles.clusterCard}>
                <Text style={styles.clusterTier}>{c.group}</Text>
                <Text style={styles.clusterLabel}>Employees</Text>
                <Text style={styles.clusterValue}>{c.count}</Text>
                <Text style={styles.clusterLabel}>Avg. Salary</Text>
                <Text style={styles.clusterValue}>{formatMoney(c.centroid)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Text style={styles.listTitle}>Employees ({employees.length})</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <FlatList
        data={employees}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderEmployee}
        ListHeaderComponent={header}
        ListEmptyComponent={
          loadingList ? (
            <ActivityIndicator style={styles.spinner} size="large" color={colors.primary} />
          ) : (
            <Text style={styles.emptyText}>No employees yet.</Text>
          )
        }
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  flexShrink: { flexShrink: 1, paddingRight: 8 },
  listContent: { padding: 16, paddingBottom: 40 },
  headerLink: { color: colors.primary, fontSize: 16, fontWeight: '600' },

  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
    color: colors.text,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  analyzeButton: { backgroundColor: colors.secondary },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  spinner: { marginVertical: 16 },
  emptyText: { textAlign: 'center', color: colors.muted, fontSize: 15, marginVertical: 16 },

  clusterRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, marginHorizontal: -4 },
  clusterCard: {
    flexGrow: 1,
    flexBasis: 90,
    margin: 4,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
  },
  clusterTier: { fontSize: 16, fontWeight: '700', color: colors.primary, marginBottom: 6 },
  clusterLabel: { fontSize: 12, color: colors.muted },
  clusterValue: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },

  listTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  empName: { fontSize: 16, fontWeight: '700', color: colors.text },
  empPosition: { fontSize: 14, color: colors.muted, marginTop: 2 },
  salary: { fontSize: 15, color: colors.text, marginTop: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeActive: { backgroundColor: colors.successBg },
  badgeLeave: { backgroundColor: colors.warningBg },
  badgeText: { fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', marginTop: 12 },
  smallButton: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  toggleButton: { backgroundColor: colors.primary, marginRight: 8 },
  deleteButton: { backgroundColor: colors.danger },
  smallButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  itemSpinner: { marginTop: 8 },
});
