'use client';

import { Alert } from '@mui/material';

type AiProvider = 'openai' | 'claude' | 'openrouter';
type SummaryLang = 'bilingual' | 'bg' | 'en';
type ResearchLang = 'bg' | 'en';
type MoodFilter = 'all' | 'pesimistic' | 'optimistic' | 'realistic' | 'melancholy' | 'happiness' | 'sadness' | 'rage' | 'uncertainty' | 'neutral' | 'curios';
type TypeFilter = 'all' | 'science' | 'movies' | 'politics' | 'business' | 'technology' | 'sports' | 'health' | 'world' | 'culture' | 'environment' | 'crime' | 'education' | 'other';
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
        <label className="checkbox">
          <span id="aiProviderPrefix">{labels.aiProvider}</span>
          <select
            id="aiProviderSelect"
            className="select"
            value={aiProvider}
            onChange={e => onChangeAiProvider(e.target.value as AiProvider)}
          >
            <option value="openai">{labels.openai}</option>
            <option value="claude">{labels.claude}</option>
            <option value="openrouter">{labels.openrouter}</option>
          </select>
        </label>
        <label className="checkbox">
          <span id="summaryLangPrefix">{labels.summaryPrefix}</span>
          <select
            id="summaryLang"
            className="select"
            value={summaryLang}
            disabled={!aiAvailable}
            onChange={e => onSummaryLangChange(e.target.value as SummaryLang)}
          >
            <option value="bilingual">BG / EN</option>
            <option value="bg">BG</option>
            <option value="en">EN</option>
          </select>
        </label>
        <label className="checkbox">
          <span id="researchLangPrefix">{labels.researchPrefix}</span>
          <select
            id="researchLang"
            className="select"
            value={researchLang}
            disabled={!aiAvailable}
            onChange={e => onResearchLangChange(e.target.value as ResearchLang)}
          >
            <option value="bg">BG</option>
            <option value="en">EN</option>
          </select>
        </label>
        {!performanceMode ? (
          <>
            <label className="checkbox">
              <span id="moodFilterPrefix">{labels.moodFilter}</span>
              <select
                id="moodFilter"
                className="select"
                value={moodFilter}
                disabled={!aiAvailable}
                onChange={e => onMoodFilterChange(e.target.value as MoodFilter)}
              >
                <option value="all">{labels.moodAll}</option>
                <option value="pesimistic">{labels.moodPesimistic}</option>
                <option value="optimistic">{labels.moodOptimistic}</option>
                <option value="realistic">{labels.moodRealistic}</option>
                <option value="melancholy">{labels.moodMelancholy}</option>
                <option value="happiness">{labels.moodHappiness}</option>
                <option value="sadness">{labels.moodSadness}</option>
                <option value="rage">{labels.moodRage}</option>
                <option value="uncertainty">{labels.moodUncertainty}</option>
                <option value="neutral">{labels.moodNeutral}</option>
                <option value="curios">{labels.moodCurios}</option>
              </select>
            </label>
            <label className="checkbox">
              <span id="typeFilterPrefix">{labels.typeFilter}</span>
              <select
                id="typeFilter"
                className="select"
                value={typeFilter}
                disabled={!aiAvailable}
                onChange={e => onTypeFilterChange(e.target.value as TypeFilter)}
              >
                <option value="all">{labels.typeAll}</option>
                <option value="science">{labels.typeScience}</option>
                <option value="movies">{labels.typeMovies}</option>
                <option value="politics">{labels.typePolitics}</option>
                <option value="business">{labels.typeBusiness}</option>
                <option value="technology">{labels.typeTechnology}</option>
                <option value="sports">{labels.typeSports}</option>
                <option value="health">{labels.typeHealth}</option>
                <option value="world">{labels.typeWorld}</option>
                <option value="culture">{labels.typeCulture}</option>
                <option value="environment">{labels.typeEnvironment}</option>
                <option value="crime">{labels.typeCrime}</option>
                <option value="education">{labels.typeEducation}</option>
                <option value="other">{labels.typeOther}</option>
              </select>
            </label>
          </>
        ) : (
          <Alert severity="info" sx={{ py: 0 }}>
            {labels.perfAIFiltersHidden}
          </Alert>
        )}
        <label className="checkbox" title="Apply one budget to all columns">
          <span id="allBudgetPrefix">{labels.allBudgetPrefix}</span>
          <select
            id="allBudgetSelect"
            className="select"
            value={allBudget}
            disabled={!aiAvailable}
            onChange={e => {
              const budget = e.target.value as Budget;
              if (budget !== 'mixed') onApplyAllBudget(budget);
            }}
          >
            <option value="mixed">{labels.budgetMixed}</option>
            <option value="low">{labels.budgetLow}</option>
            <option value="standard">{labels.budgetStandard}</option>
            <option value="high">{labels.budgetHigh}</option>
          </select>
        </label>
        {!aiAvailable ? (
          <Alert severity="info" sx={{ py: 0 }}>
            {labels.aiUnavailable}
          </Alert>
        ) : null}
      </div>
    </details>
  );
}
