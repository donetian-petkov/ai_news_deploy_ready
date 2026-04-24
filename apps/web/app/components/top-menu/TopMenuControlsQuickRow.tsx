'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, FormControlLabel, Switch } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { UiButton } from '../design-system/UiButton';
import { TopMenuSelectField } from './TopMenuSelectField';
import { getDefaultVisibleCount, getShowMoreStep } from '../columns/storyVisibility';
import { useTopMenuContext } from './context/useTopMenuContext';

export function TopMenuControlsQuickRow() {
  const { t } = useTranslation();
  const {
    isMobile,
    labels,
    controls: {
      model: { deleteAgeAll, quickRow },
      actions
    }
  } = useTopMenuContext();
  const presetStoryCounts = useMemo(() => [5, 10, 15, 20], []);
  const storiesPerColumn = quickRow.storiesPerColumn;
  const [customStoriesDraft, setCustomStoriesDraft] = useState(String(storiesPerColumn));
  const onDeleteAgeChange = (next: typeof deleteAgeAll) => actions.onDeleteAgeAllChange(next);
  const selectedStoryPreset = presetStoryCounts.includes(storiesPerColumn) ? String(storiesPerColumn) : 'custom';
  const parsedCustomStories = Math.floor(Number(customStoriesDraft));
  const customStoriesValid = Number.isFinite(parsedCustomStories) && parsedCustomStories >= 1;
  const resetShownCount = getDefaultVisibleCount(storiesPerColumn);
  const showMoreAllCount = getShowMoreStep(undefined, storiesPerColumn);

  useEffect(() => {
    setCustomStoriesDraft(String(storiesPerColumn));
  }, [storiesPerColumn]);

  return (
    <div className="controlsCompactRow controlsRow">
      <div className={['controlGroup', 'controlGroupQuickRow', isMobile ? 'controlGroupQuickRowMobile' : ''].filter(Boolean).join(' ')}>
        <UiButton className="topMenuQuickAction" id="resetBtn" onClick={actions.onResetAllNewest}>
          {t('topMenu.resetAllToNewestCount', { count: storiesPerColumn })}
        </UiButton>
        <UiButton className="topMenuQuickAction" id="showMoreNewsAllBtn" onClick={actions.onShowMoreNewsAll}>
          {t('topMenu.showMoreNewsAllCount', { count: showMoreAllCount })}
        </UiButton>
        <UiButton className="topMenuQuickAction" id="resetNewsShownAllBtn" onClick={actions.onResetNewsShownAll}>
          {t('topMenu.resetNewsShownAllCount', { count: resetShownCount })}
        </UiButton>
        <TopMenuSelectField
          id="storiesPerColumnSelect"
          label={labels.storiesPerColumnPrefix}
          title="Set the maximum stories shown per column"
          value={selectedStoryPreset}
          onChange={value => {
            if (value === 'custom') return;
            actions.onSetStoriesPerColumn(Number(value) || storiesPerColumn);
          }}
          layout={isMobile ? 'stacked' : 'inline'}
          wrapperClassName="topMenuQuickSelect topMenuField"
          options={[
            ...presetStoryCounts.map(count => ({ value: String(count), label: String(count) })),
            { value: 'custom', label: labels.storiesCustom }
          ]}
        />
        <label className={isMobile ? 'checkbox topMenuQuickToggle topMenuField' : 'checkbox topMenuField'} title="Set a custom stories-per-column limit">
          <span>{labels.storiesCustom}</span>
          <input
            id="storiesPerColumnCustom"
            className="input"
            type="number"
            min="1"
            step="1"
            value={customStoriesDraft}
            placeholder={labels.storiesCustomPlaceholder}
            onChange={e => setCustomStoriesDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key !== 'Enter' || !customStoriesValid) return;
              actions.onSetStoriesPerColumn(parsedCustomStories);
            }}
            style={{ width: isMobile ? '100%' : 96 }}
          />
        </label>
        <UiButton
          className="topMenuQuickAction"
          id="storiesPerColumnApplyBtn"
          onClick={() => {
            if (!customStoriesValid) return;
            actions.onSetStoriesPerColumn(parsedCustomStories);
          }}
          disabled={!customStoriesValid || parsedCustomStories === storiesPerColumn}
        >
          {labels.applyStoriesLimit}
        </UiButton>
        <TopMenuSelectField
          id="deleteAgeSelect"
          label={labels.deleteAgePrefix}
          title="Delete old news by age from all columns"
          value={deleteAgeAll}
          onChange={onDeleteAgeChange}
          layout={isMobile ? 'stacked' : 'inline'}
          wrapperClassName="topMenuQuickSelect topMenuField"
          options={[
            { value: 'yesterday', label: labels.ageYesterday },
            { value: 'week', label: labels.agePastWeek },
            { value: 'month', label: labels.agePastMonth },
            { value: 'year', label: labels.agePastYear }
          ]}
        />
        <UiButton className="topMenuQuickAction" id="deleteAgeAllBtn" variant="danger" onClick={actions.onDeleteOldAllColumns}>{labels.deleteOldAllColumns}</UiButton>
        <Box className="topMenuQuickToggle topMenuField" title="Embeddings matching, AI dedupe, summaries, research">
          {quickRow.aiAvailable ? (
            <FormControlLabel
              control={(
                <Switch
                  id="aiEnabled"
                  size="small"
                  checked={quickRow.aiEnabled}
                  disabled={!quickRow.aiAvailable}
                  onChange={e => actions.onToggleAiEnabled(e.target.checked)}
                  sx={{ ml: 0.25, mr: 0.75 }}
                />
              )}
              label={<span id="aiEnabledLabel">{labels.aiEnabledLabel}</span>}
              sx={{ alignItems: 'center', m: 0, width: '100%', '.MuiFormControlLabel-label': { minWidth: 0, flex: 1 } }}
            />
          ) : (
            <span id="aiUnavailableLabel">{labels.aiUnavailable}</span>
          )}
        </Box>
        <UiButton className="topMenuQuickAction" id="helpBtn" onClick={actions.onOpenHelp}>{labels.helpTitle}</UiButton>
      </div>
    </div>
  );
}
