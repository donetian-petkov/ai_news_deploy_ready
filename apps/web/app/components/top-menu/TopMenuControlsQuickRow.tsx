'use client';

import type { ChangeEvent } from 'react';

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
        <button id="resetBtn" className="btn" type="button" onClick={onResetAllNewest}>{labels.resetAllToNewestTen}</button>
        <button id="showMoreNewsAllBtn" className="btn" type="button" onClick={onShowMoreNewsAll}>
          {labels.showMoreNewsAll}
        </button>
        <button id="resetNewsShownAllBtn" className="btn" type="button" onClick={onResetNewsShownAll}>
          {labels.resetNewsShownAll}
        </button>
        <label className="checkbox" title="Delete old news by age from all columns">
          <span id="deleteAgePrefix">{labels.deleteAgePrefix}</span>
          <select id="deleteAgeSelect" className="select" value={deleteAgeAll} onChange={onDeleteAgeChange}>
            <option value="yesterday">{labels.ageYesterday}</option>
            <option value="week">{labels.agePastWeek}</option>
            <option value="month">{labels.agePastMonth}</option>
            <option value="year">{labels.agePastYear}</option>
          </select>
        </label>
        <button id="deleteAgeAllBtn" className="btn danger" type="button" onClick={onDeleteOldAllColumns}>{labels.deleteOldAllColumns}</button>
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
        <button id="helpBtn" className="btn" type="button" onClick={onOpenHelp}>{labels.helpTitle}</button>
      </div>
    </div>
  );
}
