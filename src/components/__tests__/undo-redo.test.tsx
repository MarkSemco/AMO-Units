import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';
import { UndoRedoProvider, useUndoRedo } from '../../context/UndoRedoContext';
import { SettingsProvider } from '../../context/SettingsContext';
import { PresetProvider, usePresets } from '../../context/PresetContext';
import { Header } from '../layout/Header';
import { SyncedInput } from '../common/SyncedInput';
import { SmithChart } from '../modules/SmithChart';
import { ZeemanConverter } from '../modules/ZeemanConverter';
import { HistoryProvider } from '../../context/HistoryContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

describe('Global Undo/Redo Architecture & Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <SettingsProvider>
      <UndoRedoProvider>
        <PresetProvider>
          <HistoryProvider>
            {children}
          </HistoryProvider>
        </PresetProvider>
      </UndoRedoProvider>
    </SettingsProvider>
  );

  describe('UndoRedoContext State & Stack Management', () => {
    it('manages undo and redo stacks in strict LIFO order', () => {
      const { result } = renderHook(() => useUndoRedo(), { wrapper: TestWrapper });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);

      let counter = 0;
      act(() => {
        result.current.recordAction({
          description: 'Increment to 1',
          undo: () => { counter -= 1; },
          redo: () => { counter += 1; }
        });
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.undoDescription).toBe('Increment to 1');

      act(() => {
        result.current.recordAction({
          description: 'Increment to 2',
          undo: () => { counter -= 1; },
          redo: () => { counter += 1; }
        });
      });

      expect(result.current.undoDescription).toBe('Increment to 2');

      // Undo the last action
      act(() => {
        const success = result.current.undo();
        expect(success).toBe(true);
      });

      expect(counter).toBe(-1);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);
      expect(result.current.redoDescription).toBe('Increment to 2');
      expect(result.current.undoDescription).toBe('Increment to 1');

      // Redo the action
      act(() => {
        const success = result.current.redo();
        expect(success).toBe(true);
      });

      expect(counter).toBe(0);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('clears redo stack when a new action is recorded after an undo', () => {
      const { result } = renderHook(() => useUndoRedo(), { wrapper: TestWrapper });

      act(() => {
        result.current.recordAction({
          description: 'Action 1',
          undo: vi.fn(),
          redo: vi.fn()
        });
        result.current.recordAction({
          description: 'Action 2',
          undo: vi.fn(),
          redo: vi.fn()
        });
      });

      // Undo Action 2
      act(() => {
        result.current.undo();
      });
      expect(result.current.canRedo).toBe(true);

      // Record a new Action 3 -> redo stack must be cleared
      act(() => {
        result.current.recordAction({
          description: 'Action 3',
          undo: vi.fn(),
          redo: vi.fn()
        });
      });

      expect(result.current.canRedo).toBe(false);
      expect(result.current.redoStack).toHaveLength(0);
      expect(result.current.undoDescription).toBe('Action 3');
    });

    it('enforces a maximum stack size of 50 actions by dropping the oldest', () => {
      const { result } = renderHook(() => useUndoRedo(), { wrapper: TestWrapper });

      act(() => {
        for (let i = 1; i <= 55; i++) {
          result.current.recordAction({
            description: `Action ${i}`,
            undo: vi.fn(),
            redo: vi.fn()
          });
        }
      });

      expect(result.current.undoStack).toHaveLength(50);
      // Oldest remaining item should be Action 6
      expect(result.current.undoStack[0].description).toBe('Action 6');
      expect(result.current.undoStack[49].description).toBe('Action 55');
    });

    it('clears all history when clearHistory is called', () => {
      const { result } = renderHook(() => useUndoRedo(), { wrapper: TestWrapper });

      act(() => {
        result.current.recordAction({ description: 'Action 1', undo: vi.fn(), redo: vi.fn() });
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.undoStack).toHaveLength(0);
      expect(result.current.redoStack).toHaveLength(0);
    });

    it('displays toast HUD notification on undo and auto-dismisses after timer', () => {
      const TestConsumer = () => {
        const { recordAction, undo } = useUndoRedo();
        return (
          <div>
            <button
              onClick={() =>
                recordAction({
                  description: 'Change Laser Power',
                  category: 'rf',
                  undo: vi.fn(),
                  redo: vi.fn()
                })
              }
            >
              Do Action
            </button>
            <button onClick={() => undo()}>Undo Action</button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestConsumer />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Do Action'));
      fireEvent.click(screen.getByText('Undo Action'));

      expect(screen.getByText('Undid: Change Laser Power')).toBeInTheDocument();

      // Fast-forward past toast duration (2500ms)
      act(() => {
        vi.advanceTimersByTime(2600);
      });

      expect(screen.queryByText('Undid: Change Laser Power')).not.toBeInTheDocument();
    });
  });

  describe('Header Undo / Redo Toolbar Buttons', () => {
    it('renders disabled buttons initially and enables them as actions occur', () => {
      const TestConsumer = () => {
        const { recordAction } = useUndoRedo();
        return (
          <div>
            <Header />
            <button
              onClick={() =>
                recordAction({
                  description: 'Tune Cavity Length',
                  category: 'laser',
                  undo: vi.fn(),
                  redo: vi.fn()
                })
              }
            >
              Record Action
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestConsumer />
        </TestWrapper>
      );

      const undoBtn = screen.getByRole('button', { name: /Undo last action/i });
      const redoBtn = screen.getByRole('button', { name: /Redo last undone action/i });

      expect(undoBtn).toBeDisabled();
      expect(redoBtn).toBeDisabled();

      // Record an action
      fireEvent.click(screen.getByText('Record Action'));

      expect(undoBtn).not.toBeDisabled();
      expect(undoBtn).toHaveAttribute('title', expect.stringContaining('Tune Cavity Length'));
      expect(redoBtn).toBeDisabled();

      // Click Undo
      fireEvent.click(undoBtn);

      expect(undoBtn).toBeDisabled();
      expect(redoBtn).not.toBeDisabled();
      expect(redoBtn).toHaveAttribute('title', expect.stringContaining('Tune Cavity Length'));

      // Click Redo
      fireEvent.click(redoBtn);

      expect(undoBtn).not.toBeDisabled();
      expect(redoBtn).toBeDisabled();
    });
  });

  describe('Keyboard Shortcuts Handler', () => {
    const ShortcutHarness = () => {
      useKeyboardShortcuts();
      const { recordAction } = useUndoRedo();
      return (
        <div>
          <button
            onClick={() =>
              recordAction({
                description: 'Adjust frequency',
                undo: vi.fn(),
                redo: vi.fn()
              })
            }
          >
            Add Action
          </button>
        </div>
      );
    };

    it('triggers undo on Cmd+Z and Ctrl+Z', () => {
      render(
        <TestWrapper>
          <ShortcutHarness />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Add Action'));

      // Simulate Cmd+Z
      fireEvent.keyDown(window, { key: 'z', metaKey: true });
      expect(screen.getByText('Undid: Adjust frequency')).toBeInTheDocument();

      // Redo via Shift+Cmd+Z
      fireEvent.keyDown(window, { key: 'z', metaKey: true, shiftKey: true });
      expect(screen.getByText('Redid: Adjust frequency')).toBeInTheDocument();

      // Undo via Ctrl+Z
      fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
      expect(screen.getByText('Undid: Adjust frequency')).toBeInTheDocument();

      // Redo via Ctrl+Y
      fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
      expect(screen.getByText('Redid: Adjust frequency')).toBeInTheDocument();
    });
  });

  describe('SyncedInput Focus-to-Blur & Stepper Undo Recording', () => {
    const InputHarness = () => {
      useKeyboardShortcuts();
      const [val, setVal] = useState('100');
      const { recordAction } = useUndoRedo();

      return (
        <SyncedInput
          id="test-synced"
          label="Power"
          value={val}
          unit="mW"
          category="rf"
          onChange={setVal}
          onCommit={(prev, next) => {
            recordAction({
              description: `Power: ${prev} -> ${next} mW`,
              category: 'rf',
              undo: () => setVal(prev),
              redo: () => setVal(next)
            });
          }}
        />
      );
    };

    it('does not record undo step while typing, only records single step on blur', () => {
      render(
        <TestWrapper>
          <InputHarness />
        </TestWrapper>
      );

      const input = screen.getByRole('textbox', { name: /Power/i });
      expect(input).toHaveValue('100');

      // Focus and type '10', '105', '105.5'
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '10' } });
      fireEvent.change(input, { target: { value: '105' } });
      fireEvent.change(input, { target: { value: '105.5' } });

      // No toast yet because user is still typing
      expect(screen.queryByText(/Undid/i)).not.toBeInTheDocument();

      // Blur input -> commits action
      fireEvent.blur(input);

      // Trigger global undo via shortcut
      fireEvent.keyDown(window, { key: 'z', metaKey: true });

      expect(input).toHaveValue('100');
      expect(screen.getByText('Undid: Power: 100 -> 105.5 mW')).toBeInTheDocument();

      // Redo restores new value
      fireEvent.keyDown(window, { key: 'z', metaKey: true, shiftKey: true });
      expect(input).toHaveValue('105.5');
    });

    it('reverts local draft when user presses Cmd+Z inside an active focused input', () => {
      render(
        <TestWrapper>
          <InputHarness />
        </TestWrapper>
      );

      const input = screen.getByRole('textbox', { name: /Power/i });

      // Focus input (initial value: '100')
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '999' } });
      expect(input).toHaveValue('999');

      // Press Cmd+Z inside input -> should revert draft to focused '100' without triggering global undo
      fireEvent.keyDown(input, { key: 'z', metaKey: true });
      expect(input).toHaveValue('100');

      // No toast should appear
      expect(screen.queryByText(/Undid/i)).not.toBeInTheDocument();
    });

    it('prevents double-undo and retains global undo stack when reverting in-input draft', () => {
      let recordedCount = 0;
      const InputWithHistoryHarness = () => {
        useKeyboardShortcuts();
        const [p, setP] = useState('100');
        const { recordAction } = useUndoRedo();

        return (
          <div>
            <button
              onClick={() => {
                recordAction({
                  description: 'External Global Action',
                  category: 'optical',
                  undo: () => { recordedCount -= 1; },
                  redo: () => { recordedCount += 1; }
                });
                recordedCount += 1;
              }}
            >
              Do Global Action
            </button>
            <SyncedInput
              id="power-history-input"
              label="Power"
              value={p}
              unit="mW"
              category="optical"
              onChange={setP}
              onCommit={(prev, next) => {
                recordAction({
                  description: `Power: ${prev} -> ${next} mW`,
                  category: 'optical',
                  undo: () => setP(prev),
                  redo: () => setP(next)
                });
              }}
            />
          </div>
        );
      };

      render(
        <TestWrapper>
          <InputWithHistoryHarness />
        </TestWrapper>
      );

      // Record a global action first
      fireEvent.click(screen.getByText('Do Global Action'));
      expect(recordedCount).toBe(1);

      const input = screen.getByRole('textbox', { name: /Power/i });
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '999' } });
      expect(input).toHaveValue('999');

      // Press Cmd+Z while in input: should ONLY revert draft to 100, NOT pop the global action!
      fireEvent.keyDown(input, { key: 'z', metaKey: true });
      expect(input).toHaveValue('100');
      expect(recordedCount).toBe(1); // Global action was NOT undone!
      expect(screen.queryByText(/Undid: External Global Action/i)).not.toBeInTheDocument();

      // Test in-input Redo: Shift+Cmd+Z inside input restores '999'
      fireEvent.keyDown(input, { key: 'z', metaKey: true, shiftKey: true });
      expect(input).toHaveValue('999');

      // Revert back to 100
      fireEvent.keyDown(input, { key: 'z', metaKey: true });
      expect(input).toHaveValue('100');

      // Second Cmd+Z (now draft matches initial value): bubbles to window and DOES undo the global action!
      fireEvent.keyDown(input, { key: 'z', metaKey: true });
      expect(recordedCount).toBe(0); // Global action undone!
    });

    it('commits value on Enter key press', () => {
      render(
        <TestWrapper>
          <InputHarness />
        </TestWrapper>
      );

      const input = screen.getByRole('textbox', { name: /Power/i });
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '250' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      // Blur to ensure committed
      fireEvent.blur(input);

      // Undo should revert to 100
      fireEvent.keyDown(window, { key: 'z', metaKey: true });
      expect(input).toHaveValue('100');
    });
  });

  describe('SmithChart Pointer Drag & Commit Undo', () => {
    it('commits impedance only on pointerup and supports undoing drag movements', () => {
      const ChartHarness = () => {
        useKeyboardShortcuts();
        const [z, setZ] = useState({ r: 50, x: 0 });
        const { recordAction } = useUndoRedo();

        return (
          <div>
            <div data-testid="current-z">{`${z.r}+${z.x}j`}</div>
            <SmithChart
              rOhms={z.r}
              xOhms={z.x}
              z0={50}
              onImpedanceChange={(r, x) => setZ({ r, x })}
              onImpedanceCommit={(prevR, prevX, nextR, nextX) => {
                recordAction({
                  description: `Impedance: (${prevR}+${prevX}j) -> (${nextR}+${nextX}j)`,
                  category: 'rf',
                  undo: () => setZ({ r: prevR, x: prevX }),
                  redo: () => setZ({ r: nextR, x: nextX })
                });
              }}
            />
          </div>
        );
      };

      const { container } = render(
        <TestWrapper>
          <ChartHarness />
        </TestWrapper>
      );

      expect(screen.getByTestId('current-z')).toHaveTextContent('50+0j');

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();

      // Mock bounding client rect
      svg!.getBoundingClientRect = () => ({
        width: 380,
        height: 380,
        top: 0,
        left: 0,
        bottom: 380,
        right: 380,
        x: 0,
        y: 0,
        toJSON: () => {}
      });

      // Pointer down at center
      fireEvent.pointerDown(svg!, { clientX: 190, clientY: 190, pointerId: 1 });

      // Pointer move to another point
      fireEvent.pointerMove(svg!, { clientX: 230, clientY: 150 });

      // Pointer up -> commits action
      fireEvent.pointerUp(svg!, { pointerId: 1 });

      const movedZ = screen.getByTestId('current-z').textContent;
      expect(movedZ).not.toBe('50+0j');

      // Undo restores 50+0j
      fireEvent.keyDown(window, { key: 'z', metaKey: true });
      expect(screen.getByTestId('current-z')).toHaveTextContent('50+0j');

      // Redo restores moved impedance
      fireEvent.keyDown(window, { key: 'z', metaKey: true, shiftKey: true });
      expect(screen.getByTestId('current-z')).toHaveTextContent(movedZ!);
    });
  });

  describe('PresetContext Application Undo', () => {
    it('allows undoing a preset application to restore previous transition preset', () => {
      const PresetHarness = () => {
        useKeyboardShortcuts();
        const { appliedPreset, applyPreset } = usePresets();
        return (
          <div>
            <div data-testid="active-preset">{appliedPreset ? appliedPreset.name : 'None'}</div>
            <button
              onClick={() =>
                applyPreset({
                  id: 'test-preset',
                  name: 'Custom CaF Transition',
                  species: 'CaF',
                  transitionName: 'B -> X',
                  category: 'molecular',
                  wavelengthNm: 606.3,
                  isCustom: true
                })
              }
            >
              Apply Preset
            </button>
          </div>
        );
      };

      render(
        <SettingsProvider>
          <UndoRedoProvider>
            <PresetProvider>
              <PresetHarness />
            </PresetProvider>
          </UndoRedoProvider>
        </SettingsProvider>
      );

      const initialPreset = screen.getByTestId('active-preset').textContent;
      expect(initialPreset).toBeTruthy();

      // Apply preset
      fireEvent.click(screen.getByText('Apply Preset'));
      expect(screen.getByTestId('active-preset')).toHaveTextContent('Custom CaF Transition');

      // Undo preset application
      fireEvent.keyDown(window, { key: 'z', metaKey: true });
      expect(screen.getByTestId('active-preset')).toHaveTextContent(initialPreset!);

      // Redo preset application
      fireEvent.keyDown(window, { key: 'z', metaKey: true, shiftKey: true });
      expect(screen.getByTestId('active-preset')).toHaveTextContent('Custom CaF Transition');
    });

    it('allows undoing and redoing custom preset addition and deletion', () => {
      const CustomPresetHarness = () => {
        useKeyboardShortcuts();
        const { customPresets, addCustomPreset, deleteCustomPreset } = usePresets();
        return (
          <div>
            <div data-testid="custom-count">{customPresets.length}</div>
            <button
              onClick={() =>
                addCustomPreset({
                  name: 'My Lab Laser',
                  species: 'Rb',
                  transitionName: 'D2 Line',
                  category: 'alkali',
                  wavelengthNm: 780.241
                })
              }
            >
              Add Preset
            </button>
            {customPresets.length > 0 && (
              <button onClick={() => deleteCustomPreset(customPresets[0].id)}>
                Delete First
              </button>
            )}
          </div>
        );
      };

      render(
        <TestWrapper>
          <CustomPresetHarness />
        </TestWrapper>
      );

      expect(screen.getByTestId('custom-count')).toHaveTextContent('0');

      // Add preset
      fireEvent.click(screen.getByText('Add Preset'));
      expect(screen.getByTestId('custom-count')).toHaveTextContent('1');

      // Undo addition -> should remove from customPresets
      fireEvent.keyDown(window, { key: 'z', metaKey: true });
      expect(screen.getByTestId('custom-count')).toHaveTextContent('0');

      // Redo addition -> should re-add
      fireEvent.keyDown(window, { key: 'z', metaKey: true, shiftKey: true });
      expect(screen.getByTestId('custom-count')).toHaveTextContent('1');

      // Delete preset
      fireEvent.click(screen.getByText('Delete First'));
      expect(screen.getByTestId('custom-count')).toHaveTextContent('0');

      // Undo deletion -> should restore
      fireEvent.keyDown(window, { key: 'z', metaKey: true });
      expect(screen.getByTestId('custom-count')).toHaveTextContent('1');

      // Redo deletion -> should remove again
      fireEvent.keyDown(window, { key: 'z', metaKey: true, shiftKey: true });
      expect(screen.getByTestId('custom-count')).toHaveTextContent('0');
    });
  });

  describe('ZeemanConverter Undo/Redo Integration', () => {
    it('supports undoing and redoing quick preset configurations', () => {
      const ZeemanHarness = () => {
        useKeyboardShortcuts();
        return <ZeemanConverter />;
      };

      render(
        <TestWrapper>
          <ZeemanHarness />
        </TestWrapper>
      );

      // Verify initial field input exists
      const fieldInput = screen.getByRole('textbox', { name: /Magnetic Field/i });
      expect(fieldInput).toBeInTheDocument();

      // Click Free Electron preset button
      const freeElectronBtn = screen.getByRole('button', { name: /Free Electron/i });
      fireEvent.click(freeElectronBtn);

      const gFactorInput = screen.getByLabelText(/Landé g-factor/i);
      expect(gFactorInput).toHaveValue('2.002319');

      // Undo preset selection
      fireEvent.keyDown(window, { key: 'z', metaKey: true });
      expect(gFactorInput).toHaveValue('1');

      // Redo preset selection
      fireEvent.keyDown(window, { key: 'z', metaKey: true, shiftKey: true });
      expect(gFactorInput).toHaveValue('2.002319');
    });
  });
});
