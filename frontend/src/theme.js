// Clean, formal blue & white theme.
export const colors = {
  background: '#F4F7FC',
  card: '#FFFFFF',
  border: '#DCE4F2',
  inputBg: '#F7F9FD',
  text: '#0F1E3D',
  muted: '#5B6B86',
  primary: '#1D4ED8',
  primaryLight: '#E8F0FE',
  success: '#059669',
  successBg: '#D1FAE5',
  warning: '#B45309',
  warningBg: '#FEF3C7',
  danger: '#DC2626',
  dangerBg: '#FDECEC',
};

export const gradients = {
  hero: ['#1E3A8A', '#1D4ED8', '#2563EB'],
  primary: ['#2563EB', '#1D4ED8'],
  analyze: ['#1E40AF', '#2563EB'],
  danger: ['#EF4444', '#DC2626'],
};

// One look per salary tier (low -> high), light blue to navy.
export const tierStyles = [
  { colors: ['#60A5FA', '#3B82F6'], icon: 'person', label: 'Entry level' },
  { colors: ['#2563EB', '#1D4ED8'], icon: 'people', label: 'Mid level' },
  { colors: ['#1E40AF', '#172554'], icon: 'ribbon', label: 'Senior level' },
];

export const avatarPalette = [
  ['#60A5FA', '#2563EB'],
  ['#38BDF8', '#0284C7'],
  ['#818CF8', '#4F46E5'],
  ['#3B82F6', '#1E40AF'],
  ['#22D3EE', '#0891B2'],
  ['#93C5FD', '#3B82F6'],
];

export const shadow = {
  card: { boxShadow: '0px 4px 14px rgba(15, 30, 61, 0.08)' },
  strong: { boxShadow: '0px 10px 30px rgba(15, 30, 61, 0.16)' },
};
