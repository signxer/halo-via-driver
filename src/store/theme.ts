// 主题状态:浅色/深色(原版 data-theme 机制),持久化到 localStorage
import {create} from 'zustand';
import bgLightUrl from '../assets/nuphy/background_bottom.webp';
import bgDarkUrl from '../assets/nuphy/background_bottom_dark.webp';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'nuphy-driver-theme';

const readInitialTheme = (): Theme => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  // NuPhy 驱动默认打开浅色主题，暗色主题由用户主动切换。
  return 'light';
};

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  // 背景图(与主题联动,原版 light/dark 两张图)
  root.style.setProperty(
    '--app-background-image',
    `url(${theme === 'dark' ? bgDarkUrl : bgLightUrl})`,
  );
  root.style.setProperty('--app-background-image-dark', `url(${bgDarkUrl})`);
};

type ThemeState = {
  theme: Theme;
  initTheme: () => void;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  initTheme: () => {
    const theme = readInitialTheme();
    applyTheme(theme);
    set({theme});
  },
  setTheme: (theme) => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
    set({theme});
  },
  toggleTheme: () => {
    get().setTheme(get().theme === 'dark' ? 'light' : 'dark');
  },
}));
