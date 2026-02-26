export default function TopMenu() {
  return (
    <div className="topbar">
      <div className="topbarInner" id="topbarInner">
        <div className="headerRow">
          <div className="headerLeft">
            <h1 id="appTitle">Live News Stream</h1>
            <div className="subHint" id="subHint">
              Drag columns · <b>?</b> Help · <b>M</b> Menu · <b>/</b> Search
            </div>
          </div>
          <div className="headerRight">
            <div id="status" className="statusPill">Connecting...</div>
            <div id="tokenUsage" className="statusPill">Tokens: 0</div>
            <label className="checkbox topQuickLabel" title="Quick vibe switch">
              <span id="quickVibeLabelText">Vibe:</span>
              <select id="quickVibeSelect" className="select topQuickSelect" defaultValue="default">
                <option value="default">Default</option>
                <option value="anime">Anime Pop</option>
                <option value="arcade">Video Game</option>
                <option value="cinema">Movie Night</option>
                <option value="newspaper">Newspaper</option>
                <option value="cyberwitch">Cyber Witch</option>
                <option value="fantasy">Fantasy</option>
                <option value="scifi">Sci-Fi</option>
              </select>
            </label>
            <button id="quickSearchBtn" className="btn ghost" type="button">Search</button>
            <button id="quickAddStreamBtn" className="btn ghost" type="button">Add Stream</button>
            <button id="controlsToggle" className="btn ghost" type="button">Hide top controls</button>
            <button id="allColControlsToggle" className="btn ghost" type="button">Hide all column controls</button>
            <button id="hideAllResearchBtn" className="btn ghost" type="button">Hide all research</button>
            <button id="menuToggle" className="btn ghost" type="button">Hide menu</button>
          </div>
        </div>

        <div className="controls">
          <div className="controlsCompactRow controlsRow">
            <div className="controlGroup">
              <button id="resetBtn" className="btn" type="button">Reset ALL to newest 10</button>
              <label className="checkbox" title="Delete old news by age from all columns">
                <span id="deleteAgePrefix">Delete age:</span>
                <select id="deleteAgeSelect" className="select" defaultValue="week">
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Past week</option>
                  <option value="month">Past month</option>
                  <option value="year">Past year</option>
                </select>
              </label>
              <button id="deleteAgeAllBtn" className="btn danger" type="button">Delete old (all columns)</button>
              <label className="checkbox" title="Embeddings matching, AI dedupe, summaries, research">
                <input id="aiEnabled" type="checkbox" />
                <span id="aiEnabledLabel">AI Enabled</span>
              </label>
              <button id="helpBtn" className="btn" type="button">Help</button>
            </div>
          </div>
          <div className="controlsHint" id="controlsHint">
            Click section headers below to expand/collapse settings.
          </div>

          <div className="controlsGrid">
            <details className="controlSection" open>
              <summary id="notificationsSummary">Notifications</summary>
              <div className="controlGroup">
                <label className="checkbox">
                  <input id="notifyEnabled" type="checkbox" />
                  <span id="notifyEnabledLabel">Enable notifications</span>
                </label>
                <label className="checkbox">
                  <span id="notifyPrefix">Notify:</span>
                  <select id="notifyMode" className="select" defaultValue="matched">
                    <option value="matched">Only matched</option>
                    <option value="matched_pinned">Matched + pinned columns</option>
                    <option value="pinned">Only pinned columns</option>
                    <option value="all">All columns</option>
                  </select>
                </label>
              </div>
            </details>

            <details className="controlSection" open>
              <summary id="aiSettingsSummary">AI Settings</summary>
              <div className="controlGroup">
                <label className="checkbox">
                  <span id="summaryLangPrefix">Summary:</span>
                  <select id="summaryLang" className="select" defaultValue="bilingual">
                    <option value="bilingual">BG / EN</option>
                    <option value="bg">BG</option>
                    <option value="en">EN</option>
                  </select>
                </label>
                <label className="checkbox">
                  <span id="researchLangPrefix">Research:</span>
                  <select id="researchLang" className="select" defaultValue="bg">
                    <option value="bg">BG</option>
                    <option value="en">EN</option>
                  </select>
                </label>
                <label className="checkbox" title="Apply one budget to all columns">
                  <span id="allBudgetPrefix">AI Budget (all):</span>
                  <select id="allBudgetSelect" className="select" defaultValue="standard">
                    <option value="mixed">Mixed</option>
                    <option value="low">Low</option>
                    <option value="standard">Standard</option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>
            </details>

            <details className="controlSection" open>
              <summary id="appearanceSummary">Appearance</summary>
              <div className="controlGroup" id="appearanceGroup">
                <label className="checkbox" title="Change UI font">
                  <span id="fontPrefix">Font:</span>
                  <select id="fontSelect" className="select" defaultValue="system">
                    <option value="system">System</option>
                    <option value="manrope">Manrope</option>
                    <option value="grotesk">Space Grotesk</option>
                    <option value="sora">Sora</option>
                    <option value="plex">IBM Plex Sans</option>
                    <option value="serif">Serif</option>
                    <option value="mono">Mono</option>
                  </select>
                </label>
                <label className="checkbox" title="Scale text size">
                  <span id="fontSizePrefix">Font size:</span>
                  <select id="fontSizeSelect" className="select" defaultValue="md">
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                    <option value="xl">Extra Large</option>
                  </select>
                </label>
                <label className="checkbox" title="Column accent scheme">
                  <span id="schemePrefix">Scheme:</span>
                  <select id="schemeSelect" className="select" defaultValue="classic">
                    <option value="classic">Classic</option>
                    <option value="vivid">Vivid</option>
                    <option value="sunset">Sunset</option>
                    <option value="neon">Neon</option>
                    <option value="ocean">Ocean</option>
                    <option value="forest">Forest</option>
                  </select>
                </label>
                <label className="checkbox" title="Item buttons look">
                  <span id="buttonsPrefix">Buttons:</span>
                  <select id="btnModeSelect" className="select" defaultValue="icons">
                    <option value="icons">Icons</option>
                    <option value="text">Text</option>
                  </select>
                </label>
                <label className="checkbox" title="Visual vibe preset">
                  <span id="vibePrefix">Vibe:</span>
                  <select id="vibeSelect" className="select" defaultValue="default">
                    <option value="default">Default</option>
                    <option value="anime">Anime Pop</option>
                    <option value="arcade">Video Game</option>
                    <option value="cinema">Movie Night</option>
                    <option value="newspaper">Newspaper</option>
                    <option value="cyberwitch">Cyber Witch</option>
                    <option value="fantasy">Fantasy</option>
                    <option value="scifi">Sci-Fi</option>
                  </select>
                </label>
                <label className="checkbox" title="Interface language">
                  <span id="interfaceLangPrefix">Interface:</span>
                  <select id="interfaceLang" className="select" defaultValue="en">
                    <option value="en">EN</option>
                    <option value="bg">BG</option>
                  </select>
                </label>
              </div>
            </details>
          </div>

          <details id="searchSection" className="controlSection controlSectionWide" open>
            <summary id="searchSummary">Search</summary>
            <div className="searchRow">
              <input
                id="searchInput"
                className="input"
                placeholder="Search (title + summary + research)..."
              />
              <button id="clearSearchBtn" className="btn" type="button">Clear</button>
            </div>
            <div id="searchInfo"></div>
          </details>

          <details id="addStreamSection" className="controlSection controlSectionWide">
            <summary id="addStreamSummary">Add Stream</summary>
            <div className="addRow addRow4">
              <select id="feedType" className="select" defaultValue="rss">
                <option value="rss">RSS</option>
                <option value="reddit">Reddit (subreddit)</option>
                <option value="youtube">YouTube (channel)</option>
              </select>

              <input id="feedUrl" className="input" placeholder="Paste RSS URL OR subreddit OR YouTube channel URL..." />
              <input id="feedLabel" className="input" placeholder="Optional label" />

              <select id="feedInterval" className="select" title="Polling interval" defaultValue="120">
                <option value="45">45s</option>
                <option value="60">60s</option>
                <option value="90">90s</option>
                <option value="120">120s</option>
                <option value="180">180s</option>
                <option value="300">300s</option>
              </select>

              <button id="addFeedBtn" className="btn" type="button">Add Stream</button>
            </div>
            <div id="addFeedStatus"></div>
          </details>
        </div>
      </div>
    </div>
  );
}
