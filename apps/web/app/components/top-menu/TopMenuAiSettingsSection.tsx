'use client';

import { Alert } from '@mui/material';
import {
  NewsMoodFilterValue,
  NewsTypeFilterValue,
  type MoodFilter,
  type TypeFilter
} from '../../store/types';

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
                <option value={NewsMoodFilterValue.All}>{labels.moodAll}</option>
                <option value={NewsMoodFilterValue.Pesimistic}>{labels.moodPesimistic}</option>
                <option value={NewsMoodFilterValue.Optimistic}>{labels.moodOptimistic}</option>
                <option value={NewsMoodFilterValue.Realistic}>{labels.moodRealistic}</option>
                <option value={NewsMoodFilterValue.Melancholy}>{labels.moodMelancholy}</option>
                <option value={NewsMoodFilterValue.Happiness}>{labels.moodHappiness}</option>
                <option value={NewsMoodFilterValue.Sadness}>{labels.moodSadness}</option>
                <option value={NewsMoodFilterValue.Rage}>{labels.moodRage}</option>
                <option value={NewsMoodFilterValue.Uncertainty}>{labels.moodUncertainty}</option>
                <option value={NewsMoodFilterValue.Neutral}>{labels.moodNeutral}</option>
                <option value={NewsMoodFilterValue.Curios}>{labels.moodCurios}</option>
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
                <option value={NewsTypeFilterValue.All}>{labels.typeAll}</option>
                <option value={NewsTypeFilterValue.Science}>{labels.typeScience}</option>
                <option value={NewsTypeFilterValue.Movies}>{labels.typeMovies}</option>
                <option value={NewsTypeFilterValue.Politics}>{labels.typePolitics}</option>
                <option value={NewsTypeFilterValue.Business}>{labels.typeBusiness}</option>
                <option value={NewsTypeFilterValue.Technology}>{labels.typeTechnology}</option>
                <option value={NewsTypeFilterValue.Sports}>{labels.typeSports}</option>
                <option value={NewsTypeFilterValue.Health}>{labels.typeHealth}</option>
                <option value={NewsTypeFilterValue.World}>{labels.typeWorld}</option>
                <option value={NewsTypeFilterValue.Culture}>{labels.typeCulture}</option>
                <option value={NewsTypeFilterValue.Environment}>{labels.typeEnvironment}</option>
                <option value={NewsTypeFilterValue.Crime}>{labels.typeCrime}</option>
                <option value={NewsTypeFilterValue.Education}>{labels.typeEducation}</option>
                <option value={NewsTypeFilterValue.Other}>{labels.typeOther}</option>
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
