export const colors = {
  bg: '#F6F7F4',
  surface: '#FFFFFF',
  ink: '#16211C',
  muted: '#6B7770',
  line: '#E3E7E1',
  primary: '#1E6F5C',
  primarySoft: '#E3F0EC',
  danger: '#B93815',
  calories: '#1E6F5C',
  protein: '#4457C9',
  carbs: '#D9902B',
  fat: '#C9506F',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 };

export const type = {
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.ink, letterSpacing: -0.5 },
  heading: { fontSize: 18, fontWeight: '600' as const, color: colors.ink },
  body: { fontSize: 15, color: colors.ink },
  small: { fontSize: 13, color: colors.muted },
};
