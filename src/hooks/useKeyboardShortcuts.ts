import { useEffect } from 'react';
import { useSettings, AppTab } from '../context/SettingsContext';
import { useUndoRedo } from '../context/UndoRedoContext';

const TAB_INDEX_MAP: Record<string, AppTab> = {
  '1': 'optical',
  '2': 'laser',
  '3': 'rf',
  '4': 'error-propagation',
  '5': 'formulas',
  '6': 'formulas'
};

export function useKeyboardShortcuts() {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    isHistoryDrawerOpen,
    setHistoryDrawerOpen,
    setActiveTab
  } = useSettings();
  const { undo, redo } = useUndoRedo();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement | null;
      const isInputOrTextArea = Boolean(
        target &&
        typeof (target as any).getAttribute === 'function' &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      );

      const isSyncedInput = Boolean(
        isInputOrTextArea && (target as any).getAttribute('data-synced-input') === 'true'
      );

      // Undo: Cmd+Z or Ctrl+Z (without Shift)
      if (isCmdOrCtrl && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        // If typing in a standard text input/textarea (and not a SyncedInput that bubbled),
        // let the browser handle native text editing undo!
        if (isInputOrTextArea && !isSyncedInput) {
          return;
        }
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Cmd+Shift+Z, Ctrl+Shift+Z, Cmd+Y, or Ctrl+Y
      if (
        (isCmdOrCtrl && e.shiftKey && (e.key === 'z' || e.key === 'Z')) ||
        (isCmdOrCtrl && (e.key === 'y' || e.key === 'Y'))
      ) {
        if (isInputOrTextArea && !isSyncedInput) {
          return;
        }
        e.preventDefault();
        redo();
        return;
      }

      // Cmd+K or Ctrl+K -> Command Palette
      if (isCmdOrCtrl && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
        return;
      }

      // Cmd+H or Ctrl+H -> History Drawer
      if (isCmdOrCtrl && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setHistoryDrawerOpen(!isHistoryDrawerOpen);
        return;
      }

      // Esc -> Close active overlays
      if (e.key === 'Escape') {
        if (isCommandPaletteOpen) {
          e.preventDefault();
          setCommandPaletteOpen(false);
          return;
        }
        if (isHistoryDrawerOpen) {
          e.preventDefault();
          setHistoryDrawerOpen(false);
          return;
        }
      }

      // Quick tab switching 1-6 when not typing inside an input or textarea
      const isTyping = isInputOrTextArea;

      if (!isTyping && !isCmdOrCtrl && !e.altKey && !e.shiftKey) {
        if (TAB_INDEX_MAP[e.key]) {
          e.preventDefault();
          setActiveTab(TAB_INDEX_MAP[e.key]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    isHistoryDrawerOpen,
    setHistoryDrawerOpen,
    setActiveTab,
    undo,
    redo
  ]);
}
