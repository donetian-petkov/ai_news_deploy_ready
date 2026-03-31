'use client';

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
          wrapperClassName="topMenuQuickSelect"
          options={[
            { value: 'yesterday', label: labels.ageYesterday },
            { value: 'week', label: labels.agePastWeek },
            { value: 'month', label: labels.agePastMonth },
            { value: 'year', label: labels.agePastYear }
          ]}
        />
        <UiButton className="topMenuQuickAction" id="deleteAgeAllBtn" variant="danger" onClick={actions.onDeleteOldAllColumns}>{labels.deleteOldAllColumns}</UiButton>
        <label className={isMobile ? 'checkbox topMenuQuickToggle' : 'checkbox'} title="Embeddings matching, AI dedupe, summaries, research">
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
        <UiButton className="topMenuQuickAction" id="helpBtn" onClick={actions.onOpenHelp}>{labels.helpTitle}</UiButton>
      </div>
    </div>
  );
}
