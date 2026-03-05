'use client';

import { Alert } from '@mui/material';
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
import { useTopMenuContext } from './context/useTopMenuContext';

export function TopMenuAppearanceSection() {
  const {
    labels,
    controls: {
      model: { appearance },
      actions
    }
  } = useTopMenuContext();

  return (
    <details className="controlSection" open>
      <summary id="appearanceSummary">{labels.appearanceSummary}</summary>
      <div className="controlGroup" id="appearanceGroup">
        <TopMenuSelectField
          id="fontSelect"
          title="Change UI font"
          label={labels.fontPrefix}
          value={appearance.font}
          onChange={next => actions.onSetAppearance({ font: next })}
          options={buildFontOptions(labels)}
        />

        <TopMenuSelectField
          id="fontSizeSelect"
          title="Scale text size"
          label={labels.fontSizePrefix}
          value={appearance.fontSize}
          onChange={next => actions.onSetAppearance({ fontSize: next })}
          options={buildFontSizeOptions(labels)}
        />

        <TopMenuSelectField
          id="schemeSelect"
          title="Column accent scheme"
          label={labels.schemePrefix}
          value={appearance.scheme}
          onChange={next => actions.onSetAppearance({ scheme: next })}
          options={buildSchemeOptions(labels)}
        />

        <TopMenuSelectField
          id="btnModeSelect"
          title="Item buttons look"
          label={labels.buttonsPrefix}
          value={appearance.buttonMode}
          onChange={next => actions.onSetAppearance({ buttonMode: next })}
          options={buildButtonModeOptions(labels)}
        />

        <TopMenuSelectField
          id="timezoneSelect"
          title="Date/time timezone"
          label={labels.timezonePrefix}
          value={appearance.timezone}
          onChange={next => actions.onSetAppearance({ timezone: next })}
          options={buildTimezoneOptions(labels)}
        />

        <TopMenuSelectField
          id="dateFormatSelect"
          title="Date format"
          label={labels.dateFormatPrefix}
          value={appearance.dateFormat}
          onChange={next => actions.onSetAppearance({ dateFormat: next })}
          options={buildDateFormatOptions(labels)}
        />

        <TopMenuSelectField
          id="menuHintsSelect"
          title="Top menu hint style"
          label={labels.menuHints}
          value={appearance.menuHintMode}
          onChange={next => actions.onSetAppearance({ menuHintMode: next })}
          options={buildMenuHintOptions(labels)}
        />

        <TopMenuSelectField
          id="effectIntensitySelect"
          title="Visual ornament intensity"
          label={labels.effectIntensity}
          value={appearance.effectIntensity}
          disabled={appearance.performanceMode}
          onChange={next => actions.onSetAppearance({ effectIntensity: next })}
          options={buildEffectIntensityOptions(labels)}
        />

        <TopMenuSelectField
          id="soundThemeSelect"
          title="Audio vibe profile"
          label={labels.soundTheme}
          value={appearance.soundTheme}
          disabled={appearance.performanceMode}
          onChange={next => actions.onSetAppearance({ soundTheme: next })}
          options={buildSoundThemeOptions(labels)}
        />

        <button className="btn" type="button" disabled={appearance.performanceMode} onClick={actions.onToggleSoundEnabled}>
          {labels.sound} {appearance.soundEnabled ? labels.soundOn : labels.soundOff}
        </button>

        <TopMenuSelectField
          id="vibeSelect"
          title="Visual vibe preset"
          label={labels.vibePrefix}
          value={appearance.vibe}
          onChange={next => actions.onSetAppearance({ vibe: next })}
          options={buildVibeOptions(labels)}
        />

        <TopMenuSelectField
          id="interfaceLang"
          title="Interface language"
          label={labels.interfacePrefix}
          value={appearance.language}
          onChange={actions.onSetLanguage}
          options={buildLanguageOptions()}
        />

        <button className="btn" type="button" onClick={actions.onCycleTheme}>
          {labels.colorMode}: {appearance.colorMode}
        </button>
        <button className="btn" type="button" onClick={actions.onTogglePerformanceMode}>
          {labels.perfMode}: {appearance.performanceMode ? labels.perfOn : labels.perfOff}
        </button>

        {appearance.performanceMode ? (
          <Alert severity="info" sx={{ py: 0 }}>
            {labels.perfFxSoundHidden}
          </Alert>
        ) : null}
      </div>
    </details>
  );
}
