import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Atom, Plus, Download, Upload, Trash2, ArrowUpRight, Search, AlertTriangle } from 'lucide-react';
import { usePresets } from '../../context/PresetContext';
import { useSettings } from '../../context/SettingsContext';
import { TransitionPreset, PresetCategory } from '../../types/presets';
import { handleNumberStepperKeyDown } from '../../core/number-stepper';

export const PresetLibraryView: React.FC = () => {
  const {
    allPresets,
    applyPreset,
    addCustomPreset,
    deleteCustomPreset,
    exportPresetsAsJson,
    importPresetsFromJson
  } = usePresets();

  const { setActiveTab } = useSettings();

  const [categoryFilter, setCategoryFilter] = useState<PresetCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // New Custom Preset Form State
  const [newPreset, setNewPreset] = useState({
    name: '',
    species: '',
    transitionName: '',
    wavelengthNm: '',
    linewidthMHz: '',
    saturationIntensityMwPerCm2: '',
    dipoleMomentDebye: '',
    laboratory: '',
    citation: '',
    doi: '',
    description: ''
  });

  const handleApply = (preset: TransitionPreset) => {
    applyPreset(preset);
    setActiveTab('optical');
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const wl = parseFloat(newPreset.wavelengthNm);
    if (!newPreset.name || isNaN(wl) || wl <= 0) {
      alert('Please provide a valid species name and positive wavelength.');
      return;
    }

    const lw = parseFloat(newPreset.linewidthMHz);
    const isat = parseFloat(newPreset.saturationIntensityMwPerCm2);
    const d = parseFloat(newPreset.dipoleMomentDebye);

    addCustomPreset({
      name: newPreset.name,
      species: newPreset.species || newPreset.name,
      category: 'custom',
      transitionName: newPreset.transitionName || 'Main Transition',
      wavelengthNm: wl,
      linewidthMHz: !isNaN(lw) && lw > 0 ? lw : undefined,
      saturationIntensityMwPerCm2:
        !isNaN(isat) && isat > 0 ? isat : undefined,
      dipoleMomentDebye:
        !isNaN(d) && d > 0 ? d : undefined,
      laboratory: newPreset.laboratory || 'Custom Metrology',
      citation: newPreset.citation || undefined,
      doi: newPreset.doi || undefined,
      description: newPreset.description
    });

    setIsAddModalOpen(false);
    setNewPreset({
      name: '',
      species: '',
      transitionName: '',
      wavelengthNm: '',
      linewidthMHz: '',
      saturationIntensityMwPerCm2: '',
      dipoleMomentDebye: '',
      laboratory: '',
      citation: '',
      doi: '',
      description: ''
    });
  };

  const handleExport = () => {
    const jsonStr = exportPresetsAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amo-units-presets-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      if (content) {
        const res = importPresetsFromJson(content);
        if (res.success) {
          setImportStatus(`Successfully imported ${res.count} preset(s).`);
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus(`Import failed: ${res.error}`);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredPresets = allPresets.filter(p => {
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.transitionName && p.transitionName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.laboratory && p.laboratory.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.citation && p.citation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.doi && p.doi.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Header and Filter Toolbar */}
      <Card
        title="Atomic & Molecular Transition Library"
        subtitle="Transitions for alkali atoms, alkaline-earth elements, polar molecules, and custom presets."
        category="preset"
        icon={<Atom size={20} />}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              size="sm"
              variant="outline"
              category="preset"
              icon={<Upload size={14} />}
              onClick={() => document.getElementById('import-preset-input')?.click()}
            >
              Import
            </Button>
            <input
              id="import-preset-input"
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />

            <Button
              size="sm"
              variant="outline"
              category="preset"
              icon={<Download size={14} />}
              onClick={handleExport}
            >
              Export
            </Button>

            <Button
              size="sm"
              variant="primary"
              category="preset"
              icon={<Plus size={14} />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Custom
            </Button>
          </div>
        }
      >
        {importStatus && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-bg-input)',
              border: '1px solid var(--color-preset)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-preset)',
              marginBottom: 'var(--space-sm)'
            }}
          >
            {importStatus}
          </div>
        )}

        {/* Metrology Advisory Callout Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '10px 14px',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--space-md)'
          }}
        >
          <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: '#f59e0b' }}>Metrology Advisory:</strong> The physical constants, transition parameters, and literature citations listed across these atomic and molecular profiles <em>have been extracted by AI from these publications and have not been verified by a person yet</em>. Always verify critical experimental wavelengths, linewidths, and saturation intensities against primary literature before configuring laser systems.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-sm)',
            marginBottom: 'var(--space-md)'
          }}
        >
          {/* Category Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(['all', 'molecular', 'alkali', 'alkaline-earth', 'custom'] as const).map(cat => (
              <Button
                key={cat}
                size="sm"
                variant={categoryFilter === cat ? 'primary' : 'secondary'}
                category="preset"
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === 'all'
                  ? 'All Species'
                  : cat === 'molecular'
                  ? 'Cold Molecules (AlCl, CaF, AlF)'
                  : cat === 'alkali'
                  ? 'Alkali Atoms (Rb, Cs)'
                  : cat === 'alkaline-earth'
                  ? 'Alkaline-Earth Clocks (Sr)'
                  : 'Custom Library'}
              </Button>
            ))}
          </div>

          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'var(--color-bg-input)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              width: '100%',
              maxWidth: '300px'
            }}
          >
            <Search size={14} color="var(--color-text-muted)" />
            <input
              type="text"
              placeholder="Search species, lab, lines..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>
        </div>

        {/* Preset Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-md)'
          }}
        >
          {filteredPresets.map(preset => (
            <div
              key={preset.id}
              className="glass-panel"
              style={{
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-surface-elevated)',
                border: '1px solid var(--color-border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 'var(--space-sm)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div>
                    <h4
                      style={{
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 'bold',
                        color: 'var(--color-text-primary)',
                        margin: 0
                      }}
                    >
                      {preset.name}
                    </h4>
                    <p
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-preset)',
                        fontWeight: 'medium',
                        margin: '2px 0 0 0'
                      }}
                    >
                      {preset.transitionName}
                    </p>
                  </div>

                  {preset.isCustom && (
                    <button
                      onClick={() => deleteCustomPreset(preset.id)}
                      title="Delete custom preset"
                      style={{
                        padding: '4px',
                        color: 'var(--color-text-muted)',
                        borderRadius: 'var(--radius-xs)'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {preset.laboratory && (
                  <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Ref: {preset.laboratory}
                  </div>
                )}

                {/* Key Metrics Chips */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginTop: '10px'
                  }}
                >
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--color-optical-badge)',
                      color: 'var(--color-optical)',
                      border: '1px solid var(--color-optical)'
                    }}
                  >
                    λ: {preset.wavelengthNm} nm
                  </span>

                  {preset.linewidthMHz !== undefined && (
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--color-laser-badge)',
                        color: 'var(--color-laser)',
                        border: '1px solid var(--color-laser)'
                      }}
                    >
                      Γ/2π: {preset.linewidthMHz} MHz
                    </span>
                  )}

                  {preset.saturationIntensityMwPerCm2 !== undefined && (
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--color-rf-badge)',
                        color: 'var(--color-rf)',
                        border: '1px solid var(--color-rf)'
                      }}
                    >
                      I_sat: {preset.saturationIntensityMwPerCm2} mW/cm²
                    </span>
                  )}

                  {preset.dipoleMomentDebye !== undefined && (
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--color-preset-badge)',
                        color: 'var(--color-preset)',
                        border: '1px solid var(--color-preset)'
                      }}
                    >
                      d: {preset.dipoleMomentDebye} D
                    </span>
                  )}
                </div>

                {preset.description && (
                  <p
                    style={{
                      fontSize: 'var(--font-size-2xs)',
                      color: 'var(--color-text-secondary)',
                      marginTop: '8px',
                      marginBottom: 0
                    }}
                  >
                    {preset.description}
                  </p>
                )}

                {preset.citation && (
                  <div
                    style={{
                      fontSize: 'var(--font-size-2xs)',
                      color: 'var(--color-text-muted)',
                      marginTop: '8px',
                      padding: '4px 8px',
                      backgroundColor: 'var(--color-bg-base)',
                      borderRadius: 'var(--radius-xs)',
                      borderLeft: '2px solid var(--color-preset)'
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Literature: </span>
                    <span>{preset.citation}</span>
                    {preset.doi && (
                      <span style={{ marginLeft: '6px' }}>
                        <a
                          href={preset.doi.startsWith('http') ? preset.doi : `https://doi.org/${preset.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--color-preset)', textDecoration: 'underline' }}
                        >
                          {preset.doi.startsWith('http') ? '[Data PDF]' : `[DOI: ${preset.doi}]`}
                        </a>
                      </span>
                    )}
                  </div>
                )}

                {!preset.isCustom && (
                  <div
                    style={{
                      fontSize: 'var(--font-size-2xs)',
                      color: '#f59e0b',
                      fontStyle: 'italic',
                      marginTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                    <span>Extracted by AI from these publications; not yet verified by a person.</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div style={{ marginTop: '12px' }}>
                <Button
                  size="sm"
                  variant="outline"
                  category="preset"
                  icon={<ArrowUpRight size={14} />}
                  onClick={() => handleApply(preset)}
                  style={{ width: '100%' }}
                >
                  Load into Calculators
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Add Custom Preset Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Custom Transition Preset"
        subtitle="Save custom transition parameters to local presets."
      >
        <form onSubmit={handleCreateCustom} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
            <div>
              <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
                Species Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AlCl, CaOH, or Sr-87"
                value={newPreset.name}
                onChange={e => setNewPreset({ ...newPreset, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  backgroundColor: 'var(--color-bg-input)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--color-text-primary)',
                  marginTop: '4px'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
                Transition Line
              </label>
              <input
                type="text"
                placeholder="e.g. A-X (0,0) or Clock"
                value={newPreset.transitionName}
                onChange={e => setNewPreset({ ...newPreset, transitionName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  backgroundColor: 'var(--color-bg-input)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--color-text-primary)',
                  marginTop: '4px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-sm)' }}>
            <div>
              <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
                Wavelength (nm) *
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                placeholder="e.g. 261.5"
                value={newPreset.wavelengthNm}
                onKeyDown={e => {
                  handleNumberStepperKeyDown(e, newVal => {
                    setNewPreset(prev => ({ ...prev, wavelengthNm: newVal }));
                  });
                }}
                onChange={e => setNewPreset({ ...newPreset, wavelengthNm: e.target.value })}
                className="font-mono"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  backgroundColor: 'var(--color-bg-input)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--color-text-primary)',
                  marginTop: '4px'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Linewidth Γ/2π (MHz)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 36.0"
                value={newPreset.linewidthMHz}
                onKeyDown={e => {
                  handleNumberStepperKeyDown(e, newVal => {
                    setNewPreset(prev => ({ ...prev, linewidthMHz: newVal }));
                  });
                }}
                onChange={e => setNewPreset({ ...newPreset, linewidthMHz: e.target.value })}
                className="font-mono"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  backgroundColor: 'var(--color-bg-input)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--color-text-primary)',
                  marginTop: '4px'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Isat (mW/cm²)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 135"
                value={newPreset.saturationIntensityMwPerCm2}
                onKeyDown={e => {
                  handleNumberStepperKeyDown(e, newVal => {
                    setNewPreset(prev => ({ ...prev, saturationIntensityMwPerCm2: newVal }));
                  });
                }}
                onChange={e =>
                  setNewPreset({ ...newPreset, saturationIntensityMwPerCm2: e.target.value })
                }
                className="font-mono"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  backgroundColor: 'var(--color-bg-input)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--color-text-primary)',
                  marginTop: '4px'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Dipole Moment (Debye)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 1.5"
                value={newPreset.dipoleMomentDebye}
                onKeyDown={e => {
                  handleNumberStepperKeyDown(e, newVal => {
                    setNewPreset(prev => ({ ...prev, dipoleMomentDebye: newVal }));
                  });
                }}
                onChange={e => setNewPreset({ ...newPreset, dipoleMomentDebye: e.target.value })}
                className="font-mono"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  backgroundColor: 'var(--color-bg-input)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--color-text-primary)',
                  marginTop: '4px'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Metrology Lab / Institution
            </label>
            <input
              type="text"
              placeholder="e.g. NIST / JILA / PTB / University of Oregon"
              value={newPreset.laboratory}
              onChange={e => setNewPreset({ ...newPreset, laboratory: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 10px',
                backgroundColor: 'var(--color-bg-input)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--color-text-primary)',
                marginTop: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Formal Literature Citation
            </label>
            <input
              type="text"
              placeholder="e.g. J. R. Daniel et al., Phys. Rev. A 108, 062821 (2023)"
              value={newPreset.citation}
              onChange={e => setNewPreset({ ...newPreset, citation: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 10px',
                backgroundColor: 'var(--color-bg-input)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--color-text-primary)',
                marginTop: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              DOI or Data URL
            </label>
            <input
              type="text"
              placeholder="e.g. 10.1103/PhysRevA.108.062821 or https://steck.us/..."
              value={newPreset.doi}
              onChange={e => setNewPreset({ ...newPreset, doi: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 10px',
                backgroundColor: 'var(--color-bg-input)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--color-text-primary)',
                marginTop: '4px'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-sm)' }}>
            <Button size="md" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button size="md" variant="primary" category="preset" type="submit">
              Save Preset
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
