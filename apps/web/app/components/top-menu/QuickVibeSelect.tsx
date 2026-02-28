'use client';

type VibeValue = 'default' | 'anime' | 'arcade' | 'cinema' | 'newspaper' | 'cyberwitch' | 'fantasy' | 'scifi';

type QuickVibeSelectProps = {
  value: VibeValue;
  labels: Record<string, string>;
  fullWidth?: boolean;
  onChange: (value: VibeValue) => void;
};

export function QuickVibeSelect({ value, labels, fullWidth = false, onChange }: QuickVibeSelectProps) {
  return (
    <label className="checkbox topQuickLabel" title="Quick vibe switch" style={fullWidth ? { flex: 1 } : undefined}>
      <span id="quickVibeLabelText">{labels.vibe}</span>
      <select
        id="quickVibeSelect"
        className="select topQuickSelect"
        value={value}
        onChange={e => onChange(e.target.value as VibeValue)}
        style={fullWidth ? { width: '100%' } : undefined}
      >
        <option value="default">{labels.defaultVibe}</option>
        <option value="anime">{labels.anime}</option>
        <option value="arcade">{labels.arcade}</option>
        <option value="cinema">{labels.cinema}</option>
        <option value="newspaper">{labels.newspaper}</option>
        <option value="cyberwitch">{labels.cyberwitch}</option>
        <option value="fantasy">{labels.fantasy}</option>
        <option value="scifi">{labels.scifi}</option>
      </select>
    </label>
  );
}
