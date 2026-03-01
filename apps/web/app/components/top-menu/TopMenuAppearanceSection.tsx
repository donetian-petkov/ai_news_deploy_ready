'use client';

import { Alert } from '@mui/material';
import type { TopMenuVibe } from './topMenu.services';

type SoundThemeValue = 'vibe' | TopMenuVibe;

type TopMenuAppearanceSectionProps = {
  labels: Record<string, string>;
  font: 'system' | 'manrope' | 'grotesk' | 'sora' | 'plex' | 'serif' | 'mono';
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  scheme: 'classic' | 'vivid' | 'sunset' | 'neon' | 'ocean' | 'forest';
  buttonMode: 'icons' | 'text';
  menuHintMode: 'text' | 'buttons';
  effectIntensity: 'low' | 'medium' | 'high';
  soundTheme: SoundThemeValue;
  performanceMode: boolean;
  soundEnabled: boolean;
  vibe: TopMenuVibe;
  language: 'en' | 'bg';
  colorMode: 'system' | 'dark' | 'light';
  onSetAppearance: (patch: {
    font?: 'system' | 'manrope' | 'grotesk' | 'sora' | 'plex' | 'serif' | 'mono';
    fontSize?: 'sm' | 'md' | 'lg' | 'xl';
    scheme?: 'classic' | 'vivid' | 'sunset' | 'neon' | 'ocean' | 'forest';
    buttonMode?: 'icons' | 'text';
    menuHintMode?: 'text' | 'buttons';
    effectIntensity?: 'low' | 'medium' | 'high';
    soundTheme?: SoundThemeValue;
    soundEnabled?: boolean;
    vibe?: TopMenuVibe;
    performanceMode?: boolean;
  }) => void;
  onSetLanguage: (lang: 'en' | 'bg') => void;
  onCycleTheme: () => void;
  onTogglePerformanceMode: () => void;
  onToggleSoundEnabled: () => void;
};

