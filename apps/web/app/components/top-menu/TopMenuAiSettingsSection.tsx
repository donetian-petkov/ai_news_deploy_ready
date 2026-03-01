'use client';

import { Alert } from '@mui/material';
import {
  type MoodFilter,
  type TypeFilter
} from '../../store/types';
import { TopMenuSelectField } from './TopMenuSelectField';
import {
  buildAiProviderOptions,
  buildBudgetOptions,
  buildMoodOptions,
  buildResearchLangOptions,
  buildSummaryLangOptions,
  buildTypeOptions
} from './topMenuOptionBuilders';

type AiProvider = 'openai' | 'claude' | 'openrouter';
type SummaryLang = 'bilingual' | 'bg' | 'en';
type ResearchLang = 'bg' | 'en';
type Budget = 'mixed' | 'low' | 'standard' | 'high';

type TopMenuAiSettingsSectionProps = {
  labels: Record<string, string>;
  aiAvailable: boolean;
  performanceMode: boolean;
  aiProvider: AiProvider;
  summaryLang: SummaryLang;
  researchLang: ResearchLang;
  moodFilter: MoodFilter;
  typeFilter: TypeFilter;
  allBudget: Budget;
  onChangeAiProvider: (provider: AiProvider) => void;
  onSummaryLangChange: (lang: SummaryLang) => void;
  onResearchLangChange: (lang: ResearchLang) => void;
  onMoodFilterChange: (value: MoodFilter) => void;
  onTypeFilterChange: (value: TypeFilter) => void;
  onApplyAllBudget: (budget: 'low' | 'standard' | 'high') => void;
};

export function TopMenuAiSettingsSection({
  labels,
  aiAvailable,
  performanceMode,
  aiProvider,
  summaryLang,
  researchLang,
  moodFilter,
  typeFilter,
  allBudget,
  onChangeAiProvider,
  onSummaryLangChange,
  onResearchLangChange,
  onMoodFilterChange,
  onTypeFilterChange,
  onApplyAllBudget
}: TopMenuAiSettingsSectionProps) {
  return (
    <details className="controlSection" open>
      <summary id="aiSettingsSummary">{labels.aiSettingsSummary}</summary>
      <div className="controlGroup">
        <TopMenuSelectField
          id="aiProviderSelect"
          label={labels.aiProvider}
          value={aiProvider}
          onChange={onChangeAiProvider}
          options={buildAiProviderOptions(labels)}
        />

        <TopMenuSelectField
          id="summaryLang"
          label={labels.summaryPrefix}
          value={summaryLang}
          disabled={!aiAvailable}
          onChange={onSummaryLangChange}
          options={buildSummaryLangOptions()}
        />

        <TopMenuSelectField
          id="researchLang"
          label={labels.researchPrefix}
          value={researchLang}
          disabled={!aiAvailable}
          onChange={onResearchLangChange}
          options={buildResearchLangOptions()}
        />

        {!performanceMode ? (
          <>
            <TopMenuSelectField
              id="moodFilter"
              label={labels.moodFilter}
              value={moodFilter}
              disabled={!aiAvailable}
              onChange={onMoodFilterChange}
              options={buildMoodOptions(labels)}
            />
            <TopMenuSelectField
              id="typeFilter"
              label={labels.typeFilter}
              value={typeFilter}
              disabled={!aiAvailable}
              onChange={onTypeFilterChange}
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
          value={allBudget}
          disabled={!aiAvailable}
          onChange={budget => {
            if (budget !== 'mixed') onApplyAllBudget(budget);
          }}
          options={buildBudgetOptions(labels)}
        />

        {!aiAvailable ? (
          <Alert severity="info" sx={{ py: 0 }}>
            {labels.aiUnavailable}
          </Alert>
        ) : null}
      </div>
    </details>
  );
}
