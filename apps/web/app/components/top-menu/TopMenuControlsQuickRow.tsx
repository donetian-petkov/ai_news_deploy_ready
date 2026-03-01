'use client';

import type { ChangeEvent } from 'react';
import { UiButton } from '../design-system/UiButton';
import { UiSelect } from '../design-system/UiSelect';

type DeleteAge = 'yesterday' | 'week' | 'month' | 'year';

type TopMenuControlsQuickRowProps = {
  labels: Record<string, string>;
  aiAvailable: boolean;
  aiEnabled: boolean;
  deleteAgeAll: DeleteAge;
  onDeleteAgeAllChange: (age: DeleteAge) => void;
  onResetAllNewest: () => void;
  onShowMoreNewsAll: () => void;
  onResetNewsShownAll: () => void;
  onDeleteOldAllColumns: () => void;
  onToggleAiEnabled: (enabled: boolean) => void;
  onOpenHelp: () => void;
};

export function TopMenuControlsQuickRow({
  labels,
  aiAvailable,
  aiEnabled,
  deleteAgeAll,
  onDeleteAgeAllChange,
  onResetAllNewest,
  onShowMoreNewsAll,
  onResetNewsShownAll,
  onDeleteOldAllColumns,
  onToggleAiEnabled,
  onOpenHelp
}: TopMenuControlsQuickRowProps) {
  const onDeleteAgeChange = (e: ChangeEvent<HTMLSelectElement>) => onDeleteAgeAllChange(e.target.value as DeleteAge);

  return (
    <div className="controlsCompactRow controlsRow">
      <div className="controlGroup">
        <UiButton id="resetBtn" onClick={onResetAllNewest}>{labels.resetAllToNewestTen}</UiButton>
        <UiButton id="showMoreNewsAllBtn" onClick={onShowMoreNewsAll}>
          {labels.showMoreNewsAll}
        </UiButton>
        <UiButton id="resetNewsShownAllBtn" onClick={onResetNewsShownAll}>
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
        <UiButton id="deleteAgeAllBtn" variant="danger" onClick={onDeleteOldAllColumns}>{labels.deleteOldAllColumns}</UiButton>
        <label className="checkbox" title="Embeddings matching, AI dedupe, summaries, research">
          {aiAvailable ? (
            <>
              <input
                id="aiEnabled"
                type="checkbox"
                checked={aiEnabled}
                disabled={!aiAvailable}
                onChange={e => onToggleAiEnabled(e.target.checked)}
              />
              <span id="aiEnabledLabel">{labels.aiEnabledLabel}</span>
            </>
          ) : (
            <span id="aiUnavailableLabel">{labels.aiUnavailable}</span>
          )}
        </label>
        <UiButton id="helpBtn" onClick={onOpenHelp}>{labels.helpTitle}</UiButton>
      </div>
    </div>
  );
}
