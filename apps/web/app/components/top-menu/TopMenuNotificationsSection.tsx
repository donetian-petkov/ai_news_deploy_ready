'use client';

type NotifyMode = 'matched' | 'matched_pinned' | 'pinned' | 'all';

type TopMenuNotificationsSectionProps = {
  labels: Record<string, string>;
  notifyEnabled: boolean;
  notifyMode: NotifyMode;
  onNotifyEnabledChange: (enabled: boolean) => void;
  onNotifyModeChange: (mode: NotifyMode) => void;
};

export function TopMenuNotificationsSection({
  labels,
  notifyEnabled,
  notifyMode,
  onNotifyEnabledChange,
  onNotifyModeChange
}: TopMenuNotificationsSectionProps) {
  return (
    <details className="controlSection" open>
      <summary id="notificationsSummary">{labels.notificationsSummary}</summary>
      <div className="controlGroup">
        <label className="checkbox">
          <input
            id="notifyEnabled"
            type="checkbox"
            checked={notifyEnabled}
            onChange={e => onNotifyEnabledChange(e.target.checked)}
          />
          <span id="notifyEnabledLabel">{labels.notifyEnabledLabel}</span>
        </label>
        <label className="checkbox">
          <span id="notifyPrefix">{labels.notifyPrefix}</span>
          <select
            id="notifyMode"
            className="select"
            value={notifyMode}
            onChange={e => onNotifyModeChange(e.target.value as NotifyMode)}
          >
            <option value="matched">{labels.notifyOnlyMatched}</option>
            <option value="matched_pinned">{labels.notifyMatchedPinned}</option>
            <option value="pinned">{labels.notifyOnlyPinned}</option>
            <option value="all">{labels.notifyAllColumns}</option>
          </select>
        </label>
      </div>
    </details>
  );
}
