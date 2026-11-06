import React, { createContext, useContext, useEffect, useState } from 'react';
import { TransitionPreset } from '../types/presets';
import { DEFAULT_PRESETS } from '../constants/default-presets';
import { useUndoRedo } from './UndoRedoContext';

interface PresetContextType {
  allPresets: TransitionPreset[];
  defaultPresets: TransitionPreset[];
  customPresets: TransitionPreset[];
  appliedPreset: TransitionPreset | null;
  applyPreset: (preset: TransitionPreset) => void;
  addCustomPreset: (preset: Omit<TransitionPreset, 'id' | 'isCustom' | 'createdAt'>) => TransitionPreset;
  updateCustomPreset: (preset: TransitionPreset) => void;
  deleteCustomPreset: (id: string) => void;
  exportPresetsAsJson: () => string;
  importPresetsFromJson: (jsonStr: string) => { success: boolean; count: number; error?: string };
}

const CUSTOM_PRESETS_STORAGE_KEY = 'amo-units-custom-presets';
const LAST_APPLIED_PRESET_ID_KEY = 'amo-units-last-applied-preset-id';

const PresetContext = createContext<PresetContextType | undefined>(undefined);

export const PresetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customPresets, setCustomPresets] = useState<TransitionPreset[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load custom presets from localStorage', e);
    }
    return [];
  });

  const [appliedPreset, setAppliedPreset] = useState<TransitionPreset | null>(() => {
    try {
      const savedId = localStorage.getItem(LAST_APPLIED_PRESET_ID_KEY);
      if (savedId) {
        const savedCustom = localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY);
        const parsedCustom: TransitionPreset[] = savedCustom ? JSON.parse(savedCustom) : [];
        const found = [...DEFAULT_PRESETS, ...parsedCustom].find(p => p.id === savedId);
        if (found) {
          return found;
        }
      }
    } catch (e) {
      console.warn('Failed to load last applied preset from localStorage', e);
    }
    return DEFAULT_PRESETS[0];
  });

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(customPresets));
    } catch (e) {
      console.warn('Failed to save custom presets to localStorage', e);
    }
  }, [customPresets]);

  const { recordAction } = useUndoRedo();
  const allPresets = [...DEFAULT_PRESETS, ...customPresets];

  const applyPreset = (preset: TransitionPreset) => {
    const prevPreset = appliedPreset;
    setAppliedPreset({ ...preset });
    try {
      localStorage.setItem(LAST_APPLIED_PRESET_ID_KEY, preset.id);
    } catch (e) {
      console.warn('Failed to save applied preset id to localStorage', e);
    }
    recordAction({
      description: `Apply Preset: ${preset.name}`,
      category: 'optical',
      undo: () => {
        setAppliedPreset(prevPreset ? { ...prevPreset } : null);
        try {
          if (prevPreset) {
            localStorage.setItem(LAST_APPLIED_PRESET_ID_KEY, prevPreset.id);
          } else {
            localStorage.removeItem(LAST_APPLIED_PRESET_ID_KEY);
          }
        } catch {}
      },
      redo: () => {
        setAppliedPreset({ ...preset });
        try {
          localStorage.setItem(LAST_APPLIED_PRESET_ID_KEY, preset.id);
        } catch {}
      }
    });
  };

  const addCustomPreset = (data: Omit<TransitionPreset, 'id' | 'isCustom' | 'createdAt'>): TransitionPreset => {
    const newPreset: TransitionPreset = {
      ...data,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      isCustom: true,
      category: 'custom',
      createdAt: new Date().toISOString()
    };

    setCustomPresets(prev => [newPreset, ...prev]);
    recordAction({
      description: `Create Custom Preset: ${newPreset.name}`,
      category: 'optical',
      targetTab: 'formulas',
      undo: () => {
        setCustomPresets(prev => prev.filter(p => p.id !== newPreset.id));
      },
      redo: () => {
        setCustomPresets(prev => [newPreset, ...prev]);
      }
    });
    return newPreset;
  };

  const updateCustomPreset = (updated: TransitionPreset) => {
    setCustomPresets(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  const deleteCustomPreset = (id: string) => {
    const presetToDelete = customPresets.find(p => p.id === id);
    if (!presetToDelete) return;
    setCustomPresets(prev => prev.filter(p => p.id !== id));
    if (appliedPreset?.id === id) {
      setAppliedPreset({ ...DEFAULT_PRESETS[0] });
      try {
        localStorage.setItem(LAST_APPLIED_PRESET_ID_KEY, DEFAULT_PRESETS[0].id);
      } catch {}
    }
    recordAction({
      description: `Delete Preset: ${presetToDelete.name}`,
      category: 'optical',
      undo: () => {
        setCustomPresets(prev => [presetToDelete, ...prev]);
      },
      redo: () => {
        setCustomPresets(prev => prev.filter(p => p.id !== id));
      }
    });
  };

  const exportPresetsAsJson = (): string => {
    return JSON.stringify(customPresets, null, 2);
  };

  const importPresetsFromJson = (jsonStr: string): { success: boolean; count: number; error?: string } => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) {
        return { success: false, count: 0, error: 'JSON content must be an array of presets' };
      }

      const validPresets: TransitionPreset[] = [];
      for (const item of parsed) {
        if (item && item.name && typeof item.wavelengthNm === 'number') {
          validPresets.push({
            ...item,
            id: item.id || `custom-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            isCustom: true,
            category: 'custom'
          });
        }
      }

      setCustomPresets(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const filteredNew = validPresets.filter(p => !existingIds.has(p.id));
        return [...filteredNew, ...prev];
      });

      return { success: true, count: validPresets.length };
    } catch (err: any) {
      return { success: false, count: 0, error: err.message || 'Invalid JSON format' };
    }
  };

  return (
    <PresetContext.Provider
      value={{
        allPresets,
        defaultPresets: DEFAULT_PRESETS,
        customPresets,
        appliedPreset,
        applyPreset,
        addCustomPreset,
        updateCustomPreset,
        deleteCustomPreset,
        exportPresetsAsJson,
        importPresetsFromJson
      }}
    >
      {children}
    </PresetContext.Provider>
  );
};

export const usePresets = (): PresetContextType => {
  const context = useContext(PresetContext);
  if (!context) {
    throw new Error('usePresets must be used within a PresetProvider');
  }
  return context;
};
