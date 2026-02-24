// ─── Sage Mist (Light) + Deep Forest (Dark) Design System ───────────

export const colors = {
  light: {
    background: '#F4F6F3',
    backgroundSecondary: '#EEF2EC',
    surface: '#FFFFFF',
    surfaceTint: 'rgba(107,142,110,0.05)',
    primary: '#6B8E6E',
    primaryLight: '#A4BE7B',
    secondary: '#A4BE7B',
    warmAccent: '#FFD6A5',
    warmAccentDark: '#F0C080',
    text: '#1F1F1F',
    textSecondary: '#6E6E6E',
    textLight: '#9A9A9A',
    border: 'rgba(0,0,0,0.06)',
    borderLight: 'rgba(0,0,0,0.03)',
    shadow: 'rgba(0,0,0,0.05)',
    success: '#6B8E6E',
    warning: '#E8B86D',
    headerBg: '#FFFFFF',
    inputBg: '#FFFFFF',
    inputFieldBg: '#F4F6F3',
    // Emotions
    emotionHappy: '#6B8E6E',
    emotionSad: '#6C9BCF',
    emotionAnxious: '#9C7EBF',
    emotionAngry: '#C97C7C',
    emotionCalm: '#7DB8A6',
    emotionTired: '#8E9EAE',
    emotionLonely: '#B088A8',
    emotionHopeful: '#C4A84D',
  },
  dark: {
    background: '#161B22',
    backgroundSecondary: '#1C2128',
    surface: '#21262D',
    surfaceTint: 'rgba(107,142,110,0.08)',
    primary: '#7EAA82',
    primaryLight: '#A4BE7B',
    secondary: '#A4BE7B',
    warmAccent: '#FFD6A5',
    warmAccentDark: '#D4A56A',
    text: '#E6EDF3',
    textSecondary: '#8B949E',
    textLight: '#6E7681',
    border: 'rgba(255,255,255,0.08)',
    borderLight: 'rgba(255,255,255,0.04)',
    shadow: 'rgba(0,0,0,0.3)',
    success: '#7EAA82',
    warning: '#D4A56A',
    headerBg: '#1C2128',
    inputBg: '#1C2128',
    inputFieldBg: '#21262D',
    // Emotions
    emotionHappy: '#7EAA82',
    emotionSad: '#7DAED4',
    emotionAnxious: '#AD90CC',
    emotionAngry: '#D49090',
    emotionCalm: '#8EC8B5',
    emotionTired: '#9EAEBD',
    emotionLonely: '#C098B8',
    emotionHopeful: '#D4B85A',
  },
};

export const gradients = {
  light: {
    background: ['#F4F6F3', '#EEF2EC'] as const,
    buttonPrimary: ['#6B8E6E', '#A4BE7B'] as const,
    warmHero: ['#FFF6ED', '#FDEFE3'] as const,
    chatUser: ['#6B8E6E', '#7A9E7D'] as const,
  },
  dark: {
    background: ['#161B22', '#1C2128'] as const,
    buttonPrimary: ['#5A7E5D', '#7EAA82'] as const,
    warmHero: ['#2A2218', '#251E15'] as const,
    chatUser: ['#5A7E5D', '#6B8E6E'] as const,
  },
};

export const moodColors = {
  light: {
    happy: { bg: '#EAF7EE', border: '#C2DFC8', accent: '#6B8E6E' },
    okay: { bg: '#FFF5E5', border: '#FFE4B8', accent: '#D4A04A' },
    calm: { bg: '#EEF7F3', border: '#C3E4D8', accent: '#7DB8A6' },
    tired: { bg: '#EEF1F5', border: '#C8D4DE', accent: '#8E9EAE' },
    anxious: { bg: '#F3EAF7', border: '#D6C4E0', accent: '#9C7EBF' },
    sad: { bg: '#EAF0F7', border: '#C0D2E6', accent: '#6C9BCF' },
  },
  dark: {
    happy: { bg: 'rgba(126,170,130,0.12)', border: 'rgba(126,170,130,0.25)', accent: '#7EAA82' },
    okay: { bg: 'rgba(212,165,106,0.12)', border: 'rgba(212,165,106,0.25)', accent: '#D4A56A' },
    calm: { bg: 'rgba(142,200,181,0.12)', border: 'rgba(142,200,181,0.25)', accent: '#8EC8B5' },
    tired: { bg: 'rgba(158,174,189,0.12)', border: 'rgba(158,174,189,0.25)', accent: '#9EAEBD' },
    anxious: { bg: 'rgba(173,144,204,0.12)', border: 'rgba(173,144,204,0.25)', accent: '#AD90CC' },
    sad: { bg: 'rgba(125,174,212,0.12)', border: 'rgba(125,174,212,0.25)', accent: '#7DAED4' },
  },
};

export const typography = {
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    xxl: 26,
    xxxl: 32,
    huge: 40,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  full: 9999,
};
