'use client';

import { TopMenuSelectField } from './TopMenuSelectField';
import { useTopMenuContext } from './context/useTopMenuContext';

export function TopMenuNotificationsSection() {
  const {
    labels,
    controls: {
      model: { notifications },
      actions
    }
  } = useTopMenuContext();

  return (
    <details className="controlSection controlSectionNotifications" open>
      <summary id="notificationsSummary">{labels.notificationsSummary}</summary>
      <div className="controlGroup controlGroupNotifications topMenuFieldGrid">
        <label className="checkbox topMenuToggleField topMenuField">
          <input
            id="notifyEnabled"
            type="checkbox"
            checked={notifications.notifyEnabled}
            onChange={e => actions.onNotifyEnabledChange(e.target.checked)}
          />
          <span id="notifyEnabledLabel">{labels.notifyEnabledLabel}</span>
        </label>
        <TopMenuSelectField
          id="notifyMode"
          label={labels.notifyPrefix}
          value={notifications.notifyMode}
          onChange={actions.onNotifyModeChange}
          wrapperClassName="topMenuField"
          options={[
            { value: 'matched', label: labels.notifyOnlyMatched },
            { value: 'matched_pinned', label: labels.notifyMatchedPinned },
            { value: 'pinned', label: labels.notifyOnlyPinned },
            { value: 'all', label: labels.notifyAllColumns }
          ]}
          layout="stacked"
        />
      </div>
    </details>
  );
}
