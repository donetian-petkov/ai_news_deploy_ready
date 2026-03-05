'use client';

import { useTopMenuContext } from './context/useTopMenuContext';

type VibeValue = 'default' | 'anime' | 'arcade' | 'cinema' | 'newspaper' | 'cyberwitch' | 'fantasy' | 'scifi';

type QuickVibeSelectProps = {
  value?: VibeValue;
  labels?: Record<string, string>;
  fullWidth?: boolean;
  onChange?: (value: VibeValue) => void;
};

export function QuickVibeSelect({ value, labels, fullWidth = false, onChange }: QuickVibeSelectProps) {
  const topMenu = useTopMenuContext();
  const resolvedValue = value ?? topMenu.vibe;
  const resolvedLabels = labels ?? topMenu.labels;
  const resolvedOnChange = onChange ?? topMenu.onChangeVibe;

  return (
    <label className="checkbox topQuickLabel" title={resolvedLabels.vibe} style={fullWidth ? { flex: 1 } : undefined}>
      <span id="quickVibeLabelText">{resolvedLabels.vibe}</span>
      <select
        id="quickVibeSelect"
        className="select topQuickSelect"
        value={resolvedValue}
        onChange={e => resolvedOnChange(e.target.value as VibeValue)}
        style={fullWidth ? { width: '100%' } : undefined}
      >
        <option value="default">{resolvedLabels.defaultVibe}</option>
        <option value="anime">{resolvedLabels.anime}</option>
        <option value="arcade">{resolvedLabels.arcade}</option>
        <option value="cinema">{resolvedLabels.cinema}</option>
        <option value="newspaper">{resolvedLabels.newspaper}</option>
        <option value="cyberwitch">{resolvedLabels.cyberwitch}</option>
        <option value="fantasy">{resolvedLabels.fantasy}</option>
        <option value="scifi">{resolvedLabels.scifi}</option>
      </select>
    </label>
  );
}
