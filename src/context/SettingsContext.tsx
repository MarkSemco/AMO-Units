import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppTab = 'optical' | 'laser' | 'rf' | 'error-propagation' | 'presets' | 'formulas';

export const TEXT_SCALE_PRESETS = [
  { value: 0.85, label: '85% Compact' },
  { value: 1.0, label: '100% Standard' },
  { value: 1.15, label: '115% Relaxed' },
  { value: 1.3, label: '130% Large' }
] as const;

export interface SettingsState {
  precisionDigits: number; // 4 to 10, default 6
  defaultImpedance: number; // 50, 75, 1000000, etc.
  copyFormatWithUnits: boolean;
  textScale: number; // 0.85 to 1.30, default 1.0
  activeTab: AppTab;
  isCommandPaletteOpen: boolean;
  isHistoryDrawerOpen: boolean;
}

export interface SettingsContextType extends SettingsState {
  setPrecisionDigits: (digits: number) => void;
  setDefaultImpedance: (impedance: number) => void;
  setCopyFormatWithUnits: (withUnits: boolean) => void;
  setTextScale: (scale: number) => void;
  setActiveTab: (tab: AppTab) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setHistoryDrawerOpen: (open: boolean) => void;
}

const SETTINGS_STORAGE_KEY = 'amo-units-settings';

const defaultSettings: SettingsState = {
  precisionDigits: 6,
  defaultImpedance: 50,
  copyFormatWithUnits: true,
  textScale: 1.0,
  activeTab: 'optical',
  isCommandPaletteOpen: false,
  isHistoryDrawerOpen: false
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsState>(() => {
    const validTabs: AppTab[] = ['optical', 'laser', 'rf', 'error-propagation', 'formulas'];
    const rawHash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    let activeTab: AppTab = 'optical';

    if (rawHash === 'presets') {
      activeTab = 'formulas';
    } else if (validTabs.includes(rawHash as AppTab)) {
      activeTab = rawHash as AppTab;
    } else if (rawHash === 'polarization' || rawHash === 'laser-polarization' || rawHash === 'abcd' || rawHash === 'laser-abcd') {
      activeTab = 'laser';
    } else if (rawHash === 'magnetic' || rawHash === 'zeeman') {
      if (typeof window !== 'undefined') {
        window.location.hash = '#optical';
      }
      activeTab = 'optical';
    }

    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!rawHash && parsed.activeTab) {
          if (parsed.activeTab === 'presets') {
            activeTab = 'formulas';
          } else if (validTabs.includes(parsed.activeTab)) {
            activeTab = parsed.activeTab;
          }
        }

        let textScale = defaultSettings.textScale;
        if (typeof parsed.textScale === 'number' && !isNaN(parsed.textScale) && parsed.textScale >= 0.7 && parsed.textScale <= 2.0) {
          textScale = parsed.textScale;
        }

        return {
          ...defaultSettings,
          ...parsed,
          textScale,
          activeTab
        };
      }
    } catch (e) {
      console.warn('Failed to parse settings from localStorage', e);
    }
    return {
      ...defaultSettings,
      activeTab
    };
  });

  // Keep URL hash in sync with activeTab
  useEffect(() => {
    const initialRawHash = window.location.hash.replace('#', '');
    if (initialRawHash === 'magnetic' || initialRawHash === 'zeeman') {
      window.location.hash = '#optical';
    }

    const handleHashChange = () => {
      const rawHash = window.location.hash.replace('#', '');
      const validTabs: AppTab[] = ['optical', 'laser', 'rf', 'error-propagation', 'formulas'];
      if (rawHash === 'presets') {
        setSettings(prev => ({ ...prev, activeTab: 'formulas' }));
        setTimeout(() => {
          document.getElementById('presets')?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      } else if (validTabs.includes(rawHash as AppTab)) {
        setSettings(prev => ({ ...prev, activeTab: rawHash as AppTab }));
      } else if (rawHash === 'polarization' || rawHash === 'laser-polarization' || rawHash === 'abcd' || rawHash === 'laser-abcd') {
        setSettings(prev => ({ ...prev, activeTab: 'laser' }));
      } else if (rawHash === 'magnetic' || rawHash === 'zeeman') {
        window.location.hash = '#optical';
        setSettings(prev => ({ ...prev, activeTab: 'optical' }));
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync text scaling to documentElement root font-size & CSS custom property
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const pxSize = 16 * settings.textScale;
      root.style.fontSize = `${pxSize}px`;
      root.style.setProperty('--app-font-scale', String(settings.textScale));
    }
  }, [settings.textScale]);

  useEffect(() => {
    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({
          precisionDigits: settings.precisionDigits,
          defaultImpedance: settings.defaultImpedance,
          copyFormatWithUnits: settings.copyFormatWithUnits,
          textScale: settings.textScale
        })
      );
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }
  }, [settings.precisionDigits, settings.defaultImpedance, settings.copyFormatWithUnits, settings.textScale]);

  const setPrecisionDigits = (digits: number) => {
    const clamped = Math.max(4, Math.min(10, digits));
    setSettings(prev => ({ ...prev, precisionDigits: clamped }));
  };

  const setDefaultImpedance = (impedance: number) => {
    setSettings(prev => ({ ...prev, defaultImpedance: impedance }));
  };

  const setCopyFormatWithUnits = (withUnits: boolean) => {
    setSettings(prev => ({ ...prev, copyFormatWithUnits: withUnits }));
  };

  const setTextScale = (scale: number) => {
    const val = Number(scale);
    if (!isNaN(val) && isFinite(val)) {
      const clamped = Math.max(0.7, Math.min(2.0, val));
      setSettings(prev => ({ ...prev, textScale: clamped }));
    }
  };

  const setActiveTab = (tab: AppTab) => {
    const targetTab = tab === 'presets' ? 'formulas' : tab;
    window.location.hash = `#${tab === 'presets' ? 'presets' : tab}`;
    setSettings(prev => ({ ...prev, activeTab: targetTab }));
    if (tab === 'presets') {
      setTimeout(() => {
        document.getElementById('presets')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const setCommandPaletteOpen = (open: boolean) => {
    setSettings(prev => ({ ...prev, isCommandPaletteOpen: open }));
  };

  const setHistoryDrawerOpen = (open: boolean) => {
    setSettings(prev => ({ ...prev, isHistoryDrawerOpen: open }));
  };

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setPrecisionDigits,
        setDefaultImpedance,
        setCopyFormatWithUnits,
        setTextScale,
        setActiveTab,
        setCommandPaletteOpen,
        setHistoryDrawerOpen
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
