import { Alert, Platform } from 'react-native';

/**
 * Alert.alert is a no-op on react-native-web, so fall back to the browser
 * dialogs there. On iOS/Android the native Alert.alert is used.
 */
export function showAlert(title, message) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

export function confirmDelete(onConfirm) {
  if (Platform.OS === 'web') {
    if (window.confirm('Confirm Delete\n\nAre you sure?')) onConfirm();
    return;
  }
  Alert.alert('Confirm Delete', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}

export function confirmLogout(onConfirm) {
  if (Platform.OS === 'web') {
    if (window.confirm('Log Out\n\nDo you want to log out?')) onConfirm();
    return;
  }
  Alert.alert('Log Out', 'Do you want to log out?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Log Out', style: 'destructive', onPress: onConfirm },
  ]);
}

/** Formats a number with thousands separators, e.g. 45000 -> "45,000", 1234.5 -> "1,234.50". */
export function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  const fixed = Number.isInteger(n) ? String(n) : n.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart ? `${withCommas}.${decPart}` : withCommas;
}

/** Returns the salary as a positive finite number, or null if invalid. */
export function parseSalary(text) {
  const trimmed = String(text ?? '').trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n > 0 ? n : null;
}
