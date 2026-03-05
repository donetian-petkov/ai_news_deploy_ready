'use client';

import type { ChangeEvent } from 'react';
import { UiButton } from '../design-system/UiButton';
import { UiSelect } from '../design-system/UiSelect';
import { useTopMenuContext } from './context/useTopMenuContext';

export function TopMenuControlsQuickRow() {
  const {
    labels,
    controls: {
      model: { deleteAgeAll, quickRow },
      actions
    }
  } = useTopMenuContext();

  const onDeleteAgeChange = (e: ChangeEvent<HTMLSelectElement>) => actions.onDeleteAgeAllChange(e.target.value as typeof deleteAgeAll);

  return (
    <div className="controlsCompactRow controlsRow">
      <div className="controlGroup">
        <UiButton id="resetBtn" onClick={actions.onResetAllNewest}>{labels.resetAllToNewestTen}</UiButton>
        <UiButton id="showMoreNewsAllBtn" onClick={actions.onShowMoreNewsAll}>
          {labels.showMoreNewsAll}
        </UiButton>
        <UiButton id="resetNewsShownAllBtn" onClick={actions.onResetNewsShownAll}>
          {labels.resetNewsShownAll}
        </UiButton>
        <UiSelect
          id="deleteAgeSelect"
          label={labels.deleteAgePrefix}
          labelId="deleteAgePrefix"
          title="Delete old news by age from all columns"
          value={deleteAgeAll}
          onChange={onDeleteAgeChange}
        >
          <option value="yesterday">{labels.ageYesterday}</option>
          <option value="week">{labels.agePastWeek}</option>
          <option value="month">{labels.agePastMonth}</option>
          <option value="year">{labels.agePastYear}</option>
        </UiSelect>
        <UiButton id="deleteAgeAllBtn" variant="danger" onClick={actions.onDeleteOldAllColumns}>{labels.deleteOldAllColumns}</UiButton>
        <label className="checkbox" title="Embeddings matching, AI dedupe, summaries, research">
          {quickRow.aiAvailable ? (
            <>
              <input
                id="aiEnabled"
                type="checkbox"
                checked={quickRow.aiEnabled}
                disabled={!quickRow.aiAvailable}
                onChange={e => actions.onToggleAiEnabled(e.target.checked)}
              />
              <span id="aiEnabledLabel">{labels.aiEnabledLabel}</span>
            </>
          ) : (
            <span id="aiUnavailableLabel">{labels.aiUnavailable}</span>
          )}
        </label>
        <UiButton id="helpBtn" onClick={actions.onOpenHelp}>{labels.helpTitle}</UiButton>
      </div>
    </div>
  );
}
