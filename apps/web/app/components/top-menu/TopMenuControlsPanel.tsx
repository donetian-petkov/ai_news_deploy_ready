'use client';

import { TopMenuControlsQuickRow } from './TopMenuControlsQuickRow';
import { TopMenuAccountSection } from './TopMenuAccountSection';
import { TopMenuNotificationsSection } from './TopMenuNotificationsSection';
import { TopMenuAiSettingsSection } from './TopMenuAiSettingsSection';
import { TopMenuAppearanceSection } from './TopMenuAppearanceSection';
import { useTopMenuContext } from './context/useTopMenuContext';

export function TopMenuControlsPanel() {
  const {
    labels,
    controls: { model }
  } = useTopMenuContext();

  return (
    <div className={`controls${model.collapsed ? ' controlsHidden' : ''}`}>
      <TopMenuControlsQuickRow />

      <div className="controlsHint" id="controlsHint">
        {labels.controlsHint}
      </div>

      <div className="controlsGrid">
        <div className="controlsCell controlsCellNotifications">
          <div className="controlsCellStack">
            <TopMenuAccountSection />
            <TopMenuNotificationsSection />
          </div>
        </div>
        <div className="controlsCell controlsCellAi">
          <TopMenuAiSettingsSection />
        </div>
        <div className="controlsCell controlsCellAppearance">
          <TopMenuAppearanceSection />
        </div>
      </div>
    </div>
  );
}
