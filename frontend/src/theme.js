export const colors = {
  background: '#F4F3FF',
  card: '#FFFFFF',
  border: '#E6E4F5',
  inputBg: '#F8F7FF',
  text: '#1E1B4B',
  muted: '#6B6893',
  primary: '#6D28D9',
  primaryLight: '#EDE9FE',
  success: '#059669',
  successBg: '#D1FAE5',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  danger: '#E11D48',
  dangerBg: '#FFE4E6',
};

export const gradients = {
  hero: ['#4F46E5', '#7C3AED', '#C026D3'],
  primary: ['#6D28D9', '#4F46E5'],
  analyze: ['#DB2777', '#9333EA'],
  danger: ['#F43F5E', '#E11D48'],
};

// One look per salary tier (low -> high). Extra tiers reuse the last style.
export const tierStyles = [
  { colors: ['#10B981', '#0D9488'], icon: 'leaf', label: 'Entry level' },
  { colors: ['#3B82F6', '#6366F1'], icon: 'trending-up', label: 'Mid level' },
  { colors: ['#F59E0B', '#EF4444'], icon: 'trophy', label: 'Top level' },
];

export const avatarPalette = [
  ['#F472B6', '#DB2777'],
  ['#818CF8', '#4F46E5'],
  ['#34D399', '#059669'],
  ['#FBBF24', '#D97706'],
  ['#60A5FA', '#2563EB'],
  ['#A78BFA', '#7C3AED'],
  ['#F87171', '#DC2626'],
  ['#2DD4BF', '#0D9488'],
];

export const shadow = {
  card: { boxShadow: '0px 6px 18px rgba(76, 29, 149, 0.10)' },
  strong: { boxShadow: '0px 10px 28px rgba(76, 29, 149, 0.22)' },
};
