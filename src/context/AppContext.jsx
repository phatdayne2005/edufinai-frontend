import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import mockData from '../data/mockData';

const AppContext = createContext();

const STORAGE_KEYS = {
  theme: 'edufinai.theme',
  accent: 'edufinai.accent',
  reduceMotion: 'edufinai.reduceMotion',
};

const THEME_OPTIONS = [
  { id: 'light', label: 'Sáng', description: 'Màu sáng hiện đại' },
  { id: 'dark', label: 'Tối', description: 'Nổi bật dữ liệu' },
];

const ACCENT_OPTIONS = [
  { id: 'emerald', label: 'Lá', hue: 152, saturation: 64, lightness: 42 },
  { id: 'azure', label: 'Biển', hue: 200, saturation: 80, lightness: 44 },
  { id: 'violet', label: 'Tím', hue: 265, saturation: 66, lightness: 48 },
  { id: 'amber', label: 'Hổ phách', hue: 36, saturation: 84, lightness: 48 },
  { id: 'magenta', label: 'Hồng', hue: 320, saturation: 72, lightness: 46 },
];

const themeClassList = ['theme-light', 'theme-dark'];

const readStorage = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn('Unable to read localStorage', error);
    return null;
  }
};

const writeStorage = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn('Unable to write localStorage', error);
  }
};

const getInitialTheme = () => {
  const stored = readStorage(STORAGE_KEYS.theme);
  if (stored) return stored;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const getInitialAccent = () => {
  const stored = readStorage(STORAGE_KEYS.accent);
  return stored || 'emerald';
};

const getInitialReduceMotion = () => {
  const stored = readStorage(STORAGE_KEYS.reduceMotion);
  if (stored !== null) return stored === 'true';
  if (typeof window === 'undefined') return false;
  return !!(
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
};

const normalizeThemeValue = (value) => {
  if (value === 'contrast') return 'light';
  if (value === 'light' || value === 'dark') return value;
  return 'light';
};

export const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);
  const [accentColor, setAccentColor] = useState(getInitialAccent);
  const [reduceMotion, setReduceMotion] = useState(getInitialReduceMotion);
  const transitionTimerRef = useRef(null);

  const runThemeTransition = () => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.add('theme-transitioning');
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }
    transitionTimerRef.current = setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 450);
  };

  const setThemeSafe = (newTheme) => {
    const normalized = normalizeThemeValue(newTheme);
    setTheme(normalized);
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    themeClassList.forEach((cls) => root.classList.remove(cls));
    root.classList.add(`theme-${theme}`);
    writeStorage(STORAGE_KEYS.theme, theme);
    runThemeTransition();
  }, [theme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const accentTokens =
      ACCENT_OPTIONS.find((option) => option.id === accentColor) ||
      ACCENT_OPTIONS[0];
    const root = document.documentElement;
    root.style.setProperty('--accent-hue', `${accentTokens.hue}`);
    root.style.setProperty('--accent-saturation', `${accentTokens.saturation}%`);
    root.style.setProperty('--accent-lightness', `${accentTokens.lightness}%`);
    writeStorage(STORAGE_KEYS.accent, accentColor);
    runThemeTransition();
  }, [accentColor]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.reduceMotion = reduceMotion ? 'true' : 'false';
    writeStorage(STORAGE_KEYS.reduceMotion, String(reduceMotion));
  }, [reduceMotion]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      ...mockData,
      theme,
      setTheme: setThemeSafe,
      themeOptions: THEME_OPTIONS,
      accentColor,
      setAccentColor,
      accentOptions: ACCENT_OPTIONS,
      reduceMotion,
      setReduceMotion,
    }),
    [theme, accentColor, reduceMotion],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;

