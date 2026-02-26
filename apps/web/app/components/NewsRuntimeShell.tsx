export default function NewsRuntimeShell() {
  return (
    <>
      <div className="container">
        <div id="grid"></div>
      </div>

      <div id="helpOverlay" role="dialog" aria-modal="true">
        <div id="helpModal">
          <div id="helpTopRow">
            <h2 id="helpTitle" style={{ margin: 0, fontSize: 14, letterSpacing: '0.2px' }}>Help</h2>
            <button id="helpClose" className="btn" type="button">Close</button>
          </div>
          <ul id="helpList" className="helpList"></ul>
        </div>
      </div>

      <div id="toast" aria-live="polite"></div>
    </>
  );
}
