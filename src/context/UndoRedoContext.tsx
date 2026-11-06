import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { Undo2, Redo2, X } from 'lucide-react';
import { CategoryColor } from '../types/units';
import { AppTab, useSettings } from './SettingsContext';

export interface UndoAction {
  id: string;
  description: string;
  category?: CategoryColor | 'general';
  targetTab?: AppTab;
  undo: () => void;
  redo: () => void;
  timestamp: number;
}

export interface UndoRedoContextType {
  canUndo: boolean;
  canRedo: boolean;
  undoDescription?: string;
  redoDescription?: string;
  recordAction: (action: Omit<UndoAction, 'id' | 'timestamp'>) => void;
  undo: () => boolean;
  redo: () => boolean;
  clearHistory: () => void;
  undoStack: UndoAction[];
  redoStack: UndoAction[];
}

interface ToastState {
  id: number;
  message: string;
  category: CategoryColor | 'general';
  type: 'undo' | 'redo';
  isVisible: boolean;
}

const MAX_STACK_SIZE = 50;

const UndoRedoContext = createContext<UndoRedoContextType | undefined>(undefined);

export const UndoRedoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTab, setActiveTab } = useSettings();

  const undoStackRef = useRef<UndoAction[]>([]);
  const redoStackRef = useRef<UndoAction[]>([]);
  const isExecutingRef = useRef<boolean>(false);
  const toastCountRef = useRef<number>(0);

  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  const [undoDescription, setUndoDescription] = useState<string | undefined>(undefined);
  const [redoDescription, setRedoDescription] = useState<string | undefined>(undefined);

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateState = useCallback(() => {
    const uLen = undoStackRef.current.length;
    const rLen = redoStackRef.current.length;
    setCanUndo(uLen > 0);
    setCanRedo(rLen > 0);
    setUndoDescription(uLen > 0 ? undoStackRef.current[uLen - 1].description : undefined);
    setRedoDescription(rLen > 0 ? redoStackRef.current[rLen - 1].description : undefined);
  }, []);

  const showToast = useCallback((message: string, category: CategoryColor | 'general', type: 'undo' | 'redo') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastCountRef.current += 1;
    setToast({
      id: toastCountRef.current,
      message,
      category,
      type,
      isVisible: true
    });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => (prev ? { ...prev, isVisible: false } : null));
    }, 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const recordAction = useCallback(
    (actionData: Omit<UndoAction, 'id' | 'timestamp'>) => {
      // If an undo or redo operation is currently in progress (e.g. activeElement.blur() triggered),
      // do not record new actions or clear the redo stack!
      if (isExecutingRef.current) {
        return;
      }

      const fullAction: UndoAction = {
        ...actionData,
        id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: Date.now()
      };

      // Push to undo stack, cap at MAX_STACK_SIZE
      const stack = undoStackRef.current;
      stack.push(fullAction);
      if (stack.length > MAX_STACK_SIZE) {
        stack.shift();
      }

      // Any new recorded action clears the redo stack
      redoStackRef.current = [];
      updateState();
    },
    [updateState]
  );

  const undo = useCallback((): boolean => {
    isExecutingRef.current = true;
    try {
      // Blur any focused element before applying undo to ensure inputs flush/reset drafts
      if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      const action = undoStackRef.current.pop();
      if (!action) {
        updateState();
        return false;
      }

      action.undo();
      redoStackRef.current.push(action);
      updateState();

      // If action belongs to a specific tab and the user is on a different tab, switch to show change
      if (action.targetTab && action.targetTab !== activeTab) {
        setActiveTab(action.targetTab);
      }

      showToast(`Undid: ${action.description}`, action.category || 'general', 'undo');
      return true;
    } catch (err) {
      console.error('Error during undo operation:', err);
      updateState();
      return false;
    } finally {
      isExecutingRef.current = false;
    }
  }, [activeTab, setActiveTab, showToast, updateState]);

  const redo = useCallback((): boolean => {
    isExecutingRef.current = true;
    try {
      // Blur any focused element before applying redo
      if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      const action = redoStackRef.current.pop();
      if (!action) {
        updateState();
        return false;
      }

      action.redo();
      undoStackRef.current.push(action);
      updateState();

      if (action.targetTab && action.targetTab !== activeTab) {
        setActiveTab(action.targetTab);
      }

      showToast(`Redid: ${action.description}`, action.category || 'general', 'redo');
      return true;
    } catch (err) {
      console.error('Error during redo operation:', err);
      updateState();
      return false;
    } finally {
      isExecutingRef.current = false;
    }
  }, [activeTab, setActiveTab, showToast, updateState]);

  const clearHistory = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    updateState();
  }, [updateState]);

  const categoryColor = toast?.category && toast.category !== 'general'
    ? `var(--color-${toast.category})`
    : 'var(--color-primary-accent)';

  return (
    <UndoRedoContext.Provider
      value={{
        canUndo,
        canRedo,
        undoDescription,
        redoDescription,
        recordAction,
        undo,
        redo,
        clearHistory,
        undoStack: undoStackRef.current,
        redoStack: redoStackRef.current
      }}
    >
      {children}

      {/* Floating Undo/Redo HUD Notification */}
      {toast && toast.isVisible && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--color-bg-surface-elevated)',
            color: 'var(--color-text-primary)',
            border: `1.5px solid ${categoryColor}`,
            boxShadow: `0 8px 24px rgba(0, 0, 0, 0.4), 0 0 12px ${categoryColor}33`,
            borderRadius: 'var(--radius-md)',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-medium)',
            zIndex: 9999,
            maxWidth: '90vw',
            animation: 'fadeIn 150ms ease-out'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--color-bg-base)',
              color: categoryColor
            }}
          >
            {toast.type === 'undo' ? <Undo2 size={14} /> : <Redo2 size={14} />}
          </div>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {toast.message}
          </span>
          <button
            onClick={() => {
              if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
              }
              setToast(prev => (prev ? { ...prev, isVisible: false } : null));
            }}
            aria-label="Dismiss notification"
            style={{
              padding: '2px',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </UndoRedoContext.Provider>
  );
};

const noopContext: UndoRedoContextType = {
  canUndo: false,
  canRedo: false,
  undoDescription: undefined,
  redoDescription: undefined,
  recordAction: () => {},
  undo: () => false,
  redo: () => false,
  clearHistory: () => {},
  undoStack: [],
  redoStack: []
};

export const useUndoRedo = (): UndoRedoContextType => {
  const context = useContext(UndoRedoContext);
  return context ?? noopContext;
};
