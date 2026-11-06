import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { PresetProvider } from './context/PresetContext';
import { HistoryProvider } from './context/HistoryContext';
import { UndoRedoProvider } from './context/UndoRedoContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

import { Header } from './components/layout/Header';
import { TabNavigation } from './components/layout/TabNavigation';
import { Footer } from './components/layout/Footer';

import { OpticalConverter } from './components/modules/OpticalConverter';
import { LaserBeamConverter } from './components/modules/LaserBeamConverter';
import { RfElectronicsConverter } from './components/modules/RfElectronicsConverter';
import { ErrorPropagationView } from './components/modules/ErrorPropagationView';
import { FormulaInspectorView } from './components/modules/FormulaInspectorView';

import { CommandPalette } from './components/productivity/CommandPalette';
import { HistoryDrawer } from './components/productivity/HistoryDrawer';

const AppContent: React.FC = () => {
  const { activeTab } = useSettings();
  useKeyboardShortcuts();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <TabNavigation />

      <main
        className="container"
        style={{
          flex: 1,
          paddingTop: 'var(--space-lg)',
          paddingBottom: 'var(--space-2xl)'
        }}
      >
        {/* Tab 1: Optical & Energy */}
        <div
          className={activeTab === 'optical' ? 'animate-fade-in' : ''}
          style={{ display: activeTab === 'optical' ? 'block' : 'none' }}
        >
          <OpticalConverter />
        </div>

        {/* Tab 2: Laser Beam (ABCD & Polarization) */}
        <div
          className={activeTab === 'laser' ? 'animate-fade-in' : ''}
          style={{ display: activeTab === 'laser' ? 'block' : 'none' }}
        >
          <LaserBeamConverter />
        </div>

        {/* Tab 3: RF Electronics */}
        <div
          className={activeTab === 'rf' ? 'animate-fade-in' : ''}
          style={{ display: activeTab === 'rf' ? 'block' : 'none' }}
        >
          <RfElectronicsConverter />
        </div>

        {/* Tab 4: Error Propagation */}
        <div
          className={activeTab === 'error-propagation' ? 'animate-fade-in' : ''}
          style={{ display: activeTab === 'error-propagation' ? 'block' : 'none' }}
        >
          <ErrorPropagationView />
        </div>

        {/* Tab 5: Formulas & Presets */}
        <div
          className={(activeTab === 'formulas' || activeTab === 'presets') ? 'animate-fade-in' : ''}
          style={{ display: (activeTab === 'formulas' || activeTab === 'presets') ? 'block' : 'none' }}
        >
          <FormulaInspectorView />
        </div>
      </main>

      <Footer />
      <CommandPalette />
      <HistoryDrawer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <UndoRedoProvider>
          <PresetProvider>
            <HistoryProvider>
              <AppContent />
            </HistoryProvider>
          </PresetProvider>
        </UndoRedoProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
};

export default App;
