import React, { createContext, useContext, useEffect, useState } from 'react';
import { HistoryEntry } from '../types/history';

interface HistoryContextType {
  history: HistoryEntry[];
  addEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  deleteEntry: (id: string) => void;
}

const HISTORY_STORAGE_KEY = 'amo-units-history';
const MAX_HISTORY_ITEMS = 30;

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse history from localStorage', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save history to localStorage', e);
    }
  }, [history]);

  const addEntry = (entryData: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: HistoryEntry = {
      ...entryData,
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now()
    };

    setHistory(prev => {
      // Don't add duplicate if same as most recent
      if (prev.length > 0) {
        const top = prev[0];
        if (
          top.category === newEntry.category &&
          top.sourceField === newEntry.sourceField &&
          top.sourceValue === newEntry.sourceValue
        ) {
          return prev;
        }
      }
      return [newEntry, ...prev].slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const deleteEntry = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <HistoryContext.Provider value={{ history, addEntry, clearHistory, deleteEntry }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = (): HistoryContextType => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};
