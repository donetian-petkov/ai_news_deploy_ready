'use client';

import { Alert } from '@mui/material';
import type { TopMenuDateFormat, TopMenuTimezone, TopMenuVibe } from './topMenu.services';
import { TopMenuSelectField } from './TopMenuSelectField';
import {
  buildButtonModeOptions,
  buildDateFormatOptions,
  buildEffectIntensityOptions,
  buildFontOptions,
  buildFontSizeOptions,
  buildLanguageOptions,
  buildMenuHintOptions,
  buildSchemeOptions,
  buildSoundThemeOptions,
  buildTimezoneOptions,
  buildVibeOptions
} from './topMenuOptionBuilders';

type SoundThemeValue = 'vibe' | TopMenuVibe;

type FontValue = 'system' | 'manrope' | 'grotesk' | 'sora' | 'plex' | 'serif' | 'mono';
type FontSizeValue = 'sm' | 'md' | 'lg' | 'xl';
type SchemeValue = 'classic' | 'vivid' | 'sunset' | 'neon' | 'ocean' | 'forest';
type ButtonModeValue = 'icons' | 'text';
type MenuHintModeValue = 'text' | 'buttons';
type EffectIntensityValue = 'low' | 'medium' | 'high';

type TopMenuAppearanceSectionProps = {
  labels: Record<string, string>;
  font: FontValue;
  fontSize: FontSizeValue;
  scheme: SchemeValue;
  timezone: TopMenuTimezone;
  dateFormat: TopMenuDateFormat;
  buttonMode: ButtonModeValue;
  menuHintMode: MenuHintModeValue;
  effectIntensity: EffectIntensityValue;
  soundTheme: SoundThemeValue;
  performanceMode: boolean;
  soundEnabled: boolean;
  vibe: TopMenuVibe;
  language: 'en' | 'bg';
  colorMode: 'system' | 'dark' | 'light';
  onSetAppearance: (patch: {
    font?: FontValue;
    fontSize?: FontSizeValue;
    scheme?: SchemeValue;
    timezone?: TopMenuTimezone;
    dateFormat?: TopMenuDateFormat;
    buttonMode?: ButtonModeValue;
    menuHintMode?: MenuHintModeValue;
    effectIntensity?: EffectIntensityValue;
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
  timezone,
  dateFormat,
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
        <TopMenuSelectField
          id="fontSelect"
          title="Change UI font"
          label={labels.fontPrefix}
          value={font}
          onChange={next => onSetAppearance({ font: next })}
          options={buildFontOptions(labels)}
        />

        <TopMenuSelectField
          id="fontSizeSelect"
          title="Scale text size"
          label={labels.fontSizePrefix}
          value={fontSize}
          onChange={next => onSetAppearance({ fontSize: next })}
          options={buildFontSizeOptions(labels)}
        />

        <TopMenuSelectField
          id="schemeSelect"
          title="Column accent scheme"
          label={labels.schemePrefix}
          value={scheme}
          onChange={next => onSetAppearance({ scheme: next })}
          options={buildSchemeOptions(labels)}
        />

        <TopMenuSelectField
          id="btnModeSelect"
          title="Item buttons look"
          label={labels.buttonsPrefix}
          value={buttonMode}
          onChange={next => onSetAppearance({ buttonMode: next })}
          options={buildButtonModeOptions(labels)}
        />

        <TopMenuSelectField
          id="timezoneSelect"
          title="Date/time timezone"
          label={labels.timezonePrefix}
          value={timezone}
          onChange={next => onSetAppearance({ timezone: next })}
          options={buildTimezoneOptions(labels)}
        />

        <TopMenuSelectField
          id="dateFormatSelect"
          title="Date format"
          label={labels.dateFormatPrefix}
          value={dateFormat}
          onChange={next => onSetAppearance({ dateFormat: next })}
          options={buildDateFormatOptions(labels)}
        />

        <TopMenuSelectField
          id="menuHintsSelect"
          title="Top menu hint style"
          label={labels.menuHints}
          value={menuHintMode}
          onChange={next => onSetAppearance({ menuHintMode: next })}
          options={buildMenuHintOptions(labels)}
        />

        <TopMenuSelectField
          id="effectIntensitySelect"
          title="Visual ornament intensity"
          label={labels.effectIntensity}
          value={effectIntensity}
          disabled={performanceMode}
          onChange={next => onSetAppearance({ effectIntensity: next })}
          options={buildEffectIntensityOptions(labels)}
        />

        <TopMenuSelectField
          id="soundThemeSelect"
          title="Audio vibe profile"
          label={labels.soundTheme}
          value={soundTheme}
          disabled={performanceMode}
          onChange={next => onSetAppearance({ soundTheme: next })}
          options={buildSoundThemeOptions(labels)}
        />

        <button className="btn" type="button" disabled={performanceMode} onClick={onToggleSoundEnabled}>
          {labels.sound} {soundEnabled ? labels.soundOn : labels.soundOff}
        </button>

        <TopMenuSelectField
          id="vibeSelect"
          title="Visual vibe preset"
          label={labels.vibePrefix}
          value={vibe}
          onChange={next => onSetAppearance({ vibe: next })}
          options={buildVibeOptions(labels)}
        />

        <TopMenuSelectField
          id="interfaceLang"
          title="Interface language"
          label={labels.interfacePrefix}
          value={language}
          onChange={onSetLanguage}
          options={buildLanguageOptions()}
        />

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
