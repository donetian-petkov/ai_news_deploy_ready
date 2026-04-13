'use client';

import { Box, FormControlLabel, Switch } from '@mui/material';
import { UiButton } from '../design-system/UiButton';
import { TopMenuSelectField } from './TopMenuSelectField';
import { useTopMenuContext } from './context/useTopMenuContext';

export function TopMenuControlsQuickRow() {
  const {
    isMobile,
    labels,
    controls: {
      model: { deleteAgeAll, quickRow },
      actions
    }
  } = useTopMenuContext();

  const onDeleteAgeChange = (next: typeof deleteAgeAll) => actions.onDeleteAgeAllChange(next);

  return (
    <div className="controlsCompactRow controlsRow">
      <div className={['controlGroup', 'controlGroupQuickRow', isMobile ? 'controlGroupQuickRowMobile' : ''].filter(Boolean).join(' ')}>
        <UiButton className="topMenuQuickAction" id="resetBtn" onClick={actions.onResetAllNewest}>{labels.resetAllToNewestTen}</UiButton>
        <UiButton className="topMenuQuickAction" id="showMoreNewsAllBtn" onClick={actions.onShowMoreNewsAll}>
          {labels.showMoreNewsAll}
        </UiButton>
        <UiButton className="topMenuQuickAction" id="resetNewsShownAllBtn" onClick={actions.onResetNewsShownAll}>
          {labels.resetNewsShownAll}
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
