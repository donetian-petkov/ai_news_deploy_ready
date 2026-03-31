'use client';

import { TopMenuSelectField } from './TopMenuSelectField';
import { useTopMenuContext } from './context/useTopMenuContext';

export function TopMenuNotificationsSection() {
  const {
    isMobile,
    labels,
    controls: {
      model: { notifications },
      actions
    }
  } = useTopMenuContext();

  return (
    <details className="controlSection controlSectionNotifications" open>
      <summary id="notificationsSummary">{labels.notificationsSummary}</summary>
      <div className="controlGroup controlGroupNotifications">
        <label className="checkbox">
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
          options={[
            { value: 'matched', label: labels.notifyOnlyMatched },
            { value: 'matched_pinned', label: labels.notifyMatchedPinned },
            { value: 'pinned', label: labels.notifyOnlyPinned },
            { value: 'all', label: labels.notifyAllColumns }
          ]}
          layout={isMobile ? 'stacked' : 'inline'}
        />
      </div>
    </details>
  );
}
