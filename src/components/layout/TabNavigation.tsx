import React from 'react';
import {
  Lightbulb,
  Zap,
  Radio,
  Sigma,
  BookOpen
} from 'lucide-react';
import { useSettings, AppTab } from '../../context/SettingsContext';
import { CategoryColor } from '../../types/units';

interface TabItem {
  id: AppTab;
  label: string;
  shortLabel: string;
  category: CategoryColor;
  icon: React.ReactNode;
  shortcut: string;
}

const TABS: TabItem[] = [
  {
    id: 'optical',
    label: 'Optical & Energy',
    shortLabel: 'Optical',
    category: 'optical',
    icon: <Lightbulb size={18} />,
    shortcut: '1'
  },
  {
    id: 'laser',
    label: 'Laser Beam',
    shortLabel: 'Laser',
    category: 'laser',
    icon: <Zap size={18} />,
    shortcut: '2'
  },
  {
    id: 'rf',
    label: 'RF Electronics',
    shortLabel: 'RF',
    category: 'rf',
    icon: <Radio size={18} />,
    shortcut: '3'
  },
  {
    id: 'error-propagation',
    label: 'Error Propagation',
    shortLabel: 'Error Prop',
    category: 'error-prop',
    icon: <Sigma size={18} />,
    shortcut: '4'
  },
  {
    id: 'formulas',
    label: 'Formulas and Presets',
    shortLabel: 'Formulas & Presets',
    category: 'optical',
    icon: <BookOpen size={18} />,
    shortcut: '5'
  }
];

export const TabNavigation: React.FC = () => {
  const { activeTab, setActiveTab } = useSettings();

  return (
    <nav
      style={{
        borderBottom: '1px solid var(--color-border-subtle)',
        backgroundColor: 'var(--color-bg-base)',
        position: 'sticky',
        top: '60px',
        zIndex: 90
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          gap: '4px',
          paddingTop: '6px',
          paddingBottom: '0'
        }}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const categoryColor = `var(--color-${tab.category})`;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                fontSize: 'var(--font-size-sm)',
                fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                backgroundColor: isActive ? 'var(--color-bg-surface)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? `2px solid ${categoryColor}` : '2px solid transparent',
                borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{ color: isActive ? categoryColor : 'var(--color-text-muted)' }}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              <kbd
                style={{
                  display: 'inline-block',
                  fontSize: '9px',
                  color: 'var(--color-text-muted)',
                  backgroundColor: 'var(--color-bg-input)',
                  padding: '1px 4px',
                  borderRadius: '2px',
                  border: '1px solid var(--color-border-subtle)'
                }}
              >
                {tab.shortcut}
              </kbd>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
