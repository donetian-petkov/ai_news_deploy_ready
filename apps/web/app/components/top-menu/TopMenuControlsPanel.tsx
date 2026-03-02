'use client';

import type { RootState } from '../../store/store';
import { TopMenuControlsQuickRow } from './TopMenuControlsQuickRow';
import { TopMenuNotificationsSection } from './TopMenuNotificationsSection';
import { TopMenuAiSettingsSection } from './TopMenuAiSettingsSection';
import { TopMenuAppearanceSection } from './TopMenuAppearanceSection';
import type { TopMenuDeleteAge, TopMenuVibe } from './topMenu.services';

type TopMenuControlsPanelProps = {
  ui: RootState['ui'];
  labels: Record<string, string>;
  deleteAgeAll: TopMenuDeleteAge;
  onDeleteAgeAllChange: (age: TopMenuDeleteAge) => void;
  onResetAllNewest: () => void;
  onShowMoreNewsAll: () => void;
  onResetNewsShownAll: () => void;
  onDeleteOldAllColumns: () => void;
  onToggleAiEnabled: (enabled: boolean) => void;
  onOpenHelp: () => void;
  onNotifyEnabledChange: (enabled: boolean) => void;
  onNotifyModeChange: (mode: 'matched' | 'matched_pinned' | 'pinned' | 'all') => void;
  onChangeAiProvider: (provider: 'openai' | 'claude' | 'openrouter') => void;
  onSummaryLangChange: (lang: 'bilingual' | 'bg' | 'en') => void;
  onResearchLangChange: (lang: 'bg' | 'en') => void;
  onMoodFilterChange: (value: RootState['ui']['moodFilter']) => void;
  onTypeFilterChange: (value: RootState['ui']['typeFilter']) => void;
  onApplyAllBudget: (budget: 'low' | 'standard' | 'high') => void;
  onSetAppearance: (patch: {
    font?: RootState['ui']['font'];
    fontSize?: RootState['ui']['fontSize'];
    scheme?: RootState['ui']['scheme'];
    timezone?: RootState['ui']['timezone'];
    buttonMode?: RootState['ui']['buttonMode'];
    menuHintMode?: RootState['ui']['menuHintMode'];
    effectIntensity?: RootState['ui']['effectIntensity'];
    soundTheme?: RootState['ui']['soundTheme'];
    soundEnabled?: RootState['ui']['soundEnabled'];
    vibe?: TopMenuVibe;
    performanceMode?: RootState['ui']['performanceMode'];
  }) => void;
  onSetLanguage: (lang: 'en' | 'bg') => void;
  onCycleTheme: () => void;
  onTogglePerformanceMode: () => void;
  onToggleSoundEnabled: () => void;
};

export function TopMenuControlsPanel({
  ui,
  labels,
  deleteAgeAll,
  onDeleteAgeAllChange,
  onResetAllNewest,
  onShowMoreNewsAll,
  onResetNewsShownAll,
  onDeleteOldAllColumns,
  onToggleAiEnabled,
  onOpenHelp,
  onNotifyEnabledChange,
  onNotifyModeChange,
  onChangeAiProvider,
  onSummaryLangChange,
  onResearchLangChange,
  onMoodFilterChange,
  onTypeFilterChange,
  onApplyAllBudget,
  onSetAppearance,
  onSetLanguage,
  onCycleTheme,
  onTogglePerformanceMode,
  onToggleSoundEnabled
}: TopMenuControlsPanelProps) {
  return (
    <div className={`controls${ui.controlsCollapsed ? ' controlsHidden' : ''}`}>
      <TopMenuControlsQuickRow
        labels={labels}
        aiAvailable={ui.aiAvailable}
        aiEnabled={ui.aiEnabled}
        deleteAgeAll={deleteAgeAll}
        onDeleteAgeAllChange={onDeleteAgeAllChange}
        onResetAllNewest={onResetAllNewest}
        onShowMoreNewsAll={onShowMoreNewsAll}
        onResetNewsShownAll={onResetNewsShownAll}
        onDeleteOldAllColumns={onDeleteOldAllColumns}
        onToggleAiEnabled={onToggleAiEnabled}
        onOpenHelp={onOpenHelp}
      />

      <div className="controlsHint" id="controlsHint">
        {labels.controlsHint}
      </div>

      <div className="controlsGrid">
        <TopMenuNotificationsSection
          labels={labels}
          notifyEnabled={ui.notifyEnabled}
          notifyMode={ui.notifyMode}
          onNotifyEnabledChange={onNotifyEnabledChange}
          onNotifyModeChange={onNotifyModeChange}
        />
        <TopMenuAiSettingsSection
          labels={labels}
          aiAvailable={ui.aiAvailable}
          performanceMode={ui.performanceMode}
          aiProvider={ui.aiProvider}
          summaryLang={ui.summaryLang}
          researchLang={ui.researchLang}
          moodFilter={ui.moodFilter}
          typeFilter={ui.typeFilter}
          allBudget={ui.allBudget}
          onChangeAiProvider={onChangeAiProvider}
          onSummaryLangChange={onSummaryLangChange}
          onResearchLangChange={onResearchLangChange}
          onMoodFilterChange={onMoodFilterChange}
          onTypeFilterChange={onTypeFilterChange}
          onApplyAllBudget={onApplyAllBudget}
        />
        <TopMenuAppearanceSection
          labels={labels}
          font={ui.font}
          fontSize={ui.fontSize}
          scheme={ui.scheme}
          timezone={ui.timezone}
          buttonMode={ui.buttonMode}
          menuHintMode={ui.menuHintMode}
          effectIntensity={ui.effectIntensity}
          soundTheme={ui.soundTheme}
          performanceMode={ui.performanceMode}
          soundEnabled={ui.soundEnabled}
          vibe={ui.vibe}
          language={ui.language}
          colorMode={ui.colorMode}
          onSetAppearance={onSetAppearance}
          onSetLanguage={onSetLanguage}
          onCycleTheme={onCycleTheme}
          onTogglePerformanceMode={onTogglePerformanceMode}
          onToggleSoundEnabled={onToggleSoundEnabled}
        />
      </div>
    </div>
  );
}
