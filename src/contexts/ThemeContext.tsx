import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  border: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  icon: string;
  colors: ThemeColors;
}

export const defaultDarkColors: ThemeColors = {
  background: '240 15% 6%',
  foreground: '180 100% 95%',
  card: '240 12% 10%',
  cardForeground: '180 100% 95%',
  primary: '160 100% 50%',
  primaryForeground: '240 15% 6%',
  secondary: '270 80% 60%',
  secondaryForeground: '0 0% 100%',
  muted: '240 10% 16%',
  mutedForeground: '220 10% 55%',
  accent: '45 100% 55%',
  accentForeground: '240 15% 6%',
  destructive: '0 80% 55%',
  border: '240 10% 18%',
};

export const presets: ThemePreset[] = [
  {
    id: 'dark-neon',
    name: 'Koyu Neon',
    icon: '🌙',
    colors: { ...defaultDarkColors },
  },
  {
    id: 'light',
    name: 'Açık Mod',
    icon: '☀️',
    colors: {
      background: '0 0% 97%',
      foreground: '240 10% 10%',
      card: '0 0% 100%',
      cardForeground: '240 10% 10%',
      primary: '160 80% 40%',
      primaryForeground: '0 0% 100%',
      secondary: '270 60% 55%',
      secondaryForeground: '0 0% 100%',
      muted: '220 15% 92%',
      mutedForeground: '220 10% 45%',
      accent: '45 90% 50%',
      accentForeground: '240 15% 10%',
      destructive: '0 70% 50%',
      border: '220 15% 85%',
    },
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    icon: '🤖',
    colors: {
      background: '270 20% 6%',
      foreground: '300 100% 95%',
      card: '270 18% 12%',
      cardForeground: '300 100% 95%',
      primary: '320 100% 60%',
      primaryForeground: '270 20% 6%',
      secondary: '180 100% 50%',
      secondaryForeground: '270 20% 6%',
      muted: '270 15% 18%',
      mutedForeground: '280 10% 55%',
      accent: '50 100% 55%',
      accentForeground: '270 20% 6%',
      destructive: '0 80% 55%',
      border: '270 15% 22%',
    },
  },
  {
    id: 'ocean',
    name: 'Okyanus',
    icon: '🌊',
    colors: {
      background: '210 30% 8%',
      foreground: '200 80% 90%',
      card: '210 25% 13%',
      cardForeground: '200 80% 90%',
      primary: '200 100% 55%',
      primaryForeground: '210 30% 8%',
      secondary: '170 70% 45%',
      secondaryForeground: '0 0% 100%',
      muted: '210 20% 18%',
      mutedForeground: '210 15% 50%',
      accent: '40 90% 55%',
      accentForeground: '210 30% 8%',
      destructive: '0 70% 55%',
      border: '210 20% 22%',
    },
  },
];

const CSS_VAR_MAP: Record<keyof ThemeColors, string> = {
  background: '--background',
  foreground: '--foreground',
  card: '--card',
  cardForeground: '--card-foreground',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  destructive: '--destructive',
  border: '--border',
};

const LABEL_MAP: Record<keyof ThemeColors, string> = {
  background: 'Arkaplan',
  foreground: 'Metin',
  card: 'Kart Arkaplanı',
  cardForeground: 'Kart Metni',
  primary: 'Ana Renk',
  primaryForeground: 'Ana Renk Metni',
  secondary: 'İkincil Renk',
  secondaryForeground: 'İkincil Renk Metni',
  muted: 'Soluk Arkaplan',
  mutedForeground: 'Soluk Metin',
  accent: 'Vurgu Rengi',
  accentForeground: 'Vurgu Metni',
  destructive: 'Tehlike Rengi',
  border: 'Kenarlık',
};

interface ThemeContextType {
  currentPresetId: string;
  colors: ThemeColors;
  setPreset: (id: string) => void;
  setCustomColor: (key: keyof ThemeColors, value: string) => void;
  isCustom: boolean;
  labels: Record<keyof ThemeColors, string>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function applyColors(colors: ThemeColors) {
  const root = document.documentElement;
  Object.entries(CSS_VAR_MAP).forEach(([key, cssVar]) => {
    root.style.setProperty(cssVar, colors[key as keyof ThemeColors]);
  });
  // Also update related vars
  root.style.setProperty('--input', colors.border);
  root.style.setProperty('--ring', colors.primary);
  root.style.setProperty('--popover', colors.card);
  root.style.setProperty('--popover-foreground', colors.cardForeground);
  root.style.setProperty('--destructive-foreground', '0 0% 100%');
  // Neon glows based on primary
  root.style.setProperty('--neon-glow', `0 0 10px hsl(${colors.primary} / 0.4), 0 0 30px hsl(${colors.primary} / 0.15)`);
  root.style.setProperty('--neon-glow-strong', `0 0 10px hsl(${colors.primary} / 0.6), 0 0 40px hsl(${colors.primary} / 0.3), 0 0 80px hsl(${colors.primary} / 0.1)`);
  root.style.setProperty('--neon-purple', `0 0 10px hsl(${colors.secondary} / 0.4), 0 0 30px hsl(${colors.secondary} / 0.15)`);
  root.style.setProperty('--neon-gold', `0 0 10px hsl(${colors.accent} / 0.4), 0 0 30px hsl(${colors.accent} / 0.15)`);
  // Sidebar
  root.style.setProperty('--sidebar-background', colors.card);
  root.style.setProperty('--sidebar-foreground', colors.foreground);
  root.style.setProperty('--sidebar-primary', colors.primary);
  root.style.setProperty('--sidebar-primary-foreground', colors.primaryForeground);
  root.style.setProperty('--sidebar-border', colors.border);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentPresetId, setCurrentPresetId] = useState(() => {
    return localStorage.getItem('theme-preset') || 'dark-neon';
  });
  const [colors, setColors] = useState<ThemeColors>(() => {
    const saved = localStorage.getItem('theme-colors');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    const preset = presets.find(p => p.id === (localStorage.getItem('theme-preset') || 'dark-neon'));
    return preset ? { ...preset.colors } : { ...defaultDarkColors };
  });
  const [isCustom, setIsCustom] = useState(() => {
    return localStorage.getItem('theme-preset') === 'custom';
  });

  useEffect(() => {
    applyColors(colors);
    localStorage.setItem('theme-colors', JSON.stringify(colors));
    localStorage.setItem('theme-preset', currentPresetId);
  }, [colors, currentPresetId]);

  const setPreset = (id: string) => {
    const preset = presets.find(p => p.id === id);
    if (preset) {
      setCurrentPresetId(id);
      setColors({ ...preset.colors });
      setIsCustom(false);
    }
  };

  const setCustomColor = (key: keyof ThemeColors, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
    setCurrentPresetId('custom');
    setIsCustom(true);
  };

  return (
    <ThemeContext.Provider value={{ currentPresetId, colors, setPreset, setCustomColor, isCustom, labels: LABEL_MAP }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
