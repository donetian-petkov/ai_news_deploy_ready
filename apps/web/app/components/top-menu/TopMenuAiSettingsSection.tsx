'use client';

import { Alert } from '@mui/material';
import { TopMenuSelectField } from './TopMenuSelectField';
import {
  buildAiModelOptions,
  buildAiProviderOptions,
  buildBudgetOptions,
  buildMoodOptions,
  buildResearchLangOptions,
  buildSummaryLangOptions,
  buildTypeOptions
} from './topMenuOptionBuilders';
import { useTopMenuContext } from './context/useTopMenuContext';

export function TopMenuAiSettingsSection() {
  const {
    labels,
    controls: {
      model: { aiSettings },
      actions
    }
  } = useTopMenuContext();

  const providerModels = aiSettings.availableModels[aiSettings.aiProvider];

  return (
    <details className="controlSection" open>
      <summary id="aiSettingsSummary">{labels.aiSettingsSummary}</summary>
      <div className="controlGroup">
        <TopMenuSelectField
          id="aiProviderSelect"
          label={labels.aiProvider}
          value={aiSettings.aiProvider}
          onChange={actions.onChangeAiProvider}
          options={buildAiProviderOptions(labels)}
        />

        <TopMenuSelectField
          id="summaryLang"
          label={labels.summaryPrefix}
          value={aiSettings.summaryLang}
          disabled={!aiSettings.aiAvailable}
          onChange={actions.onSummaryLangChange}
          options={buildSummaryLangOptions()}
        />

        <TopMenuSelectField
          id="researchLang"
          label={labels.researchPrefix}
          value={aiSettings.researchLang}
          disabled={!aiSettings.aiAvailable}
          onChange={actions.onResearchLangChange}
          options={buildResearchLangOptions()}
        />

        <TopMenuSelectField
          id="summaryModel"
          label={labels.summaryModelPrefix}
          value={aiSettings.summaryModel}
          disabled={!aiSettings.aiAvailable}
          onChange={actions.onSummaryModelChange}
          options={buildAiModelOptions(providerModels.summary, aiSettings.summaryModel)}
        />

        <TopMenuSelectField
          id="researchModel"
          label={labels.researchModelPrefix}
          value={aiSettings.researchModel}
          disabled={!aiSettings.aiAvailable}
          onChange={actions.onResearchModelChange}
          options={buildAiModelOptions(providerModels.research, aiSettings.researchModel)}
        />

        <TopMenuSelectField
          id="askModel"
          label={labels.askModelPrefix}
          value={aiSettings.askModel}
          disabled={!aiSettings.aiAvailable}
          onChange={actions.onAskModelChange}
          options={buildAiModelOptions(providerModels.ask, aiSettings.askModel)}
        />

        {!aiSettings.performanceMode ? (
          <>
            <TopMenuSelectField
              id="moodFilter"
              label={labels.moodFilter}
              value={aiSettings.moodFilter}
              disabled={!aiSettings.aiAvailable}
              onChange={actions.onMoodFilterChange}
              options={buildMoodOptions(labels)}
            />
            <TopMenuSelectField
              id="typeFilter"
              label={labels.typeFilter}
              value={aiSettings.typeFilter}
              disabled={!aiSettings.aiAvailable}
              onChange={actions.onTypeFilterChange}
              options={buildTypeOptions(labels)}
            />
          </>
        ) : (
          <Alert severity="info" sx={{ py: 0 }}>
            {labels.perfAIFiltersHidden}
          </Alert>
        )}

        <TopMenuSelectField
          id="allBudgetSelect"
          title="Apply one budget to all columns"
          label={labels.allBudgetPrefix}
          value={aiSettings.allBudget}
          disabled={!aiSettings.aiAvailable}
          onChange={budget => {
            if (budget !== 'mixed') actions.onApplyAllBudget(budget);
          }}
          options={buildBudgetOptions(labels)}
        />

        {!aiSettings.aiAvailable ? (
          <Alert severity="info" sx={{ py: 0 }}>
            {labels.aiUnavailable}
          </Alert>
        ) : null}
      </div>
    </details>
  );
}