export function TopMenuAppearanceSection({
  labels,
  font,
  fontSize,
  scheme,
  buttonMode,
  menuHintMode,
  effectIntensity,
  soundTheme,
  performanceMode,
  soundEnabled,
  vibe,
  language,
  colorMode,
  onSetAppearance,
  onSetLanguage,
  onCycleTheme,
  onTogglePerformanceMode,
  onToggleSoundEnabled
}: TopMenuAppearanceSectionProps) {
  return (
    <details className="controlSection" open>
      <summary id="appearanceSummary">{labels.appearanceSummary}</summary>
      <div className="controlGroup" id="appearanceGroup">
        <label className="checkbox" title="Change UI font">
          <span id="fontPrefix">{labels.fontPrefix}</span>
          <select id="fontSelect" className="select" value={font} onChange={e => onSetAppearance({ font: e.target.value as TopMenuAppearanceSectionProps['font'] })}>
            <option value="system">{labels.fontSystem}</option>
            <option value="manrope">{labels.fontManrope}</option>
            <option value="grotesk">{labels.fontGrotesk}</option>
            <option value="sora">{labels.fontSora}</option>
            <option value="plex">{labels.fontPlex}</option>
            <option value="serif">{labels.fontSerif}</option>
            <option value="mono">{labels.fontMono}</option>
          </select>
        </label>
        <label className="checkbox" title="Scale text size">
          <span id="fontSizePrefix">{labels.fontSizePrefix}</span>
          <select id="fontSizeSelect" className="select" value={fontSize} onChange={e => onSetAppearance({ fontSize: e.target.value as TopMenuAppearanceSectionProps['fontSize'] })}>
            <option value="sm">{labels.fontSizeSmall}</option>
            <option value="md">{labels.fontSizeMedium}</option>
            <option value="lg">{labels.fontSizeLarge}</option>
            <option value="xl">{labels.fontSizeXL}</option>
          </select>
        </label>
        <label className="checkbox" title="Column accent scheme">
          <span id="schemePrefix">{labels.schemePrefix}</span>
          <select id="schemeSelect" className="select" value={scheme} onChange={e => onSetAppearance({ scheme: e.target.value as TopMenuAppearanceSectionProps['scheme'] })}>
            <option value="classic">{labels.schemeClassic}</option>
            <option value="vivid">{labels.schemeVivid}</option>
            <option value="sunset">{labels.schemeSunset}</option>
            <option value="neon">{labels.schemeNeon}</option>
            <option value="ocean">{labels.schemeOcean}</option>
            <option value="forest">{labels.schemeForest}</option>
          </select>
        </label>
        <label className="checkbox" title="Item buttons look">
          <span id="buttonsPrefix">{labels.buttonsPrefix}</span>
          <select id="btnModeSelect" className="select" value={buttonMode} onChange={e => onSetAppearance({ buttonMode: e.target.value as TopMenuAppearanceSectionProps['buttonMode'] })}>
            <option value="icons">{labels.buttonsIcons}</option>
            <option value="text">{labels.buttonsText}</option>
          </select>
        </label>
        <label className="checkbox" title="Top menu hint style">
          <span id="menuHintsPrefix">{labels.menuHints}</span>
          <select id="menuHintsSelect" className="select" value={menuHintMode} onChange={e => onSetAppearance({ menuHintMode: e.target.value as TopMenuAppearanceSectionProps['menuHintMode'] })}>
            <option value="text">{labels.menuHintsText}</option>
            <option value="buttons">{labels.menuHintsButtons}</option>
          </select>
        </label>
        <label className="checkbox" title="Visual ornament intensity">
          <span id="effectIntensityPrefix">{labels.effectIntensity}</span>
          <select
            id="effectIntensitySelect"
            className="select"
            value={effectIntensity}
            disabled={performanceMode}
            onChange={e => onSetAppearance({ effectIntensity: e.target.value as TopMenuAppearanceSectionProps['effectIntensity'] })}
          >
            <option value="low">{labels.effectLow}</option>
            <option value="medium">{labels.effectMedium}</option>
            <option value="high">{labels.effectHigh}</option>
          </select>
        </label>
        <label className="checkbox" title="Audio vibe profile">
          <span id="soundThemePrefix">{labels.soundTheme}</span>
          <select
            id="soundThemeSelect"
            className="select"
            value={soundTheme}
            disabled={performanceMode}
            onChange={e => onSetAppearance({ soundTheme: e.target.value as SoundThemeValue })}
          >
            <option value="vibe">{labels.soundVibeLinked}</option>
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
        <button className="btn" type="button" disabled={performanceMode} onClick={onToggleSoundEnabled}>
          {labels.sound} {soundEnabled ? labels.soundOn : labels.soundOff}
        </button>
        <label className="checkbox" title="Visual vibe preset">
          <span id="vibePrefix">{labels.vibePrefix}</span>
          <select id="vibeSelect" className="select" value={vibe} onChange={e => onSetAppearance({ vibe: e.target.value as TopMenuVibe })}>
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
        <label className="checkbox" title="Interface language">
          <span id="interfaceLangPrefix">{labels.interfacePrefix}</span>
          <select id="interfaceLang" className="select" value={language} onChange={e => onSetLanguage(e.target.value as 'en' | 'bg')}>
            <option value="en">EN</option>
            <option value="bg">BG</option>
          </select>
        </label>
        <button className="btn" type="button" onClick={onCycleTheme}>
          {labels.colorMode}: {colorMode}
        </button>
        <button className="btn" type="button" onClick={onTogglePerformanceMode}>
          {labels.perfMode}: {performanceMode ? labels.perfOn : labels.perfOff}
        </button>
        {performanceMode ? (
          <Alert severity="info" sx={{ py: 0 }}>
            {labels.perfFxSoundHidden}
          </Alert>
        ) : null}
      </div>
    </details>
  );
}
