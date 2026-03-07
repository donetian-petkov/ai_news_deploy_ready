'use client';

import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
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
import { useTopMenuAiAccount } from './useTopMenuAiAccount';

export function TopMenuAiSettingsSection() {
  const {
    labels,
    controls: {
      model: { aiSettings },
      actions
    }
  } = useTopMenuContext();

  const providerModels = aiSettings.availableModels[aiSettings.aiProvider];
  const [keywordsDraft, setKeywordsDraft] = useState(aiSettings.keywords.join(', '));
  const account = useTopMenuAiAccount({
    provider: aiSettings.aiProvider,
    labels,
    onSwitchProvider: actions.onChangeAiProvider
  });

  useEffect(() => {
    setKeywordsDraft(aiSettings.keywords.join(', '));
  }, [aiSettings.keywords]);

  const addKeywords = () => {
    const additions = String(keywordsDraft || '')
      .split(/[,\n]+/g)
      .map(v => v.trim())
      .filter(Boolean);
    if (!additions.length) return;
    const seen = new Set(aiSettings.keywords.map(v => v.toLocaleLowerCase()));
    const next = [...aiSettings.keywords];
    additions.forEach(v => {
      const key = v.toLocaleLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      next.push(v);
    });
    actions.onSetKeywords(next);
    setKeywordsDraft('');
  };

  const removeKeyword = (keyword: string) => {
    const target = keyword.toLocaleLowerCase();
    actions.onSetKeywords(aiSettings.keywords.filter(v => v.toLocaleLowerCase() !== target));
  };

  return (
    <details className="controlSection" open>
      <summary id="aiSettingsSummary">{labels.aiSettingsSummary}</summary>
      <div className="controlGroup">
        <TopMenuSelectField
          id="aiProviderSelect"
          label={labels.aiProvider}
          value={aiSettings.aiProvider}
          onChange={account.switchProviderWithSavedKey}
          options={buildAiProviderOptions(labels)}
        />

        <Box sx={{ width: '100%', border: '1px solid var(--ctl-border)', borderRadius: 2, p: 1 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
            {labels.authAccountTitle}
          </Typography>

          {account.user ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 1 }}>
              <Typography variant="caption">{labels.authSignedInAs}: {account.user.username}</Typography>
              <Button size="small" variant="outlined" onClick={account.signOut} disabled={account.busy}>
                {labels.authSignOut}
              </Button>
            </Stack>
          ) : (
            <Stack spacing={1} sx={{ mb: 1 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  size="small"
                  fullWidth
                  label={labels.authUsername}
                  value={account.username}
                  onChange={e => account.setUsername(e.target.value)}
                />
                <TextField
                  size="small"
                  fullWidth
                  type="password"
                  label={labels.authPassword}
                  value={account.password}
                  onChange={e => account.setPassword(e.target.value)}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button size="small" variant="contained" onClick={account.signIn} disabled={account.busy}>
                  {labels.authSignIn}
                </Button>
                <Button size="small" variant="outlined" onClick={account.register} disabled={account.busy}>
                  {labels.authRegister}
                </Button>
              </Stack>
            </Stack>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1 }}>
            <TextField
              size="small"
              fullWidth
              type="password"
              label={labels.authApiKey}
              placeholder={labels.authApiKeyPlaceholder}
              value={account.apiKey}
              onChange={e => account.setApiKey(e.target.value)}
              disabled={!account.user || account.busy}
            />
            <Button
              size="small"
              variant="contained"
              onClick={account.saveCurrentProviderKey}
              disabled={!account.user || account.busy || !String(account.apiKey || '').trim()}
            >
              {labels.authSaveKey}
            </Button>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 1 }}>
            <Typography variant="caption">
              {account.hasSavedKey ? labels.authKeyStoredYes : labels.authKeyStoredNo}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => account.switchProviderWithSavedKey(aiSettings.aiProvider)}
              disabled={!account.user || !account.hasSavedKey || account.busy}
            >
              {labels.authApplyProvider}
            </Button>
          </Stack>

          {account.message ? (
            <Alert severity={account.message.kind} sx={{ py: 0 }}>
              {account.message.text}
            </Alert>
          ) : null}
        </Box>

        <Box sx={{ width: '100%', border: '1px solid var(--ctl-border)', borderRadius: 2, p: 1 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.8 }}>
            {labels.matchKeywordsLabel || 'Filtered match keywords'}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              size="small"
              fullWidth
              label={labels.matchKeywordsInputLabel || 'Keywords'}
              placeholder={labels.matchKeywordsPlaceholder || 'keyword1, keyword2, keyword3'}
              value={keywordsDraft}
              onChange={e => setKeywordsDraft(e.target.value)}
            />
            <Button
              size="small"
              variant="contained"
              onClick={addKeywords}
              disabled={!String(keywordsDraft || '').trim()}
            >
              {labels.matchKeywordsApply || 'Add'}
            </Button>
          </Stack>
          {aiSettings.keywords.length ? (
            <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
              {aiSettings.keywords.map(keyword => (
                <Chip
                  key={keyword.toLocaleLowerCase()}
                  size="small"
                  label={keyword}
                  onDelete={() => removeKeyword(keyword)}
                />
              ))}
            </Stack>
          ) : null}
        </Box>

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
