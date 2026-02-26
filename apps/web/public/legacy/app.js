(() => {
  const status = document.getElementById('status');
  const grid = document.getElementById('grid');
  const topbarInnerEl = document.getElementById('topbarInner');
  const controlsEl = topbarInnerEl ? topbarInnerEl.querySelector('.controls') : null;

  const notifyEnabledEl = document.getElementById('notifyEnabled');
  const notifyModeEl = document.getElementById('notifyMode');
  const resetBtn = document.getElementById('resetBtn');
  const deleteAgeSelect = document.getElementById('deleteAgeSelect');
  const deleteAgeAllBtn = document.getElementById('deleteAgeAllBtn');

  const aiEnabledEl = document.getElementById('aiEnabled');
  const summaryLangEl = document.getElementById('summaryLang');
  const researchLangEl = document.getElementById('researchLang');
  const allBudgetSelect = document.getElementById('allBudgetSelect');

  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchInfo = document.getElementById('searchInfo');
  const searchSectionEl = document.getElementById('searchSection');
  const addStreamSectionEl = document.getElementById('addStreamSection');

  const feedTypeEl = document.getElementById('feedType');
  const feedUrlEl = document.getElementById('feedUrl');
  const feedLabelEl = document.getElementById('feedLabel');
  const feedIntervalEl = document.getElementById('feedInterval');
  const addFeedBtn = document.getElementById('addFeedBtn');
  const addFeedStatus = document.getElementById('addFeedStatus');

  const helpBtn = document.getElementById('helpBtn');
  const helpOverlay = document.getElementById('helpOverlay');
  const helpClose = document.getElementById('helpClose');
  const helpListEl = document.getElementById('helpList');

  const controlsToggle = document.getElementById('controlsToggle');
  const allColControlsToggle = document.getElementById('allColControlsToggle');
  const hideAllResearchBtn = document.getElementById('hideAllResearchBtn');
  const menuToggle = document.getElementById('menuToggle');
  const quickVibeSelect = document.getElementById('quickVibeSelect');
  const quickSearchBtn = document.getElementById('quickSearchBtn');
  const quickAddStreamBtn = document.getElementById('quickAddStreamBtn');
  const useReactTopMenu = !!window.__AI_NEWS_USE_REACT_TOPMENU;

  const fontSelect = document.getElementById('fontSelect');
  const fontSizeSelect = document.getElementById('fontSizeSelect');
  const schemeSelect = document.getElementById('schemeSelect');
  const btnModeSelect = document.getElementById('btnModeSelect');
  const vibeSelect = document.getElementById('vibeSelect');
  const interfaceLangEl = document.getElementById('interfaceLang');

  const tokenUsageEl = document.getElementById('tokenUsage');
  const toastEl = document.getElementById('toast');

  const FILTERED_FEED_URL = '__filtered__';

  // Theme
  const THEME_KEY = 'liveNews.theme';
  let theme = 'system'; // system | dark | light

  // Column order persistence
  const ORDER_KEY = 'liveNews.columnOrder';
  let savedOrder = null;

  // Column menu collapse persistence (NEW)
  const COL_MENU_KEY = 'liveNews.columnMenuOpenByFeed'; // map feedUrl => "1" | "0"
  const colMenuOpenByFeed = loadJsonMap(COL_MENU_KEY);
  const PINNED_FEEDS_KEY = 'liveNews.pinnedFeeds'; // map feedUrl => "1" | "0"
  const pinnedFeeds = loadJsonMap(PINNED_FEEDS_KEY);
  const CONTROLS_KEY = 'liveNews.controlsCollapsed';
  const NOTIFY_ENABLED_KEY = 'liveNews.notifyEnabled';
  const NOTIFY_MODE_KEY = 'liveNews.notifyMode';
  const FONT_SIZE_KEY = 'liveNews.fontSizePreset';
  const FONT_KEY = 'liveNews.fontPreset';
  const SCHEME_KEY = 'liveNews.colorScheme';
  const BTN_MODE_KEY = 'liveNews.buttonMode';
  const VIBE_KEY = 'liveNews.vibePreset';
  const UI_LANG_KEY = 'liveNews.uiLang';
  const BODY_PREVIEW_CHARS = 260;
  const ASK_AGENT_MAX_QUESTIONS = 5;
  const ASK_AGENT_MAX_CHARS = 400;
  const ASK_AGENT_MAX_MESSAGES = 24;

  const VIBE_BASE_COLORS = {
    default: ['#3d95ff', '#20cb7d', '#ffac1a'],
    anime: ['#ff4da6', '#38bdf8', '#ffe15c'],
    arcade: ['#39ff14', '#ff40ff', '#ffdd00'],
    cinema: ['#d2a85f', '#b4253a', '#f4c870'],
    newspaper: ['#4e627a', '#78808c', '#b27418'],
    cyberwitch: ['#b34cff', '#00ddff', '#ff74e6'],
    fantasy: ['#56a86e', '#886a4a', '#d9b054'],
    scifi: ['#00c9ff', '#707cff', '#74ffcf']
  };

  const SCHEME_TUNING = {
    classic: { hueShift: 0, satMul: 1.0, lightMul: 1.0, softAlpha: 0.26 },
    vivid: { hueShift: 10, satMul: 1.16, lightMul: 1.02, softAlpha: 0.30 },
    sunset: { hueShift: -22, satMul: 1.08, lightMul: 0.96, softAlpha: 0.29 },
    neon: { hueShift: 32, satMul: 1.28, lightMul: 1.04, softAlpha: 0.27 },
    ocean: { hueShift: -52, satMul: 1.03, lightMul: 0.94, softAlpha: 0.30 },
    forest: { hueShift: -105, satMul: 0.82, lightMul: 0.86, softAlpha: 0.28 }
  };

  // State
  const columns = {}; // feedUrl -> column element
  const store = {};   // feedUrl -> { items, seen, visible }
  let ws = null;

  let aiAvailable = false;
  let aiEnabledServer = false;

  let feedSettings = {}; // from server
  let hiddenIds = new Set();

  const forcedSummaryIds = new Set();

  let searchQuery = '';
  const flashKeys = new Map();
  const FLASH_MS = 2200;
  let buttonMode = 'icons';
  let uiLang = 'en';
  let tokenUsageValue = 0;
  let statusKey = 'connecting';

  const I18N = {
    en: {
      title_app: 'Live News Stream',
      sub_hint_html: 'Drag columns · <b>?</b> Help · <b>M</b> Menu · <b>/</b> Search',
      vibe_label: 'Vibe:',
      search: 'Search',
      hide_search: 'Hide Search',
      add_stream: 'Add Stream',
      hide_add_stream: 'Hide Add Stream',
      hide_top_controls: 'Hide top controls',
      show_top_controls: 'Show top controls',
      hide_all_column_controls: 'Hide all column controls',
      show_all_column_controls: 'Show all column controls',
      hide_all_research: 'Hide all research',
      hide_menu: 'Hide menu',
      show_menu: 'Show menu',
      reset_all_newest_10: 'Reset ALL to newest 10',
      delete_age: 'Delete age:',
      yesterday: 'Yesterday',
      past_week: 'Past week',
      past_month: 'Past month',
      past_year: 'Past year',
      delete_old_all_cols: 'Delete old (all columns)',
      ai_enabled: 'AI Enabled',
      help: 'Help',
      controls_hint: 'Click section headers below to expand/collapse settings.',
      notifications: 'Notifications',
      enable_notifications: 'Enable notifications',
      notify: 'Notify:',
      notify_only_matched: 'Only matched',
      notify_matched_pinned: 'Matched + pinned columns',
      notify_only_pinned: 'Only pinned columns',
      notify_all_columns: 'All columns',
      ai_settings: 'AI Settings',
      summary: 'Summary',
      research: 'Research',
      ai_budget_all: 'AI Budget (all):',
      mixed: 'Mixed',
      low: 'Low',
      standard: 'Standard',
      high: 'High',
      appearance: 'Appearance',
      font: 'Font',
      font_size: 'Font size',
      scheme: 'Scheme',
      buttons: 'Buttons',
      interface: 'Interface',
      clear: 'Clear',
      add_stream_summary: 'Add Stream',
      help_title: 'Help',
      close: 'Close',
      tokens: 'Tokens',
      color_mode: 'Color mode',
      color_mode_system: 'System',
      color_mode_dark: 'Dark',
      color_mode_light: 'Light',
      status_connecting: 'Connecting...',
      status_connected: 'Connected',
      status_reconnecting: 'Reconnecting...',
      status_socket_error: 'Socket error',
      notifications_toast: 'Notifications: {mode}',
      no_news_older_than: 'No news older than {age}',
      deleted_news_older_than: 'Deleted {count} news older than {age}',
      pinned: 'Pinned',
      unpinned: 'Unpinned',
      pin: 'Pin',
      unpin_column: 'Unpin column',
      pin_column: 'Pin column',
      remove: 'Remove',
      top: 'Top',
      newest: 'Newest',
      summaries_on: 'Summaries: ON',
      summaries_off: 'Summaries: OFF',
      auto_research_on: 'Auto Research: ON',
      auto_research_off: 'Auto Research: OFF',
      budget_low: 'Budget: Low',
      budget_standard: 'Budget: Standard',
      budget_high: 'Budget: High',
      sort_newest: 'Sort: Newest',
      sort_oldest: 'Sort: Oldest',
      sort_matched: 'Sort: Matched',
      poll_interval: 'Poll: {sec}s',
      delete_yesterday: 'Delete: Yesterday',
      delete_week: 'Delete: Past week',
      delete_month: 'Delete: Past month',
      delete_year: 'Delete: Past year',
      delete_old: 'Delete old',
      matches: 'Matches',
      researched: 'Researched',
      summaries: 'Summaries',
      hide_controls: 'Hide controls',
      show_controls: 'Show controls',
      drag_to_reorder: 'Drag to reorder',
      drag_column: 'Drag column',
      news_items_title: '{count} news items',
      move_column_to_top: 'Move column to top',
      remove_stream: 'Remove stream',
      delete_old_news_col: 'Delete old news in this column',
      remove_stream_confirm: 'Remove stream "{title}"?',
      moved_to_top: 'Moved to top',
      polling_toast: 'Polling: {sec}s',
      filtering_by: 'Filtering by: "{q}"',
      link_copied: 'Link copied',
      copy_failed: 'Copy failed',
      hidden: 'Hidden',
      ai_unavailable: 'AI unavailable',
      show_more: 'Show more',
      show_less: 'Show less',
      hide_label: 'Hide {kind}',
      show_label: 'Show {kind}',
      generating_summary: 'Generating Summary...',
      researching: 'Researching...',
      no_summary: 'No summary',
      confidence: 'Confidence',
      refresh_summary: 'Refresh Summary',
      generate_summary: 'Generate Summary',
      refresh_research: 'Refresh Research',
      generate_research: 'Generate Research',
      more: 'More',
      share_link: 'Share Link',
      hide_news: 'Hide News',
      ask_agent: 'Ask Agent',
      hide_ask_agent: 'Hide Ask Agent',
      ask_only_this_news: 'Ask follow-up questions only about this news item.',
      questions_left: 'Questions left',
      ask_placeholder: 'Ask about this specific news...',
      ask_limit_reached: 'Question limit reached for this news',
      send: 'Send',
      thinking: 'Thinking...',
      ask_agent_alert: 'Ask Agent is limited to this news item only. You can ask up to 5 questions here. Questions outside this news will be declined.',
      research_language_toast: 'Research language: {lang}',
      all_budget_toast: 'All column budgets: {budget}',
      all_research_hidden_toast: 'Hidden research in {count} items',
      no_research_to_hide: 'No research to hide',
      add_status_enter_value: 'Enter a value',
      add_status_invalid_subreddit: 'Invalid subreddit',
      add_status_invalid_channel: 'Paste a /channel/UC... URL or a channel_id',
      add_status_invalid_url: 'Invalid URL (must start with http/https)',
      adding: 'Adding...',
      question_limit_reached: 'Question limit reached ({used}/{max})',
      low_budget_prompt_with_research: 'Low AI budget for this stream. Click OK to run fresh research before answering. Click Cancel to use existing research only.',
      low_budget_prompt_no_research: 'Low AI budget for this stream. No existing research is available. Click OK to run research before answering. Click Cancel to answer from current context only.',
      per_item_help: 'Per item',
      per_column_help: 'Per column',
      view_help: 'View',
      appearance_help: 'Appearance',
      notifications_help: 'Notifications',
      columns_help: 'Columns',
      stream_input_help: 'Stream input',
      top_menu_collapsed: 'Collapsed',
      top_menu_expanded: 'Expanded',
      visible: 'Visible',
      hidden_state: 'Hidden',
      total: 'total',
      stream_input_text: 'RSS URL, subreddit (e.g. <code>r/worldnews</code>), or YouTube channel URL / ID.',
      controls: 'Controls',
      top_menu: 'Top menu',
      on: 'ON',
      off: 'OFF',
      sort_word: 'Sort',
      filters_word: 'Filters',
      filtered_prefix: 'Filtered',
      more_actions: 'More actions',
      match: 'MATCH',
      budget_short: 'Budget',
      default_value: 'Default',
      classic_value: 'Classic',
      system_value: 'System',
      medium_value: 'Medium',
      icons_value: 'Icons',
      text_value: 'Text',
      keyboard_help: 'Keyboard',
      shortcut_help: 'Help',
      shortcut_toggle_menu: 'Toggle top menu',
      shortcut_toggle_controls: 'Toggle top controls',
      shortcut_toggle_all_column_controls: 'Toggle all column controls',
      shortcut_toggle_search: 'Toggle search section',
      shortcut_focus_search: 'Focus search input',
      shortcut_toggle_add_stream: 'Toggle add stream section',
      shortcut_cycle_theme: 'Cycle color mode',
      shortcut_cycle_vibe: 'Cycle vibe',
      shortcut_close_dialogs: 'Close help / dialogs'
    },
    bg: {
      title_app: 'Поток Новини На Живо',
      sub_hint_html: 'Плъзгай колони · <b>?</b> Помощ · <b>M</b> Меню · <b>/</b> Търсене',
      vibe_label: 'Вайб:',
      search: 'Търсене',
      hide_search: 'Скрий търсене',
      add_stream: 'Добави поток',
      hide_add_stream: 'Скрий добавяне',
      hide_top_controls: 'Скрий горни контроли',
      show_top_controls: 'Покажи горни контроли',
      hide_all_column_controls: 'Скрий всички контроли на колони',
      show_all_column_controls: 'Покажи всички контроли на колони',
      hide_all_research: 'Скрий всички проучвания',
      hide_menu: 'Скрий меню',
      show_menu: 'Покажи меню',
      reset_all_newest_10: 'Нулирай ВСИЧКИ до най-нови 10',
      delete_age: 'Изтрий по възраст:',
      yesterday: 'Вчера',
      past_week: 'Последна седмица',
      past_month: 'Последен месец',
      past_year: 'Последна година',
      delete_old_all_cols: 'Изтрий стари (всички колони)',
      ai_enabled: 'AI включен',
      help: 'Помощ',
      controls_hint: 'Кликни заглавията по-долу, за да разгънеш/свиеш настройките.',
      notifications: 'Известия',
      enable_notifications: 'Включи известия',
      notify: 'Известявай:',
      notify_only_matched: 'Само съвпадения',
      notify_matched_pinned: 'Съвпадения + закачени колони',
      notify_only_pinned: 'Само закачени колони',
      notify_all_columns: 'Всички колони',
      ai_settings: 'AI настройки',
      summary: 'Обобщение',
      research: 'Проучване',
      ai_budget_all: 'AI бюджет (всички):',
      mixed: 'Смесен',
      low: 'Нисък',
      standard: 'Стандартен',
      high: 'Висок',
      appearance: 'Външен вид',
      font: 'Шрифт',
      font_size: 'Размер шрифт',
      scheme: 'Схема',
      buttons: 'Бутони',
      interface: 'Интерфейс',
      clear: 'Изчисти',
      add_stream_summary: 'Добави поток',
      help_title: 'Помощ',
      close: 'Затвори',
      tokens: 'Токени',
      color_mode: 'Цветови режим',
      color_mode_system: 'Системен',
      color_mode_dark: 'Тъмен',
      color_mode_light: 'Светъл',
      status_connecting: 'Свързване...',
      status_connected: 'Свързан',
      status_reconnecting: 'Повторно свързване...',
      status_socket_error: 'Грешка в сокета',
      notifications_toast: 'Известия: {mode}',
      no_news_older_than: 'Няма новини по-стари от {age}',
      deleted_news_older_than: 'Изтрити {count} новини по-стари от {age}',
      pinned: 'Закачена',
      unpinned: 'Откачена',
      pin: 'Закачи',
      unpin_column: 'Откачи колоната',
      pin_column: 'Закачи колоната',
      remove: 'Премахни',
      top: 'Горе',
      newest: 'Най-нови',
      summaries_on: 'Обобщения: ВКЛ',
      summaries_off: 'Обобщения: ИЗКЛ',
      auto_research_on: 'Авто проучване: ВКЛ',
      auto_research_off: 'Авто проучване: ИЗКЛ',
      budget_low: 'Бюджет: Нисък',
      budget_standard: 'Бюджет: Стандартен',
      budget_high: 'Бюджет: Висок',
      sort_newest: 'Сортиране: Най-нови',
      sort_oldest: 'Сортиране: Най-стари',
      sort_matched: 'Сортиране: Съвпадения',
      poll_interval: 'Проверка: {sec}с',
      delete_yesterday: 'Изтрий: Вчера',
      delete_week: 'Изтрий: Последна седмица',
      delete_month: 'Изтрий: Последен месец',
      delete_year: 'Изтрий: Последна година',
      delete_old: 'Изтрий стари',
      matches: 'Съвпадения',
      researched: 'Проучени',
      summaries: 'Обобщения',
      hide_controls: 'Скрий контроли',
      show_controls: 'Покажи контроли',
      drag_to_reorder: 'Плъзни за подреждане',
      drag_column: 'Плъзни колона',
      news_items_title: '{count} новини',
      move_column_to_top: 'Премести колоната най-горе',
      remove_stream: 'Премахни поток',
      delete_old_news_col: 'Изтрий стари новини в тази колона',
      remove_stream_confirm: 'Премахни поток "{title}"?',
      moved_to_top: 'Преместено най-горе',
      polling_toast: 'Проверка: {sec}с',
      filtering_by: 'Филтър по: "{q}"',
      link_copied: 'Линкът е копиран',
      copy_failed: 'Копирането е неуспешно',
      hidden: 'Скрито',
      ai_unavailable: 'AI е недостъпен',
      show_more: 'Покажи още',
      show_less: 'Покажи по-малко',
      hide_label: 'Скрий {kind}',
      show_label: 'Покажи {kind}',
      generating_summary: 'Генериране на обобщение...',
      researching: 'Проучване...',
      no_summary: 'Няма обобщение',
      confidence: 'Увереност',
      refresh_summary: 'Обнови обобщение',
      generate_summary: 'Генерирай обобщение',
      refresh_research: 'Обнови проучване',
      generate_research: 'Генерирай проучване',
      more: 'Още',
      share_link: 'Сподели линк',
      hide_news: 'Скрий новина',
      ask_agent: 'Попитай агента',
      hide_ask_agent: 'Скрий чат с агента',
      ask_only_this_news: 'Задавай последващи въпроси само за тази новина.',
      questions_left: 'Оставащи въпроси',
      ask_placeholder: 'Попитай за тази конкретна новина...',
      ask_limit_reached: 'Лимитът въпроси за тази новина е достигнат',
      send: 'Изпрати',
      thinking: 'Мисля...',
      ask_agent_alert: 'Ask Agent е ограничен само до тази новина. Можеш да зададеш до 5 въпроса тук. Въпроси извън новината ще бъдат отказани.',
      research_language_toast: 'Език за проучване: {lang}',
      all_budget_toast: 'Бюджет за всички колони: {budget}',
      all_research_hidden_toast: 'Скрити проучвания в {count} новини',
      no_research_to_hide: 'Няма проучване за скриване',
      add_status_enter_value: 'Въведи стойност',
      add_status_invalid_subreddit: 'Невалиден subreddit',
      add_status_invalid_channel: 'Постави /channel/UC... URL или channel_id',
      add_status_invalid_url: 'Невалиден URL (трябва да започва с http/https)',
      adding: 'Добавяне...',
      question_limit_reached: 'Достигнат лимит въпроси ({used}/{max})',
      low_budget_prompt_with_research: 'Нисък AI бюджет за този поток. OK = ново проучване преди отговор. Cancel = използвай само наличното проучване.',
      low_budget_prompt_no_research: 'Нисък AI бюджет за този поток. Няма налично проучване. OK = направи проучване преди отговор. Cancel = отговор от текущия контекст.',
      per_item_help: 'За новина',
      per_column_help: 'За колона',
      view_help: 'Изглед',
      appearance_help: 'Външен вид',
      notifications_help: 'Известия',
      columns_help: 'Колони',
      stream_input_help: 'Вход за поток',
      top_menu_collapsed: 'Сгънато',
      top_menu_expanded: 'Разгънато',
      visible: 'Видими',
      hidden_state: 'Скрити',
      total: 'общо',
      stream_input_text: 'RSS URL, subreddit (напр. <code>r/worldnews</code>) или YouTube channel URL / ID.',
      controls: 'Контроли',
      top_menu: 'Горно меню',
      on: 'ВКЛ',
      off: 'ИЗКЛ',
      sort_word: 'Сортиране',
      filters_word: 'Филтри',
      filtered_prefix: 'Филтрирани',
      more_actions: 'Още действия',
      match: 'СЪВПАДЕНИЕ',
      budget_short: 'Бюджет',
      default_value: 'По подразбиране',
      classic_value: 'Класическа',
      system_value: 'Системен',
      medium_value: 'Среден',
      icons_value: 'Икони',
      text_value: 'Текст',
      keyboard_help: 'Клавишни комбинации',
      shortcut_help: 'Помощ',
      shortcut_toggle_menu: 'Превключи горно меню',
      shortcut_toggle_controls: 'Превключи горни контроли',
      shortcut_toggle_all_column_controls: 'Превключи всички контроли на колони',
      shortcut_toggle_search: 'Превключи секция търсене',
      shortcut_focus_search: 'Фокус в търсене',
      shortcut_toggle_add_stream: 'Превключи секция добавяне поток',
      shortcut_cycle_theme: 'Смени цветов режим',
      shortcut_cycle_vibe: 'Смени вайб',
      shortcut_close_dialogs: 'Затвори помощ / диалози'
    }
  };

  // stable ordering inside columns
  let seqCounter = 0;

  // ---------------- Safe localStorage helpers ----------------
  function storageAvailable() {
    try {
      const k = '__t';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch {
      return false;
    }
  }
  const HAS_STORAGE = storageAvailable();
  function lsGet(key) { if (!HAS_STORAGE) return null; try { return localStorage.getItem(key); } catch { return null; } }
  function lsSet(key, val) { if (!HAS_STORAGE) return; try { localStorage.setItem(key, val); } catch {} }

  function loadJsonMap(key) {
    try {
      const raw = lsGet(key);
      const obj = raw ? JSON.parse(raw) : {};
      return (obj && typeof obj === 'object') ? obj : {};
    } catch {
      return {};
    }
  }
  function saveJsonMap(key, obj) {
    try { lsSet(key, JSON.stringify(obj)); } catch {}
  }

  function t(key, vars = {}) {
    const table = I18N[uiLang] || I18N.en;
    let out = table[key] || I18N.en[key] || key;
    Object.keys(vars).forEach(k => {
      out = out.replaceAll(`{${k}}`, String(vars[k]));
    });
    return out;
  }

  function setText(id, key, vars) {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key, vars);
  }

  function setHtml(id, key, vars) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = t(key, vars);
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function hexToRgb(hex) {
    const s = String(hex || '').trim().replace(/^#/, '');
    if (!/^[0-9a-fA-F]{6}$/.test(s)) return { r: 127, g: 127, b: 127 };
    return {
      r: parseInt(s.slice(0, 2), 16),
      g: parseInt(s.slice(2, 4), 16),
      b: parseInt(s.slice(4, 6), 16)
    };
  }

  function rgbToHsl(r, g, b) {
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const d = max - min;
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (max === rn) h = 60 * (((gn - bn) / d) % 6);
      else if (max === gn) h = 60 * (((bn - rn) / d) + 2);
      else h = 60 * (((rn - gn) / d) + 4);
    }

    if (h < 0) h += 360;
    return { h, s, l };
  }

  function hslToRgb(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hh = h / 60;
    const x = c * (1 - Math.abs((hh % 2) - 1));
    let r1 = 0, g1 = 0, b1 = 0;

    if (hh >= 0 && hh < 1) { r1 = c; g1 = x; b1 = 0; }
    else if (hh < 2) { r1 = x; g1 = c; b1 = 0; }
    else if (hh < 3) { r1 = 0; g1 = c; b1 = x; }
    else if (hh < 4) { r1 = 0; g1 = x; b1 = c; }
    else if (hh < 5) { r1 = x; g1 = 0; b1 = c; }
    else { r1 = c; g1 = 0; b1 = x; }

    const m = l - c / 2;
    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255)
    };
  }

  function transformHex(hex, tuning) {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const h = ((hsl.h + tuning.hueShift) % 360 + 360) % 360;
    const s = clamp(hsl.s * tuning.satMul, 0.12, 1);
    const l = clamp(hsl.l * tuning.lightMul, 0.10, 0.86);
    return hslToRgb(h, s, l);
  }

  function rgba(rgb, alpha = 1) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  function applyColumnPalette(vibeValue, schemeValue) {
    const vibe = Object.prototype.hasOwnProperty.call(VIBE_BASE_COLORS, vibeValue) ? vibeValue : 'default';
    const scheme = Object.prototype.hasOwnProperty.call(SCHEME_TUNING, schemeValue) ? schemeValue : 'classic';
    const base = VIBE_BASE_COLORS[vibe];
    const tuning = SCHEME_TUNING[scheme];

    const a = transformHex(base[0], tuning);
    const b = transformHex(base[1], tuning);
    const m = transformHex(base[2], tuning);

    const style = document.body.style;
    style.setProperty('--a-accent', rgba(a, 1));
    style.setProperty('--b-accent', rgba(b, 1));
    style.setProperty('--m-accent', rgba(m, 1));
    style.setProperty('--a-soft', rgba(a, tuning.softAlpha));
    style.setProperty('--b-soft', rgba(b, Math.max(0.16, tuning.softAlpha - 0.03)));
    style.setProperty('--m-soft', rgba(m, Math.min(0.36, tuning.softAlpha + 0.03)));
  }

  function loadOrder() {
    try {
      const raw = lsGet(ORDER_KEY);
      savedOrder = raw ? JSON.parse(raw) : null;
      if (!Array.isArray(savedOrder)) savedOrder = null;
    } catch {
      savedOrder = null;
    }
  }

  function saveOrderNow() {
    try {
      const urls = Array.from(grid.children)
        .map(el => el.getAttribute('data-feed-url'))
        .filter(Boolean);
      lsSet(ORDER_KEY, JSON.stringify(urls));
    } catch {}
  }

  function toast(msg, ms = 1400) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove('show'), ms);
  }
  toast._t = null;

  function setStatusText(nextKey) {
    const raw = String(nextKey || 'connecting').trim();
    const normalized = raw.toLowerCase().replaceAll(/\s+/g, '_').replaceAll('.', '');
    if (normalized === 'connected') statusKey = 'connected';
    else if (normalized === 'reconnecting') statusKey = 'reconnecting';
    else if (normalized === 'socket_error' || normalized === 'socketerror') statusKey = 'socket_error';
    else if (normalized === 'connecting') statusKey = 'connecting';
    else statusKey = 'connecting';
    if (status) status.textContent = t(`status_${statusKey}`);
  }

  function setTokenUsage(v) {
    tokenUsageValue = Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
    if (tokenUsageEl) tokenUsageEl.textContent = `${t('tokens')}: ${tokenUsageValue.toLocaleString()}`;
  }

  function norm(s) {
    return String(s || '').normalize('NFKC').toLocaleLowerCase('bg');
  }

  function formatDate(ms) {
    const d = new Date(ms);
    if (isNaN(d.getTime())) return '';
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  function escapeHtml(s) {
    return String(s || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }

  function send(msg) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(msg));
  }

  // Theme helpers
  function applyTheme(nextTheme) {
    theme = nextTheme || 'system';
    lsSet(THEME_KEY, theme);
    document.documentElement.dataset.theme = theme;
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
      const label = theme === 'dark'
        ? t('color_mode_dark')
        : theme === 'light'
          ? t('color_mode_light')
          : t('color_mode_system');
      btn.textContent = `${t('color_mode')}: ${label}`;
    }
    renderHelp();
  }

  function cycleTheme() {
    const order = ['system', 'dark', 'light'];
    const idx = order.indexOf(theme);
    applyTheme(order[(idx + 1) % order.length]);
  }

  function injectThemeToggle() {
    const controlsRow = document.getElementById('appearanceGroup') || document.querySelector('.controlsRow .controlGroup');
    if (!controlsRow) return;
    if (document.getElementById('themeToggleBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'themeToggleBtn';
    btn.className = 'btn';
    btn.type = 'button';
    btn.textContent = `${t('color_mode')}: ${t('color_mode_system')}`;
    btn.addEventListener('click', cycleTheme);

    const helpButton = document.getElementById('helpBtn');
    if (helpButton && helpButton.parentElement === controlsRow) {
      controlsRow.insertBefore(btn, helpButton);
    } else {
      controlsRow.appendChild(btn);
    }
  }

  const savedTheme = lsGet(THEME_KEY);
  if (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'system') theme = savedTheme;

  function setControlsCollapsed(collapsed) {
    document.body.classList.toggle('controls-collapsed', collapsed);
    clearCollapsedQuickSections();
    lsSet(CONTROLS_KEY, collapsed ? '1' : '0');
    if (controlsToggle) controlsToggle.textContent = collapsed ? t('show_top_controls') : t('hide_top_controls');
    emitTopUiState();
    renderHelp();
  }
  function toggleControls() {
    const collapsed = document.body.classList.contains('controls-collapsed');
    if (document.body.classList.contains('menu-collapsed')) {
      setMenuCollapsed(false);
    }
    setControlsCollapsed(!collapsed);
  }

  // Menu collapse (top menu)
  const MENU_KEY = 'liveNews.menuCollapsed';
  function setMenuCollapsed(collapsed) {
    document.body.classList.toggle('menu-collapsed', collapsed);
    lsSet(MENU_KEY, collapsed ? '1' : '0');
    if (menuToggle) menuToggle.textContent = collapsed ? t('show_menu') : t('hide_menu');
    // "Show menu" should always reveal the full controls panel.
    if (!collapsed && document.body.classList.contains('controls-collapsed')) {
      setControlsCollapsed(false);
    }
    emitTopUiState();
    renderHelp();
  }
  function toggleMenu() {
    const collapsed = document.body.classList.contains('menu-collapsed');
    setMenuCollapsed(!collapsed);
  }
  const savedMenu = lsGet(MENU_KEY);
  if (savedMenu === '1') setMenuCollapsed(true);
  const savedControls = lsGet(CONTROLS_KEY);
  setControlsCollapsed(savedControls === '1');

  function applyFontPreset(v) {
    const allowed = new Set(['system', 'manrope', 'grotesk', 'sora', 'plex', 'serif', 'mono']);
    const next = allowed.has(v) ? v : 'system';
    document.body.dataset.font = next;
    lsSet(FONT_KEY, next);
    if (fontSelect) fontSelect.value = next;
    renderHelp();
  }

  function applyFontSizePreset(v) {
    const allowed = new Set(['sm', 'md', 'lg', 'xl']);
    const next = allowed.has(v) ? v : 'md';
    document.body.dataset.fontSize = next;
    lsSet(FONT_SIZE_KEY, next);
    if (fontSizeSelect) fontSizeSelect.value = next;
    renderHelp();
  }

  function applyColorScheme(v) {
    const allowed = new Set(['classic', 'vivid', 'sunset', 'neon', 'ocean', 'forest']);
    const next = allowed.has(v) ? v : 'classic';
    document.body.dataset.scheme = next;
    lsSet(SCHEME_KEY, next);
    if (schemeSelect) schemeSelect.value = next;
    applyColumnPalette(document.body.dataset.vibe || 'default', next);
    applyColumnThemes();
    renderHelp();
  }

  function applyButtonMode(v) {
    const next = (v === 'text') ? 'text' : 'icons';
    buttonMode = next;
    document.body.dataset.itemButtons = next;
    lsSet(BTN_MODE_KEY, next);
    if (btnModeSelect) btnModeSelect.value = next;
    renderAllFeeds();
    renderHelp();
  }

  function applyVibePreset(v) {
    const allowed = new Set(['default', 'anime', 'arcade', 'cinema', 'newspaper', 'cyberwitch', 'fantasy', 'scifi']);
    const next = allowed.has(v) ? v : 'default';
    document.body.dataset.vibe = next;
    lsSet(VIBE_KEY, next);
    if (vibeSelect) vibeSelect.value = next;
    if (quickVibeSelect) quickVibeSelect.value = next;
    applyColumnPalette(next, document.body.dataset.scheme || (schemeSelect?.value || 'classic'));
    // Re-render visible items so vibe-specific icon buttons update immediately.
    renderAllFeeds();
    emitTopUiState();
    renderHelp();
  }

  function cycleVibe() {
    const order = ['default', 'anime', 'arcade', 'cinema', 'newspaper', 'cyberwitch', 'fantasy', 'scifi'];
    const current = document.body.dataset.vibe || 'default';
    const idx = order.indexOf(current);
    applyVibePreset(order[(idx + 1) % order.length]);
  }

  function updateQuickSectionButtons() {
    const controlsHidden = document.body.classList.contains('controls-collapsed');
    const searchShown = controlsHidden
      ? !!(searchSectionEl && searchSectionEl.classList.contains('quickSectionVisible'))
      : !!(searchSectionEl && searchSectionEl.open);
    const addShown = controlsHidden
      ? !!(addStreamSectionEl && addStreamSectionEl.classList.contains('quickSectionVisible'))
      : !!(addStreamSectionEl && addStreamSectionEl.open);
    if (quickSearchBtn && searchSectionEl) {
      quickSearchBtn.textContent = searchShown ? t('hide_search') : t('search');
    }
    if (quickAddStreamBtn && addStreamSectionEl) {
      quickAddStreamBtn.textContent = addShown ? t('hide_add_stream') : t('add_stream');
    }
    emitTopUiState();
  }

  function setAddFeedStatus(message, kind = 'info') {
    const text = String(message || '').trim();
    if (!text) return;
    if (addFeedStatus) {
      addFeedStatus.textContent = text;
    }
    window.dispatchEvent(new CustomEvent('ai-news:add-feed-status', {
      detail: { message: text, type: kind }
    }));
    const timeout = kind === 'error' ? 3500 : 2200;
    setTimeout(() => {
      if (addFeedStatus) addFeedStatus.textContent = '';
    }, timeout);
  }

  function emitTopUiState() {
    window.dispatchEvent(new CustomEvent('ai-news:top-state', {
      detail: {
        menuCollapsed: document.body.classList.contains('menu-collapsed'),
        controlsCollapsed: document.body.classList.contains('controls-collapsed'),
        searchVisible: isSectionVisible(searchSectionEl),
        addStreamVisible: isSectionVisible(addStreamSectionEl),
        allColumnControlsHidden: !areAllColumnMenusOpen(),
        vibe: document.body.dataset.vibe || 'default',
        language: uiLang
      }
    }));
  }

  function clearCollapsedQuickSections() {
    if (searchSectionEl) {
      searchSectionEl.classList.remove('quickSectionVisible');
    }
    if (addStreamSectionEl) {
      addStreamSectionEl.classList.remove('quickSectionVisible');
    }
    if (controlsEl) {
      controlsEl.classList.remove('quick-sections-active');
    }
  }

  function updateCollapsedQuickSectionsUi() {
    if (!controlsEl) return;
    const searchVisible = !!(searchSectionEl && searchSectionEl.classList.contains('quickSectionVisible'));
    const addVisible = !!(addStreamSectionEl && addStreamSectionEl.classList.contains('quickSectionVisible'));
    const hasQuickVisible = searchVisible || addVisible;
    if (!hasQuickVisible) {
      controlsEl.classList.remove('quick-sections-active');
      return;
    }

    // Quick Search/Add must not expand full top controls; keep collapsed mode locked.
    if (!document.body.classList.contains('controls-collapsed')) {
      document.body.classList.add('controls-collapsed');
      lsSet(CONTROLS_KEY, '1');
      if (controlsToggle) controlsToggle.textContent = t('show_top_controls');
    }
    controlsEl.classList.add('quick-sections-active');
  }

  function applyUiLanguage(nextLang) {
    uiLang = nextLang === 'bg' ? 'bg' : 'en';
    lsSet(UI_LANG_KEY, uiLang);
    document.documentElement.lang = uiLang;
    if (interfaceLangEl) interfaceLangEl.value = uiLang;

    setText('appTitle', 'title_app');
    setHtml('subHint', 'sub_hint_html');
    setText('quickVibeLabelText', 'vibe_label');
    setText('resetBtn', 'reset_all_newest_10');
    setText('deleteAgePrefix', 'delete_age');
    setText('aiEnabledLabel', 'ai_enabled');
    setText('helpBtn', 'help');
    setText('controlsHint', 'controls_hint');
    setText('notificationsSummary', 'notifications');
    setText('notifyEnabledLabel', 'enable_notifications');
    setText('notifyPrefix', 'notify');
    setText('aiSettingsSummary', 'ai_settings');
    setText('summaryLangPrefix', 'summary');
    setText('researchLangPrefix', 'research');
    setText('allBudgetPrefix', 'ai_budget_all');
    setText('appearanceSummary', 'appearance');
    setText('fontPrefix', 'font');
    setText('fontSizePrefix', 'font_size');
    setText('schemePrefix', 'scheme');
    setText('buttonsPrefix', 'buttons');
    setText('vibePrefix', 'vibe_label');
    setText('interfaceLangPrefix', 'interface');
    setText('searchSummary', 'search');
    setText('addStreamSummary', 'add_stream_summary');
    setText('helpTitle', 'help_title');
    setText('helpClose', 'close');
    setText('hideAllResearchBtn', 'hide_all_research');
    if (clearSearchBtn) clearSearchBtn.textContent = t('clear');
    if (searchInput) searchInput.placeholder = uiLang === 'bg'
      ? 'Търсене (заглавие + обобщение + проучване)...'
      : 'Search (title + summary + research)...';
    if (feedUrlEl) feedUrlEl.placeholder = uiLang === 'bg'
      ? 'Постави RSS URL ИЛИ subreddit ИЛИ YouTube channel URL...'
      : 'Paste RSS URL OR subreddit OR YouTube channel URL...';
    if (feedLabelEl) feedLabelEl.placeholder = uiLang === 'bg' ? 'Етикет (по избор)' : 'Optional label';
    if (addFeedBtn) addFeedBtn.textContent = t('add_stream');
    if (deleteAgeAllBtn) deleteAgeAllBtn.textContent = t('delete_old_all_cols');

    const deleteAgeOptions = [
      ['yesterday', t('yesterday')],
      ['week', t('past_week')],
      ['month', t('past_month')],
      ['year', t('past_year')]
    ];
    if (deleteAgeSelect) {
      deleteAgeOptions.forEach(([value, text]) => {
        const opt = deleteAgeSelect.querySelector(`option[value="${value}"]`);
        if (opt) opt.textContent = text;
      });
    }

    if (notifyModeEl) {
      const m0 = notifyModeEl.querySelector('option[value="matched"]');
      const m1 = notifyModeEl.querySelector('option[value="matched_pinned"]');
      const m2 = notifyModeEl.querySelector('option[value="pinned"]');
      const m3 = notifyModeEl.querySelector('option[value="all"]');
      if (m0) m0.textContent = t('notify_only_matched');
      if (m1) m1.textContent = t('notify_matched_pinned');
      if (m2) m2.textContent = t('notify_only_pinned');
      if (m3) m3.textContent = t('notify_all_columns');
    }

    if (allBudgetSelect) {
      const b0 = allBudgetSelect.querySelector('option[value="mixed"]');
      const b1 = allBudgetSelect.querySelector('option[value="low"]');
      const b2 = allBudgetSelect.querySelector('option[value="standard"]');
      const b3 = allBudgetSelect.querySelector('option[value="high"]');
      if (b0) b0.textContent = t('mixed');
      if (b1) b1.textContent = t('low');
      if (b2) b2.textContent = t('standard');
      if (b3) b3.textContent = t('high');
    }

    if (btnModeSelect) {
      const i = btnModeSelect.querySelector('option[value="icons"]');
      const tx = btnModeSelect.querySelector('option[value="text"]');
      if (i) i.textContent = t('icons_value');
      if (tx) tx.textContent = t('text_value');
    }
    if (fontSizeSelect) {
      const s = fontSizeSelect.querySelector('option[value="sm"]');
      const m = fontSizeSelect.querySelector('option[value="md"]');
      const l = fontSizeSelect.querySelector('option[value="lg"]');
      const xl = fontSizeSelect.querySelector('option[value="xl"]');
      if (s) s.textContent = uiLang === 'bg' ? 'Малък' : 'Small';
      if (m) m.textContent = uiLang === 'bg' ? 'Среден' : 'Medium';
      if (l) l.textContent = uiLang === 'bg' ? 'Голям' : 'Large';
      if (xl) xl.textContent = uiLang === 'bg' ? 'Много голям' : 'Extra Large';
    }
    if (feedTypeEl) {
      const rss = feedTypeEl.querySelector('option[value="rss"]');
      const red = feedTypeEl.querySelector('option[value="reddit"]');
      const yt = feedTypeEl.querySelector('option[value="youtube"]');
      if (rss) rss.textContent = 'RSS';
      if (red) red.textContent = uiLang === 'bg' ? 'Reddit (subreddit)' : 'Reddit (subreddit)';
      if (yt) yt.textContent = uiLang === 'bg' ? 'YouTube (канал)' : 'YouTube (channel)';
    }

    if (schemeSelect) {
      const c = schemeSelect.querySelector('option[value="classic"]');
      const v = schemeSelect.querySelector('option[value="vivid"]');
      const s = schemeSelect.querySelector('option[value="sunset"]');
      const n = schemeSelect.querySelector('option[value="neon"]');
      const o = schemeSelect.querySelector('option[value="ocean"]');
      const f = schemeSelect.querySelector('option[value="forest"]');
      if (c) c.textContent = uiLang === 'bg' ? 'Класическа' : 'Classic';
      if (v) v.textContent = uiLang === 'bg' ? 'Ярка' : 'Vivid';
      if (s) s.textContent = uiLang === 'bg' ? 'Залез' : 'Sunset';
      if (n) n.textContent = uiLang === 'bg' ? 'Неон' : 'Neon';
      if (o) o.textContent = uiLang === 'bg' ? 'Океан' : 'Ocean';
      if (f) f.textContent = uiLang === 'bg' ? 'Гора' : 'Forest';
    }

    const applyVibeOptionLabels = (sel) => {
      if (!sel) return;
      const d = sel.querySelector('option[value="default"]');
      const a = sel.querySelector('option[value="anime"]');
      const ar = sel.querySelector('option[value="arcade"]');
      const c = sel.querySelector('option[value="cinema"]');
      const n = sel.querySelector('option[value="newspaper"]');
      const cw = sel.querySelector('option[value="cyberwitch"]');
      const f = sel.querySelector('option[value="fantasy"]');
      const sf = sel.querySelector('option[value="scifi"]');
      if (d) d.textContent = uiLang === 'bg' ? 'По подразбиране' : 'Default';
      if (a) a.textContent = uiLang === 'bg' ? 'Аниме Поп' : 'Anime Pop';
      if (ar) ar.textContent = uiLang === 'bg' ? 'Видео игра' : 'Video Game';
      if (c) c.textContent = uiLang === 'bg' ? 'Кино вечер' : 'Movie Night';
      if (n) n.textContent = uiLang === 'bg' ? 'Вестник' : 'Newspaper';
      if (cw) cw.textContent = uiLang === 'bg' ? 'Кибер вещица' : 'Cyber Witch';
      if (f) f.textContent = uiLang === 'bg' ? 'Фентъзи' : 'Fantasy';
      if (sf) sf.textContent = uiLang === 'bg' ? 'Научна фантастика' : 'Sci-Fi';
    };
    applyVibeOptionLabels(vibeSelect);
    applyVibeOptionLabels(quickVibeSelect);

    if (feedIntervalEl) {
      Array.from(feedIntervalEl.options).forEach(opt => {
        opt.textContent = `${opt.value}${uiLang === 'bg' ? 'с' : 's'}`;
      });
    }

    setTokenUsage(tokenUsageValue);
    setStatusText(statusKey);
    updateQuickSectionButtons();
    setControlsCollapsed(document.body.classList.contains('controls-collapsed'));
    setMenuCollapsed(document.body.classList.contains('menu-collapsed'));
    updateAllColumnControlsUi();
    Object.keys(columns).forEach(updateColumnUi);
    updateSearchInfo();
    renderAllFeeds();
    renderHelp();
    applyTheme(theme);
    emitTopUiState();
  }

  function toggleSectionVisibility(sectionEl, focusEl) {
    if (!sectionEl) return;
    if (document.body.classList.contains('controls-collapsed')) {
      const nextVisible = !sectionEl.classList.contains('quickSectionVisible');
      sectionEl.classList.toggle('quickSectionVisible', nextVisible);
      sectionEl.open = nextVisible;
      updateCollapsedQuickSectionsUi();
      if (nextVisible && focusEl) {
        setTimeout(() => {
          focusEl.focus();
          sectionEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 30);
      }
      updateQuickSectionButtons();
      return;
    }
    const nextOpen = !sectionEl.open;
    sectionEl.open = nextOpen;
    if (nextOpen && focusEl) {
      setTimeout(() => {
        focusEl.focus();
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 30);
    }
    updateQuickSectionButtons();
  }

  function toggleQuickSection(sectionEl, focusEl) {
    if (!sectionEl) return;
    if (!document.body.classList.contains('controls-collapsed')) {
      document.body.classList.add('controls-collapsed');
      lsSet(CONTROLS_KEY, '1');
      if (controlsToggle) controlsToggle.textContent = t('show_top_controls');
    }
    const nextVisible = !sectionEl.classList.contains('quickSectionVisible');
    sectionEl.classList.toggle('quickSectionVisible', nextVisible);
    sectionEl.open = nextVisible;
    updateCollapsedQuickSectionsUi();
    if (nextVisible && focusEl) {
      setTimeout(() => {
        focusEl.focus();
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 30);
    }
    updateQuickSectionButtons();
  }

  function isSectionVisible(sectionEl) {
    if (!sectionEl) return false;
    if (document.body.classList.contains('controls-collapsed')) {
      return sectionEl.classList.contains('quickSectionVisible');
    }
    return !!sectionEl.open;
  }

  function ensureSectionVisible(sectionEl, focusEl) {
    if (!sectionEl) return;
    if (!isSectionVisible(sectionEl)) {
      toggleSectionVisibility(sectionEl, focusEl);
      return;
    }
    if (focusEl) {
      setTimeout(() => {
        focusEl.focus();
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 30);
    }
  }

  function submitAddFeed({ kind, raw, labelInput, intervalSec }) {
    const feedKind = (kind === 'reddit' || kind === 'youtube') ? kind : 'rss';
    const sourceRaw = String(raw || '').trim();
    const sourceLabel = String(labelInput || '').trim();
    const sourceInterval = Number.isFinite(Number(intervalSec)) ? Number(intervalSec) : 120;
    const safeInterval = Math.max(45, Math.min(300, Math.floor(sourceInterval || 120)));

    if (!sourceRaw) {
      setAddFeedStatus(t('add_status_enter_value'), 'error');
      return;
    }

    let url = sourceRaw;
    let label = sourceLabel;

    if (feedKind === 'reddit') {
      const out = toRedditRss(sourceRaw);
      if (!out) {
        setAddFeedStatus(t('add_status_invalid_subreddit'), 'error');
        return;
      }
      url = out.url;
      if (!label) label = out.label;
    } else if (feedKind === 'youtube') {
      const out = toYoutubeRss(sourceRaw);
      if (!out) {
        setAddFeedStatus(t('add_status_invalid_channel'), 'error');
        return;
      }
      url = out.url;
      if (!label) label = out.label;
    } else if (!/^https?:\/\//i.test(url)) {
      setAddFeedStatus(t('add_status_invalid_url'), 'error');
      return;
    }

    setAddFeedStatus(t('adding'), 'info');
    send({ type: 'add_feed', url, label: label || undefined, kind: feedKind, intervalSec: safeInterval });
  }

  function selectedText(el) {
    if (!el || el.selectedIndex < 0) return '';
    const opt = el.options[el.selectedIndex];
    return opt ? String(opt.textContent || '').trim() : '';
  }

  function renderHelp() {
    if (!helpListEl) return;

    const vibeText = selectedText(vibeSelect || quickVibeSelect) || t('default_value');
    const schemeText = selectedText(schemeSelect) || t('classic_value');
    const fontText = selectedText(fontSelect) || t('system_value');
    const fontSizeText = selectedText(fontSizeSelect) || t('medium_value');
    const btnText = selectedText(btnModeSelect) || (buttonMode === 'icons' ? t('icons_value') : t('text_value'));
    const notifyOn = !!(notifyEnabledEl && notifyEnabledEl.checked);
    const notifyText = notifyOn ? `${t('on')} (${notifyModeLabel(getNotifyMode())})` : t('off');
    const columnsCount = Object.keys(columns).length;
    const pinnedCount = Object.keys(columns).filter(url => isPinnedFeed(url)).length;
    const topMenuState = document.body.classList.contains('menu-collapsed') ? t('top_menu_collapsed') : t('top_menu_expanded');
    const controlsState = document.body.classList.contains('controls-collapsed') ? t('hidden_state') : t('visible');
    const colorModeBtn = document.getElementById('themeToggleBtn');
    const colorModeText = colorModeBtn ? colorModeBtn.textContent.replace(/^Color mode:\s*/i, '').trim() : 'System';
    const shortcutItems = [
      `<kbd>?</kbd> ${escapeHtml(t('shortcut_help'))}`,
      `<kbd>H</kbd> ${escapeHtml(t('shortcut_help'))}`,
      `<kbd>M</kbd> ${escapeHtml(t('shortcut_toggle_menu'))}`,
      `<kbd>C</kbd> ${escapeHtml(t('shortcut_toggle_controls'))}`,
      `<kbd>G</kbd> ${escapeHtml(t('shortcut_toggle_all_column_controls'))}`,
      `<kbd>S</kbd> ${escapeHtml(t('shortcut_toggle_search'))}`,
      `<kbd>/</kbd> ${escapeHtml(t('shortcut_focus_search'))}`,
      `<kbd>A</kbd> ${escapeHtml(t('shortcut_toggle_add_stream'))}`,
      `<kbd>T</kbd> ${escapeHtml(t('shortcut_cycle_theme'))}`,
      `<kbd>V</kbd> ${escapeHtml(t('shortcut_cycle_vibe'))}`,
      `<kbd>Esc</kbd> ${escapeHtml(t('shortcut_close_dialogs'))}`
    ].join(' · ');

    helpListEl.innerHTML = `
      <li><b>${escapeHtml(t('view_help'))}</b>: ${escapeHtml(t('top_menu'))} ${escapeHtml(topMenuState)} · ${escapeHtml(t('controls'))} ${escapeHtml(controlsState)}.</li>
      <li><b>${escapeHtml(t('appearance_help'))}</b>: ${escapeHtml(t('vibe_label').replace(':', ''))} ${escapeHtml(vibeText)} · ${escapeHtml(t('scheme'))} ${escapeHtml(schemeText)} · ${escapeHtml(t('font'))} ${escapeHtml(fontText)} · ${escapeHtml(t('font_size'))} ${escapeHtml(fontSizeText)} · ${escapeHtml(t('buttons'))} ${escapeHtml(btnText)} · ${escapeHtml(t('color_mode'))} ${escapeHtml(colorModeText)}.</li>
      <li><b>${escapeHtml(t('keyboard_help'))}</b>: ${shortcutItems}.</li>
      <li><b>${escapeHtml(t('notifications_help'))}</b>: ${escapeHtml(notifyText)}.</li>
      <li><b>${escapeHtml(t('columns_help'))}</b>: ${columnsCount} ${escapeHtml(t('total'))} · ${pinnedCount} ${escapeHtml(t('pinned').toLocaleLowerCase())}.</li>
      <li><b>${escapeHtml(t('per_column_help'))}</b>: ${escapeHtml(t('summaries'))} / ${escapeHtml(t('research'))} / ${escapeHtml(t('budget_short'))} / ${escapeHtml(t('sort_word'))} / ${escapeHtml(t('filters_word'))} / ${escapeHtml(t('delete_old'))}.</li>
      <li><b>${escapeHtml(t('per_item_help'))}</b>: ${escapeHtml(t('share_link'))} / ${escapeHtml(t('summary'))} / ${escapeHtml(t('research'))} / ${escapeHtml(t('ask_agent'))} (max 5) / ${escapeHtml(t('hide_news'))}.</li>
      <li><b>${escapeHtml(t('stream_input_help'))}</b>: ${t('stream_input_text')}.</li>
    `;
  }

  // Notifications
  function canNotify() { return 'Notification' in window; }
  async function ensureNotificationPermissionIfNeeded() {
    if (!canNotify()) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const p = await Notification.requestPermission();
    return p === 'granted';
  }
  function notify({ title, body, link, isKeywordMatch }) {
    if (!notifyEnabledEl || !notifyEnabledEl.checked) return;
    if (!canNotify()) return;
    if (Notification.permission !== 'granted') return;

    const prefix = isKeywordMatch ? '⭐ MATCH' : 'News';
    const n = new Notification(`${prefix} · ${title}`, {
      body,
      icon: isKeywordMatch
        ? 'https://www.google.com/favicon.ico'
        : 'https://news.google.com/favicon.ico'
    });
    n.onclick = () => window.open(link, '_blank');
  }

  function getNotifyMode() {
    const v = String(notifyModeEl?.value || 'matched');
    if (v === 'all' || v === 'pinned' || v === 'matched' || v === 'matched_pinned') return v;
    return 'matched';
  }

  function notifyModeLabel(mode) {
    if (mode === 'all') return t('notify_all_columns');
    if (mode === 'pinned') return t('notify_only_pinned');
    if (mode === 'matched_pinned') return t('notify_matched_pinned');
    return t('notify_only_matched');
  }

  function shouldNotifyForMessage(msg) {
    const mode = getNotifyMode();
    if (mode === 'all') return true;
    const isPinned = isPinnedFeed(String(msg.feedUrl || ''));
    const isMatched = !!(msg.isMatch && msg.filteredOk !== false);
    if (mode === 'pinned') return isPinned;
    if (mode === 'matched_pinned') return isPinned || isMatched;
    return isMatched;
  }

  // Column themes (alternate based on DOM order; match column special)
  function applyColumnThemes() {
    const cols = Array.from(grid.querySelectorAll('.column'));
    let idx = 0;
    for (const col of cols) {
      const feedUrl = col.getAttribute('data-feed-url');
      if (feedUrl === FILTERED_FEED_URL) {
        col.dataset.coltheme = 'match';
        continue;
      }
      col.dataset.coltheme = (idx % 2 === 0) ? 'a' : 'b';
      idx++;
    }
  }

  function moveColumnToTop(feedUrl) {
    const col = columns[feedUrl];
    if (!col || grid.firstElementChild === col) return;
    grid.insertBefore(col, grid.firstElementChild);
    saveOrderNow();
    applyColumnThemes();
  }

  function removeColumnLocal(feedUrl) {
    const col = columns[feedUrl];
    if (col && col.parentNode) col.parentNode.removeChild(col);
    delete columns[feedUrl];
    delete store[feedUrl];
    delete colMenuOpenByFeed[feedUrl];
    delete pinnedFeeds[feedUrl];
    saveJsonMap(COL_MENU_KEY, colMenuOpenByFeed);
    saveJsonMap(PINNED_FEEDS_KEY, pinnedFeeds);
    saveOrderNow();
    applyColumnThemes();
    updateAllColumnControlsUi();
    renderHelp();
  }

  function updateColumnCount(feedUrl, visibleCount = null) {
    const col = columns[feedUrl];
    const state = store[feedUrl];
    if (!col || !state) return;

    const countEl = col.querySelector('[data-role="count"]');
    if (!countEl) return;

    const total = Array.isArray(state.items) ? state.items.length : 0;
    countEl.textContent = String(total);
    if (Number.isFinite(visibleCount)) {
      countEl.title = `${t('visible')} ${visibleCount} / ${total}`;
    } else {
      countEl.title = t('news_items_title', { count: total });
    }
  }

  // Apply order: saved order wins, else server order
  function applyOrderToDom(serverOrder) {
    const desired = Array.isArray(savedOrder) ? savedOrder : (Array.isArray(serverOrder) ? serverOrder : null);
    if (!desired || !desired.length) return;

    const nodes = new Map();
    Array.from(grid.children).forEach(el => {
      const url = el.getAttribute('data-feed-url');
      if (url) nodes.set(url, el);
    });

    for (const url of desired) {
      const el = nodes.get(url);
      if (el) grid.appendChild(el);
    }
  }

  function getFeedSetting(feedUrl) {
    return feedSettings && feedSettings[feedUrl] ? feedSettings[feedUrl] : null;
  }

  function updateAllBudgetUi() {
    if (!allBudgetSelect) return;
    const values = Object.values(feedSettings || {})
      .map(s => s && s.budget)
      .filter(v => v === 'low' || v === 'standard' || v === 'high');

    if (!values.length) {
      allBudgetSelect.value = 'standard';
      return;
    }

    const first = values[0];
    const same = values.every(v => v === first);
    allBudgetSelect.value = same ? first : 'mixed';
  }

  function updateColumnUi(feedUrl) {
    const col = columns[feedUrl];
    if (!col) return;

    const s = getFeedSetting(feedUrl);

    const summaryBtn = col.querySelector('button[data-action="toggleSummary"]');
    const researchBtn = col.querySelector('button[data-action="toggleResearch"]');
    const budgetSel = col.querySelector('select[data-action="budget"]');
    const sortSel = col.querySelector('select[data-action="sort"]');
    const onlyMatchesEl = col.querySelector('input[data-action="onlyMatches"]');
    const onlyResearchedEl = col.querySelector('input[data-action="onlyResearched"]');
    const onlySummariesEl = col.querySelector('input[data-action="onlySummaries"]');
    const intervalSel = col.querySelector('select[data-action="interval"]');
    const pinBtn = col.querySelector('button[data-action="pinCol"]');
    const badgeEl = col.querySelector('.badge');

    if (badgeEl && feedUrl === FILTERED_FEED_URL) {
      badgeEl.textContent = uiLang === 'bg' ? 'ключови' : 'keywords';
    }

    if (summaryBtn) {
      const on = !!(s && s.summaryEnabled);
      summaryBtn.classList.toggle('on', on);
      summaryBtn.textContent = on ? t('summaries_on') : t('summaries_off');
      summaryBtn.disabled = !aiAvailable;
    }

    if (researchBtn) {
      const on = !!(s && s.researchEnabled);
      researchBtn.classList.toggle('on', on);
      researchBtn.textContent = on ? t('auto_research_on') : t('auto_research_off');
      researchBtn.disabled = !aiAvailable;
    }

    const newestBtn = col.querySelector('button[data-action="newest10"]');
    if (newestBtn) newestBtn.textContent = t('newest');

    const moveTopBtn = col.querySelector('button[data-action="moveTop"]');
    if (moveTopBtn) moveTopBtn.textContent = t('top');

    const removeBtn = col.querySelector('button[data-action="removeCol"]');
    if (removeBtn) removeBtn.textContent = t('remove');

    const budgetOptions = col.querySelectorAll('select[data-action="budget"] option');
    budgetOptions.forEach(opt => {
      if (opt.value === 'low') opt.textContent = t('budget_low');
      if (opt.value === 'standard') opt.textContent = t('budget_standard');
      if (opt.value === 'high') opt.textContent = t('budget_high');
    });

    const sortOptions = col.querySelectorAll('select[data-action="sort"] option');
    sortOptions.forEach(opt => {
      if (opt.value === 'newest') opt.textContent = t('sort_newest');
      if (opt.value === 'oldest') opt.textContent = t('sort_oldest');
      if (opt.value === 'matched') opt.textContent = t('sort_matched');
    });

    const intervalOptions = col.querySelectorAll('select[data-action="interval"] option');
    intervalOptions.forEach(opt => {
      opt.textContent = t('poll_interval', { sec: opt.value });
    });

    const delOptions = col.querySelectorAll('select[data-action="deleteAgeRange"] option');
    delOptions.forEach(opt => {
      if (opt.value === 'yesterday') opt.textContent = t('delete_yesterday');
      if (opt.value === 'week') opt.textContent = t('delete_week');
      if (opt.value === 'month') opt.textContent = t('delete_month');
      if (opt.value === 'year') opt.textContent = t('delete_year');
    });

    const deleteOldBtn = col.querySelector('button[data-action="deleteAgeCol"]');
    if (deleteOldBtn) deleteOldBtn.textContent = t('delete_old');

    const matchesLabel = col.querySelector('[data-role="onlyMatchesLabel"]');
    if (matchesLabel) matchesLabel.textContent = t('matches');
    const researchedLabel = col.querySelector('[data-role="onlyResearchedLabel"]');
    if (researchedLabel) researchedLabel.textContent = t('researched');
    const summariesLabel = col.querySelector('[data-role="onlySummariesLabel"]');
    if (summariesLabel) summariesLabel.textContent = t('summaries');

    if (budgetSel && s) budgetSel.value = s.budget || 'standard';
    if (sortSel && s) sortSel.value = s.sortMode || 'newest';
    if (onlyMatchesEl && s) onlyMatchesEl.checked = !!(s.filters && s.filters.onlyMatches);
    if (onlyResearchedEl && s) onlyResearchedEl.checked = !!(s.filters && s.filters.onlyResearched);
    if (onlySummariesEl && s) onlySummariesEl.checked = !!(s.filters && s.filters.onlySummaries);

    if (intervalSel && s) intervalSel.value = String(s.intervalSec || 120);

    if (pinBtn) {
      const pinned = isPinnedFeed(feedUrl);
      pinBtn.classList.toggle('on', pinned);
      pinBtn.textContent = pinned ? t('pinned') : t('pin');
      pinBtn.title = pinned ? t('unpin_column') : t('pin_column');
      col.classList.toggle('colPinned', pinned);
    }

    // menu toggle button label
    const menuBtn = col.querySelector('button[data-action="toggleColMenu"]');
    if (menuBtn) {
      const open = isColumnMenuOpen(feedUrl);
      menuBtn.textContent = open ? t('hide_controls') : t('show_controls');
    }

    const dragHandle = col.querySelector('.dragHandle');
    if (dragHandle) {
      dragHandle.setAttribute('title', t('drag_to_reorder'));
      dragHandle.setAttribute('aria-label', t('drag_column'));
    }
  }

  // -------- Column menu open/close (NEW) --------
  function isColumnMenuOpen(feedUrl) {
    // default open unless explicitly false
    return colMenuOpenByFeed[feedUrl] !== '0';
  }

  function setColumnMenuOpen(feedUrl, open) {
    colMenuOpenByFeed[feedUrl] = open ? '1' : '0';
    saveJsonMap(COL_MENU_KEY, colMenuOpenByFeed);

    const col = columns[feedUrl];
    if (col) {
      col.classList.toggle('colMenuCollapsed', !open);
      updateColumnUi(feedUrl);
    }
    updateAllColumnControlsUi();
  }

  function toggleColumnMenu(feedUrl) {
    setColumnMenuOpen(feedUrl, !isColumnMenuOpen(feedUrl));
  }

  function areAllColumnMenusOpen() {
    const urls = Object.keys(columns);
    if (!urls.length) return true;
    return urls.every(u => isColumnMenuOpen(u));
  }

  function updateAllColumnControlsUi() {
    if (!allColControlsToggle) return;
    const allOpen = areAllColumnMenusOpen();
    allColControlsToggle.textContent = allOpen ? t('hide_all_column_controls') : t('show_all_column_controls');
    emitTopUiState();
    renderHelp();
  }

  function toggleAllColumnMenus() {
    const open = !areAllColumnMenusOpen();
    Object.keys(columns).forEach(url => setColumnMenuOpen(url, open));
    updateAllColumnControlsUi();
  }

  function isPinnedFeed(feedUrl) {
    return pinnedFeeds[feedUrl] === '1';
  }

  function setPinnedFeed(feedUrl, pinned) {
    if (feedUrl === FILTERED_FEED_URL) return;
    pinnedFeeds[feedUrl] = pinned ? '1' : '0';
    saveJsonMap(PINNED_FEEDS_KEY, pinnedFeeds);

    const col = columns[feedUrl];
    if (col) {
      col.classList.toggle('colPinned', pinned);
      const pinBtn = col.querySelector('button[data-action="pinCol"]');
      if (pinBtn) {
        pinBtn.classList.toggle('on', pinned);
        pinBtn.textContent = pinned ? t('pinned') : t('pin');
        pinBtn.title = pinned ? t('unpin_column') : t('pin_column');
      }
    }
    renderHelp();
  }

  function togglePinnedFeed(feedUrl) {
    setPinnedFeed(feedUrl, !isPinnedFeed(feedUrl));
  }
  // --------------------------------------------

  // Drag & Drop
  let draggingUrl = null;
  let allowDrag = false;
  let allowDragUrl = null;

  function clearDropTargets() {
    Object.values(columns).forEach(col => col.classList.remove('dropTarget'));
  }

  function onDragStart(e, feedUrl) {
    draggingUrl = feedUrl;
    const col = columns[feedUrl];
    if (col) col.classList.add('dragging');
    try {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', feedUrl);
    } catch {}
  }

  function onDragEnd() {
    if (draggingUrl && columns[draggingUrl]) {
      columns[draggingUrl].classList.remove('dragging');
    }
    draggingUrl = null;
    clearDropTargets();
    saveOrderNow();
    applyColumnThemes();
  }

  function getGridColumnsInDomOrder() {
    return Array.from(grid.querySelectorAll('.column'));
  }

  function getClosestColumnByCenter(excludeUrl, clientX, clientY) {
    const cols = getGridColumnsInDomOrder();
    let best = null;
    let bestDist = Infinity;

    for (const col of cols) {
      const url = col.getAttribute('data-feed-url');
      if (!url || url === excludeUrl) continue;

      const r = col.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;

      const dx = clientX - cx;
      const dy = clientY - cy;
      const d = dx * dx + dy * dy;

      if (d < bestDist) {
        bestDist = d;
        best = col;
      }
    }
    return best;
  }

  function moveDraggedBetween(clientX, clientY) {
    if (!draggingUrl) return;
    const dragged = columns[draggingUrl];
    if (!dragged) return;

    const closest = getClosestColumnByCenter(draggingUrl, clientX, clientY);
    if (!closest) return;

    const rect = closest.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const before = clientX < centerX;

    if (before) {
      if (dragged.nextElementSibling === closest) return;
      grid.insertBefore(dragged, closest);
    } else {
      if (closest.nextElementSibling === dragged) return;
      grid.insertBefore(dragged, closest.nextElementSibling);
    }

    clearDropTargets();
    closest.classList.add('dropTarget');
  }

  grid.addEventListener('dragover', e => {
    e.preventDefault();
    if (!draggingUrl) return;
    moveDraggedBetween(e.clientX, e.clientY);
    try { e.dataTransfer.dropEffect = 'move'; } catch {}
  });

  grid.addEventListener('drop', e => {
    e.preventDefault();
    clearDropTargets();
    saveOrderNow();
    applyColumnThemes();
  });

  function ensureColumn(feedUrl, label, kind, atStart = false) {
    if (columns[feedUrl]) return;

    const col = document.createElement('div');
    col.className = 'column';
    col.setAttribute('data-feed-url', feedUrl);
    col.setAttribute('draggable', 'true');

    const isFiltered = feedUrl === FILTERED_FEED_URL;
    const badgeText = isFiltered ? (uiLang === 'bg' ? 'ключови' : 'keywords') : (kind || 'feed');

    col.innerHTML = `
      <div class="colHeader">
        <div class="colHeaderTop">
          <div class="colLeft">
            <div class="dragHandle" title="Drag to reorder" aria-label="Drag column">
              <div class="dragDots"></div>
            </div>

            <div class="colTitleWrap">
              <div class="colTitleRow">
                <div class="colTitle" title="${escapeHtml(label)}">${escapeHtml(label)}</div>
                <span class="countBadge" data-role="count" title="${escapeHtml(t('news_items_title', { count: 0 }))}">0</span>
                <span class="badge">${escapeHtml(badgeText)}</span>
              </div>
            </div>
          </div>

          <div class="colHeaderRight">
            ${isFiltered ? '' : `<button class="colBtn ghost" data-action="pinCol" type="button" title="${escapeHtml(t('pin_column'))}">${escapeHtml(t('pin'))}</button>`}
            ${isFiltered ? '' : `<button class="colBtn ghost danger" data-action="removeCol" type="button" title="${escapeHtml(t('remove_stream'))}">${escapeHtml(t('remove'))}</button>`}
            <button class="colBtn ghost mobileTopBtn" data-action="moveTop" type="button" title="${escapeHtml(t('move_column_to_top'))}">${escapeHtml(t('top'))}</button>
            <button class="colBtn ghost" data-action="toggleColMenu" type="button">${escapeHtml(t('hide_controls'))}</button>
          </div>
        </div>

        <div class="colControlsWrap">
          <div class="colControls">
            <button class="colBtn" data-action="newest10" type="button">${escapeHtml(t('newest'))}</button>
            <button class="colBtn" data-action="toggleSummary" type="button">${escapeHtml(t('summaries_off'))}</button>
            <button class="colBtn" data-action="toggleResearch" type="button">${escapeHtml(t('auto_research_off'))}</button>

            <select class="select" data-action="budget" title="${escapeHtml(t('ai_budget_all'))}">
              <option value="low">${escapeHtml(t('budget_low'))}</option>
              <option value="standard" selected>${escapeHtml(t('budget_standard'))}</option>
              <option value="high">${escapeHtml(t('budget_high'))}</option>
            </select>

            <select class="select" data-action="sort" title="${escapeHtml(t('sort_newest'))}">
              <option value="newest" selected>${escapeHtml(t('sort_newest'))}</option>
              <option value="oldest">${escapeHtml(t('sort_oldest'))}</option>
              <option value="matched">${escapeHtml(t('sort_matched'))}</option>
            </select>

            <select class="select" data-action="interval" title="${escapeHtml(t('poll_interval', { sec: 120 }))}">
              <option value="45">${escapeHtml(t('poll_interval', { sec: 45 }))}</option>
              <option value="60">${escapeHtml(t('poll_interval', { sec: 60 }))}</option>
              <option value="90">${escapeHtml(t('poll_interval', { sec: 90 }))}</option>
              <option value="120">${escapeHtml(t('poll_interval', { sec: 120 }))}</option>
              <option value="180">${escapeHtml(t('poll_interval', { sec: 180 }))}</option>
              <option value="300">${escapeHtml(t('poll_interval', { sec: 300 }))}</option>
            </select>

            <select class="select" data-action="deleteAgeRange" title="${escapeHtml(t('delete_old_news_col'))}">
              <option value="yesterday">${escapeHtml(t('delete_yesterday'))}</option>
              <option value="week" selected>${escapeHtml(t('delete_week'))}</option>
              <option value="month">${escapeHtml(t('delete_month'))}</option>
              <option value="year">${escapeHtml(t('delete_year'))}</option>
            </select>
            <button class="colBtn ghost danger" data-action="deleteAgeCol" type="button">${escapeHtml(t('delete_old'))}</button>

            <label class="checkbox" title="${escapeHtml(t('matches'))}">
              <input type="checkbox" data-action="onlyMatches" />
              <span data-role="onlyMatchesLabel">${escapeHtml(t('matches'))}</span>
            </label>
            <label class="checkbox" title="${escapeHtml(t('researched'))}">
              <input type="checkbox" data-action="onlyResearched" />
              <span data-role="onlyResearchedLabel">${escapeHtml(t('researched'))}</span>
            </label>
            <label class="checkbox" title="${escapeHtml(t('summaries'))}">
              <input type="checkbox" data-action="onlySummaries" />
              <span data-role="onlySummariesLabel">${escapeHtml(t('summaries'))}</span>
            </label>
          </div>
        </div>
      </div>

      <div class="items"></div>
      <div class="toggle" style="display:none"></div>
    `;

    if (atStart && grid.firstChild) grid.insertBefore(col, grid.firstChild);
    else grid.appendChild(col);

    columns[feedUrl] = col;
    store[feedUrl] = { items: [], seen: new Set(), visible: 10 };
    updateColumnCount(feedUrl, 0);

    // Apply persisted menu state (NEW)
    col.classList.toggle('colMenuCollapsed', !isColumnMenuOpen(feedUrl));

    // Drag handle gating
    const handle = col.querySelector('.dragHandle');
    function armDrag() { allowDrag = true; allowDragUrl = feedUrl; }
    function disarmDrag() { allowDrag = false; allowDragUrl = null; }
    handle.addEventListener('pointerdown', e => { e.stopPropagation(); armDrag(); });
    handle.addEventListener('pointerup', disarmDrag);
    handle.addEventListener('pointercancel', disarmDrag);
    handle.addEventListener('lostpointercapture', disarmDrag);
    window.addEventListener('pointerup', disarmDrag);

    col.addEventListener('dragstart', e => {
      if (!allowDrag || allowDragUrl !== feedUrl) { e.preventDefault(); return; }
      onDragStart(e, feedUrl);
    });
    col.addEventListener('dragend', () => { disarmDrag(); onDragEnd(); });

    // Column menu toggle (NEW)
    col.querySelector('button[data-action="toggleColMenu"]').addEventListener('click', () => {
      toggleColumnMenu(feedUrl);
    });
    col.querySelector('button[data-action="pinCol"]')?.addEventListener('click', () => {
      togglePinnedFeed(feedUrl);
      toast(isPinnedFeed(feedUrl) ? t('pinned') : t('unpinned'));
    });
    col.querySelector('button[data-action="removeCol"]')?.addEventListener('click', () => {
      const title = (col.querySelector('.colTitle')?.textContent || feedUrl).trim();
      const ok = window.confirm(t('remove_stream_confirm', { title }));
      if (!ok) return;
      send({ type: 'remove_feed', feedUrl });
    });
    col.querySelector('button[data-action="moveTop"]').addEventListener('click', () => {
      moveColumnToTop(feedUrl);
      toast(t('moved_to_top'));
    });
    col.querySelector('button[data-action="deleteAgeCol"]').addEventListener('click', () => {
      const sel = col.querySelector('select[data-action="deleteAgeRange"]');
      const ageRange = normalizeDeleteAge(sel ? sel.value : 'week');
      const removed = removeOldItemsFromFeed(feedUrl, ageRange, true);
      if (!removed) return toast(t('no_news_older_than', { age: deleteAgeLabel(ageRange) }));
      toast(t('deleted_news_older_than', { count: removed, age: deleteAgeLabel(ageRange) }));
    });

    // Column actions
    col.querySelector('button[data-action="newest10"]').addEventListener('click', () => {
      store[feedUrl].visible = 10;
      renderFeed(feedUrl);
    });

    col.querySelector('button[data-action="toggleSummary"]').addEventListener('click', () => {
      if (!aiAvailable) return;
      clearItemBodyState(feedUrl);
      const s = getFeedSetting(feedUrl);
      const enabled = !(s && s.summaryEnabled);
      send({ type: 'set_feed_summary', feedUrl, enabled });
    });

    col.querySelector('button[data-action="toggleResearch"]').addEventListener('click', () => {
      if (!aiAvailable) return;
      clearItemBodyState(feedUrl);
      const s = getFeedSetting(feedUrl);
      const enabled = !(s && s.researchEnabled);
      send({ type: 'set_feed_research', feedUrl, enabled });
    });

    col.querySelector('select[data-action="budget"]').addEventListener('change', (e) => {
      const budget = e.target.value;
      send({ type: 'set_feed_budget', feedUrl, budget });
    });

    col.querySelector('select[data-action="interval"]').addEventListener('change', (e) => {
      const intervalSec = parseInt(e.target.value, 10);
      send({ type: 'set_feed_interval', feedUrl, intervalSec });
      toast(t('polling_toast', { sec: intervalSec }));
    });

    function pushColumnSettings() {
      const sortMode = col.querySelector('select[data-action="sort"]').value;
      const filters = {
        onlyMatches: col.querySelector('input[data-action="onlyMatches"]').checked,
        onlyResearched: col.querySelector('input[data-action="onlyResearched"]').checked,
        onlySummaries: col.querySelector('input[data-action="onlySummaries"]').checked
      };
      send({ type: 'set_feed_column_settings', feedUrl, sortMode, filters });
      renderFeed(feedUrl);
    }

    col.querySelector('select[data-action="sort"]').addEventListener('change', pushColumnSettings);
    col.querySelector('input[data-action="onlyMatches"]').addEventListener('change', pushColumnSettings);
    col.querySelector('input[data-action="onlyResearched"]').addEventListener('change', pushColumnSettings);
    col.querySelector('input[data-action="onlySummaries"]').addEventListener('change', pushColumnSettings);

    updateColumnUi(feedUrl);
    updateAllColumnControlsUi();
  }

  function shouldFlash(itemKey) {
    const t = flashKeys.get(itemKey);
    return t ? (Date.now() - t < FLASH_MS) : false;
  }

  function matchesSearch(it) {
    if (!searchQuery) return true;
    const hay = norm(it.title) + ' ' + norm(it.summary || '') + ' ' + norm(it.research || '');
    return hay.includes(searchQuery);
  }

  function previewText(fullText) {
    const text = String(fullText || '').trim();
    if (!text || text.length <= BODY_PREVIEW_CHARS) return text;
    const cut = text.slice(0, BODY_PREVIEW_CHARS);
    const w = cut.lastIndexOf(' ');
    const safe = w > BODY_PREVIEW_CHARS * 0.62 ? cut.slice(0, w) : cut;
    return `${safe.trimEnd()}…`;
  }

  function parseResearchText(rawText) {
    const raw = String(rawText || '').trim();
    if (!raw) return { text: '', confidence: 'Unknown' };

    const match = raw.match(/confidence:\s*(low|medium|high)/i);
    const confidence = match
      ? `${match[1].slice(0, 1).toUpperCase()}${match[1].slice(1).toLowerCase()}`
      : 'Unknown';

    let text = raw
      .replace(/\s*confidence:\s*(low|medium|high)\s*\.?/ig, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!text) text = raw;
    return { text, confidence };
  }

  function ensureAskState(it) {
    if (!it || typeof it !== 'object') return;
    if (!Array.isArray(it._askMessages)) it._askMessages = [];
    if (!Number.isFinite(it._askUsed)) it._askUsed = 0;
    if (typeof it._askOpen !== 'boolean') it._askOpen = false;
    if (typeof it._askPending !== 'boolean') it._askPending = false;
    if (typeof it._askAlertSeen !== 'boolean') it._askAlertSeen = false;
    if (typeof it._askDraft !== 'string') it._askDraft = '';
  }

  function pushAskMessage(it, role, text) {
    ensureAskState(it);
    const safeRole = role === 'q' || role === 'a' || role === 'e' ? role : 'a';
    const safeText = String(text || '').trim();
    if (!safeText) return;
    it._askMessages.push({ role: safeRole, text: safeText });
    if (it._askMessages.length > ASK_AGENT_MAX_MESSAGES) {
      it._askMessages = it._askMessages.slice(-ASK_AGENT_MAX_MESSAGES);
    }
  }

  function findItemsInStore(feedUrl, id) {
    const wanted = String(id || '').trim();
    if (!wanted) return [];

    const hits = [];
    const direct = String(feedUrl || '').trim();
    if (direct && store[direct] && Array.isArray(store[direct].items)) {
      const hit = store[direct].items.find(x => x.id === wanted);
      if (hit) hits.push({ feedUrl: direct, item: hit });
    }

    for (const url of Object.keys(store)) {
      if (url === direct) continue;
      const state = store[url];
      if (!state || !Array.isArray(state.items)) continue;
      const hit = state.items.find(x => x.id === wanted);
      if (hit) hits.push({ feedUrl: url, item: hit });
    }
    return hits;
  }

  function clearItemBodyState(feedUrl) {
    const state = store[feedUrl];
    if (!state || !Array.isArray(state.items)) return;
    for (const it of state.items) {
      it.summary = '';
      it.research = '';
      it._summaryPending = false;
      it._researchPending = false;
      it._bodyMode = 'hidden';
    }
    renderFeed(feedUrl);
  }

  function hideAllResearchBodies() {
    let changed = 0;
    Object.keys(store).forEach(feedUrl => {
      const state = store[feedUrl];
      if (!state || !Array.isArray(state.items)) return;
      for (const it of state.items) {
        const hasResearch = !!(it.research && String(it.research).trim());
        if (!hasResearch && !it._researchPending) continue;
        if (it._bodyMode !== 'hidden') changed += 1;
        it._bodyMode = 'hidden';
      }
    });
    renderAllFeeds();
    if (changed > 0) toast(t('all_research_hidden_toast', { count: changed }));
    else toast(t('no_research_to_hide'));
  }

  function normalizeDeleteAge(v) {
    const s = String(v || '').trim().toLowerCase();
    if (s === 'yesterday' || s === 'week' || s === 'month' || s === 'year') return s;
    return 'week';
  }

  function deleteAgeLabel(v) {
    const next = normalizeDeleteAge(v);
    if (next === 'yesterday') return t('yesterday').toLocaleLowerCase();
    if (next === 'month') return t('past_month').toLocaleLowerCase();
    if (next === 'year') return t('past_year').toLocaleLowerCase();
    return t('past_week').toLocaleLowerCase();
  }

  function deleteAgeCutoffMs(v) {
    const next = normalizeDeleteAge(v);
    const dayMs = 24 * 60 * 60 * 1000;
    const days = next === 'yesterday' ? 1 : next === 'month' ? 30 : next === 'year' ? 365 : 7;
    return Date.now() - (days * dayMs);
  }

  function removeOldItemsFromFeed(feedUrl, ageRange, rerender = true) {
    const state = store[feedUrl];
    if (!state || !Array.isArray(state.items)) return 0;

    const cutoffMs = deleteAgeCutoffMs(ageRange);
    const before = state.items.length;
    const kept = [];

    for (const it of state.items) {
      const ts = Number.isFinite(it.publishedMs) ? it.publishedMs : NaN;
      const shouldDelete = Number.isFinite(ts) && ts < cutoffMs;
      if (!shouldDelete) {
        kept.push(it);
        continue;
      }

      if (it.id) {
        hiddenIds.delete(it.id);
        forcedSummaryIds.delete(it.id);
      }
      const key = it.id || it.link || it.title;
      if (key) flashKeys.delete(key);
    }

    const removed = before - kept.length;
    if (!removed) return 0;

    state.items = kept;
    state.seen = new Set(kept.map(x => x.id || x.link || x.title).filter(Boolean));
    state.visible = Math.max(0, Math.min(state.visible, kept.length));
    if (rerender) renderFeed(feedUrl);
    return removed;
  }

  function removeOldItemsFromAllFeeds(ageRange) {
    let removed = 0;
    Object.keys(store).forEach(feedUrl => {
      removed += removeOldItemsFromFeed(feedUrl, ageRange, false);
    });
    renderAllFeeds();
    return removed;
  }

  function passesColumnFilters(feedUrl, it) {
    const s = getFeedSetting(feedUrl);
    if (!s || !s.filters) return true;

    if (s.filters.onlyMatches && !it.isMatch) return false;
    if (s.filters.onlyResearched && !(it.research && it.research.trim())) return false;
    if (s.filters.onlySummaries && !(it.summary && it.summary.trim())) return false;

    return true;
  }

  function stableSort(list, feedUrl) {
    const s = getFeedSetting(feedUrl);
    const sortMode = (s && s.sortMode) ? s.sortMode : 'newest';

    const byNewest = (a, b) => {
      const am = Number.isFinite(a.publishedMs) ? a.publishedMs : 0;
      const bm = Number.isFinite(b.publishedMs) ? b.publishedMs : 0;
      if (bm !== am) return bm - am;
      return (b._seq || 0) - (a._seq || 0);
    };

    const byOldest = (a, b) => {
      const am = Number.isFinite(a.publishedMs) ? a.publishedMs : 0;
      const bm = Number.isFinite(b.publishedMs) ? b.publishedMs : 0;
      if (am !== bm) return am - bm;
      return (a._seq || 0) - (b._seq || 0);
    };

    const byMatched = (a, b) => {
      const as = Number.isFinite(a.matchScore) ? a.matchScore : 0;
      const bs = Number.isFinite(b.matchScore) ? b.matchScore : 0;
      if (bs !== as) return bs - as;
      return byNewest(a, b);
    };

    const cmp = sortMode === 'oldest' ? byOldest : sortMode === 'matched' ? byMatched : byNewest;
    return list.slice().sort(cmp);
  }

  function renderFeed(feedUrl) {
    const col = columns[feedUrl];
    if (!col) return;

    const itemsEl = col.querySelector('.items');
    const toggle = col.querySelector('.toggle');
    const state = store[feedUrl];

    const listAll = stableSort(state.items, feedUrl)
      .filter(it => !hiddenIds.has(it.id))
      .filter(it => passesColumnFilters(feedUrl, it));

    const list = searchQuery ? listAll.filter(matchesSearch) : listAll;
    updateColumnCount(feedUrl, list.length);

    state.visible = Math.max(0, Math.min(state.visible, list.length));
    itemsEl.innerHTML = '';

    const limit = state.visible;
    const isFilteredColumn = feedUrl === FILTERED_FEED_URL;

    const s = getFeedSetting(feedUrl);
    const showSummaryColumn = !!(s && s.summaryEnabled);

    for (let i = 0; i < limit; i++) {
      const it = list[i];
      ensureAskState(it);
      const div = document.createElement('div');

      const showMatchTag = !isFilteredColumn && it.isMatch;
      div.className = 'item' + (!isFilteredColumn && it.isMatch ? ' keywordMatch' : '');

      const key = it.id || it.link || it.title;
      if (shouldFlash(key)) div.classList.add('flash');

      const tag = showMatchTag ? `<span class="matchTag">${escapeHtml(t('match'))}</span>` : '';

      const showSummaryForThisItem = showSummaryColumn || (it.id && forcedSummaryIds.has(it.id));
      const hasResearch = !!(it.research && it.research.trim());

      let bodyKind = '';
      let bodyTextRaw = '';
      let bodyConfidence = '';
      let bodyMeta = false;

      if (it._researchPending) {
        bodyKind = 'Research';
        bodyTextRaw = t('researching');
        bodyMeta = true;
      } else if (hasResearch) {
        bodyKind = 'Research';
        const parsedResearch = parseResearchText(it.research);
        bodyTextRaw = parsedResearch.text;
        bodyConfidence = parsedResearch.confidence;
      } else if (showSummaryForThisItem || it._summaryPending) {
        bodyKind = 'Summary';
        if (it._summaryPending) {
          bodyTextRaw = t('generating_summary');
          bodyMeta = true;
        } else if (it.summary && it.summary.trim()) bodyTextRaw = it.summary;
        else {
          bodyTextRaw = (aiAvailable && aiEnabledServer) ? t('generating_summary') : t('no_summary');
          bodyMeta = true;
        }
      }

      const hasBody = !!bodyTextRaw;
      const bodyIsLong = hasBody && bodyTextRaw.length > BODY_PREVIEW_CHARS;
      if (!it._bodyMode) it._bodyMode = 'expanded';
      if (!bodyIsLong && it._bodyMode === 'collapsed') it._bodyMode = 'expanded';

      const bodyHidden = it._bodyMode === 'hidden';
      const bodyCollapsed = bodyIsLong && it._bodyMode === 'collapsed';
      const bodyText = bodyCollapsed ? previewText(bodyTextRaw) : bodyTextRaw;

      const bodySubLabelHtml = bodyKind === 'Research' && !bodyHidden && !it._researchPending
        ? `<div class="bodySubKind">${escapeHtml(t('confidence'))}: ${escapeHtml(bodyConfidence || (uiLang === 'bg' ? 'Неизвестна' : 'Unknown'))}</div>`
        : '';

      const bodyControlsHtml = hasBody
        ? `
          <div class="bodyControls">
            ${bodyHidden ? `<button class="bodyControlBtn" data-action="showBody" type="button">${escapeHtml(t('show_label', { kind: bodyKind === 'Research' ? t('research') : t('summary') }))}</button>` : ''}
            ${!bodyHidden && bodyIsLong ? `<button class="bodyControlBtn" data-action="${bodyCollapsed ? 'moreBody' : 'lessBody'}" type="button">${bodyCollapsed ? escapeHtml(t('show_more')) : escapeHtml(t('show_less'))}</button>` : ''}
            ${!bodyHidden ? `<button class="bodyControlBtn danger" data-action="hideBody" type="button">${escapeHtml(t('hide_label', { kind: bodyKind === 'Research' ? t('research') : t('summary') }))}</button>` : ''}
          </div>
        `
        : '';
      const bodyHtml = hasBody
        ? (
          bodyHidden
            ? `${bodyControlsHtml}`
            : `
              ${bodySubLabelHtml ? `<div class="bodyMetaRow"><div class="bodyLabelWrap">${bodySubLabelHtml}</div></div>` : ''}
              <div class="bodyText ${bodyMeta ? 'bodyMeta' : ''}">${escapeHtml(bodyText)}</div>
              ${bodyControlsHtml}
            `
        )
        : '';

      const pendingR = it._researchPending ? 'data-pending="1"' : '';
      const pendingS = it._summaryPending ? 'data-pending="1"' : '';
      const askUsed = Number.isFinite(it._askUsed) ? Math.max(0, Math.floor(it._askUsed)) : 0;
      const askLeft = Math.max(0, ASK_AGENT_MAX_QUESTIONS - askUsed);

      const vibe = String(document.body.dataset.vibe || 'default');
      const summaryIconClass = vibe === 'anime'
        ? 'fa-wand-magic-sparkles'
        : vibe === 'arcade'
          ? 'fa-trophy'
          : vibe === 'cinema'
            ? 'fa-film'
            : vibe === 'newspaper'
              ? 'fa-newspaper'
              : vibe === 'cyberwitch'
                ? 'fa-hat-wizard'
                : vibe === 'fantasy'
                  ? 'fa-book-open'
                  : vibe === 'scifi'
                    ? 'fa-robot'
            : 'fa-file-lines';
      const researchIconClass = vibe === 'anime'
        ? 'fa-dragon'
        : vibe === 'arcade'
          ? 'fa-crosshairs'
          : vibe === 'cinema'
            ? 'fa-clapperboard'
            : vibe === 'newspaper'
              ? 'fa-magnifying-glass'
              : vibe === 'cyberwitch'
                ? 'fa-bolt'
                : vibe === 'fantasy'
                  ? 'fa-dragon'
                  : vibe === 'scifi'
                    ? 'fa-microchip'
            : 'fa-magnifying-glass';
      const moreIconClass = 'fa-ellipsis';
      const shareMenuIconClass = vibe === 'anime'
        ? 'fa-paper-plane'
        : vibe === 'arcade'
          ? 'fa-share-nodes'
          : vibe === 'cinema'
            ? 'fa-link'
            : vibe === 'newspaper'
              ? 'fa-link'
              : vibe === 'cyberwitch'
                ? 'fa-satellite-dish'
                : vibe === 'fantasy'
                  ? 'fa-link'
                  : vibe === 'scifi'
                    ? 'fa-shuttle-space'
            : 'fa-arrow-up-right-from-square';
      const hideIconClass = vibe === 'anime'
        ? 'fa-eye-slash'
        : vibe === 'arcade'
          ? 'fa-skull-crossbones'
          : vibe === 'cinema'
            ? 'fa-masks-theater'
            : vibe === 'newspaper'
              ? 'fa-ban'
              : vibe === 'cyberwitch'
                ? 'fa-user-secret'
                : vibe === 'fantasy'
                  ? 'fa-eye-slash'
                  : vibe === 'scifi'
                    ? 'fa-eye-slash'
            : 'fa-eye-slash';
      const askIconClass = vibe === 'anime'
        ? 'fa-comment-dots'
        : vibe === 'arcade'
          ? 'fa-headset'
          : vibe === 'cinema'
            ? 'fa-microphone-lines'
            : vibe === 'newspaper'
              ? 'fa-circle-question'
              : vibe === 'cyberwitch'
                ? 'fa-hand-sparkles'
                : vibe === 'fantasy'
                  ? 'fa-scroll'
                  : vibe === 'scifi'
                    ? 'fa-user-astronaut'
            : 'fa-comments';

      const summaryLabel = buttonMode === 'icons'
        ? `<i class="fa-solid ${it._summaryPending ? 'fa-spinner fa-spin' : summaryIconClass} iconGlyph" aria-hidden="true"></i><span class="srOnly">${escapeHtml(t('summary'))}</span>`
        : (it._summaryPending ? t('generating_summary') : (it.summary && it.summary.trim() ? t('refresh_summary') : t('generate_summary')));
      const researchLabel = buttonMode === 'icons'
        ? `<i class="fa-solid ${it._researchPending ? 'fa-spinner fa-spin' : researchIconClass} iconGlyph" aria-hidden="true"></i><span class="srOnly">${escapeHtml(t('research'))}</span>`
        : (it._researchPending ? t('researching') : (hasResearch ? t('refresh_research') : t('generate_research')));
      const askLabel = buttonMode === 'icons'
        ? `<i class="fa-solid ${it._askPending ? 'fa-spinner fa-spin' : askIconClass} iconGlyph" aria-hidden="true"></i><span class="srOnly">${escapeHtml(t('ask_agent'))}</span>`
        : (it._askOpen ? t('hide_ask_agent') : t('ask_agent'));
      const moreLabel = buttonMode === 'icons'
        ? `<i class="fa-solid ${moreIconClass} iconGlyph" aria-hidden="true"></i><span class="srOnly">${escapeHtml(t('more_actions'))}</span>`
        : t('more');
      const shareMenuIcon = `<i class="fa-solid ${shareMenuIconClass} iconGlyph" aria-hidden="true"></i>`;
      const hideMenuIcon = `<i class="fa-solid ${hideIconClass} iconGlyph" aria-hidden="true"></i>`;
      const askMessagesHtml = it._askMessages.length
        ? it._askMessages.map(m => {
          const role = m.role === 'q' ? 'Q' : m.role === 'e' ? '!' : 'A';
          const cls = m.role === 'q' ? 'askQ' : m.role === 'e' ? 'askErr' : 'askA';
          return `<div class="askMsg ${cls}"><span class="askMsgRole">${role}</span><span class="askMsgText">${escapeHtml(m.text)}</span></div>`;
        }).join('')
        : `<div class="askHint">${escapeHtml(t('ask_only_this_news'))}</div>`;
      const askPanelHtml = it._askOpen
        ? `
          <div class="askPanel">
            <div class="askPanelHead">
              <div class="askTitle">${escapeHtml(t('ask_agent'))}</div>
              <div class="askCount">${escapeHtml(t('questions_left'))}: ${askLeft}</div>
            </div>
            <div class="askMessages">
              ${askMessagesHtml}
              ${it._askPending ? `<div class="askMsg askPending"><span class="askMsgRole">A</span><span class="askMsgText">${escapeHtml(t('thinking'))}</span></div>` : ''}
            </div>
            <div class="askInputRow">
              <input
                class="askInput"
                data-action="askInput"
                maxlength="${ASK_AGENT_MAX_CHARS}"
                value="${escapeHtml(it._askDraft || '')}"
                placeholder="${askLeft > 0 ? escapeHtml(t('ask_placeholder')) : escapeHtml(t('ask_limit_reached'))}"
                ${askLeft > 0 ? '' : 'disabled'}
              />
              <button class="askSendBtn" data-action="askSend" type="button" ${it._askPending || askLeft <= 0 ? 'disabled' : ''}>${escapeHtml(t('send'))}</button>
            </div>
          </div>
        `
        : '';

      div.innerHTML = `
        <div class="timeRow">
          <div class="time">${formatDate(it.publishedMs)}</div>
          <div>${tag}</div>
        </div>

        <a class="headline" href="${it.link}" target="_blank" rel="noopener">${escapeHtml(it.title)}</a>

        ${bodyHtml}

        <div class="itemActions">
          <button class="pillBtn actionSummary" data-action="summary" ${pendingS} title="${escapeHtml(t('generate_summary'))}" aria-label="${escapeHtml(t('generate_summary'))}">${summaryLabel}</button>
          <button class="pillBtn actionResearch" data-action="research" ${pendingR} title="${escapeHtml(t('generate_research'))}" aria-label="${escapeHtml(t('generate_research'))}">${researchLabel}</button>
          <button class="pillBtn actionAsk" data-action="ask" title="${escapeHtml(t('ask_agent'))}" aria-label="${escapeHtml(t('ask_agent'))}">${askLabel}</button>
          <details class="itemMenu">
            <summary class="pillBtn actionMore" title="${escapeHtml(t('more'))}" aria-label="${escapeHtml(t('more'))}">${moreLabel}</summary>
            <div class="itemMenuList">
              <button class="menuItemBtn" data-action="share" title="${escapeHtml(t('share_link'))}" aria-label="${escapeHtml(t('share_link'))}">${shareMenuIcon}<span class="menuItemText">${escapeHtml(t('share_link'))}</span></button>
              <button class="menuItemBtn danger" data-action="hide" title="${escapeHtml(t('hide_news'))}" aria-label="${escapeHtml(t('hide_news'))}">${hideMenuIcon}<span class="menuItemText">${escapeHtml(t('hide_news'))}</span></button>
            </div>
          </details>
        </div>

        ${askPanelHtml}
      `;

      const itemMenu = div.querySelector('.itemMenu');
      itemMenu?.addEventListener('toggle', () => {
        div.classList.toggle('menuOpen', !!itemMenu.open);
      });

      div.querySelector('button[data-action="share"]').addEventListener('click', async () => {
        const ok = await copyToClipboard(it.link);
        toast(ok ? t('link_copied') : t('copy_failed'));
        const menu = div.querySelector('.itemMenu');
        if (menu) menu.open = false;
      });

      div.querySelector('button[data-action="hide"]').addEventListener('click', () => {
        send({ type: 'hide_item', id: it.id });
        toast(t('hidden'));
        const menu = div.querySelector('.itemMenu');
        if (menu) menu.open = false;
      });

      div.querySelector('button[data-action="summary"]').addEventListener('click', () => {
        if (!aiAvailable) return toast(t('ai_unavailable'));
        it.summary = '';
        it.research = '';
        it._researchPending = false;
        it._summaryPending = true;
        it._bodyMode = 'expanded';
        forcedSummaryIds.add(it.id);
        renderFeed(feedUrl);
        send({ type: 'run_summary_item', id: it.id, feedUrl });
      });

      div.querySelector('button[data-action="research"]').addEventListener('click', () => {
        if (!aiAvailable) return toast(t('ai_unavailable'));
        it.summary = '';
        it.research = '';
        it._summaryPending = false;
        it._researchPending = true;
        it._bodyMode = 'expanded';
        renderFeed(feedUrl);
        send({ type: 'run_research_item', id: it.id, feedUrl });
      });

      div.querySelector('button[data-action="ask"]').addEventListener('click', () => {
        if (!aiAvailable || !aiEnabledServer) return toast(t('ai_unavailable'));
        if (!it._askAlertSeen) {
          alert(t('ask_agent_alert'));
          it._askAlertSeen = true;
        }
        it._askOpen = !it._askOpen;
        if (it._askOpen && it._askUsed >= ASK_AGENT_MAX_QUESTIONS) {
          toast(t('question_limit_reached', { used: ASK_AGENT_MAX_QUESTIONS, max: ASK_AGENT_MAX_QUESTIONS }));
        }
        renderFeed(feedUrl);
      });

      const askInputEl = div.querySelector('input[data-action="askInput"]');
      const askSendBtnEl = div.querySelector('button[data-action="askSend"]');

      const submitAsk = () => {
        if (!askInputEl || !it.id) return;
        ensureAskState(it);
        if (it._askPending) return;

        const question = String(askInputEl.value || '').trim().slice(0, ASK_AGENT_MAX_CHARS);
        if (!question) return;
        if (it._askUsed >= ASK_AGENT_MAX_QUESTIONS) {
          toast(t('question_limit_reached', { used: ASK_AGENT_MAX_QUESTIONS, max: ASK_AGENT_MAX_QUESTIONS }));
          return;
        }

        const sourceFeedUrl = String(it.feedUrl || feedUrl || '').trim();
        const sourceSettings = getFeedSetting(sourceFeedUrl);
        const budget = sourceSettings && sourceSettings.budget ? sourceSettings.budget : 'standard';
        let researchMode = 'auto';
        if (budget === 'low') {
          const hasExistingResearch = !!(it.research && it.research.trim());
          const questionPrompt = hasExistingResearch
            ? t('low_budget_prompt_with_research')
            : t('low_budget_prompt_no_research');
          researchMode = confirm(questionPrompt) ? 'force' : 'reuse';
        }

        pushAskMessage(it, 'q', question);
        it._askUsed = Math.min(ASK_AGENT_MAX_QUESTIONS, (Number(it._askUsed) || 0) + 1);
        it._askPending = true;
        it._askOpen = true;
        it._askDraft = '';
        renderFeed(feedUrl);
        send({ type: 'ask_agent_item', id: it.id, feedUrl: sourceFeedUrl || feedUrl, question, researchMode });
      };

      askInputEl?.addEventListener('input', () => {
        it._askDraft = askInputEl.value || '';
      });
      askInputEl?.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        submitAsk();
      });
      askSendBtnEl?.addEventListener('click', submitAsk);

      div.querySelector('button[data-action="showBody"]')?.addEventListener('click', () => {
        it._bodyMode = 'expanded';
        renderFeed(feedUrl);
      });
      div.querySelector('button[data-action="moreBody"]')?.addEventListener('click', () => {
        it._bodyMode = 'expanded';
        renderFeed(feedUrl);
      });
      div.querySelector('button[data-action="lessBody"]')?.addEventListener('click', () => {
        it._bodyMode = 'collapsed';
        renderFeed(feedUrl);
      });
      div.querySelector('button[data-action="hideBody"]')?.addEventListener('click', () => {
        it._bodyMode = 'hidden';
        renderFeed(feedUrl);
      });

      itemsEl.appendChild(div);
    }

    const remaining = list.length - state.visible;
    if (remaining > 0) {
      const step = Math.min(5, remaining);
      toggle.style.display = 'block';
      toggle.textContent = `${t('show_more')} (+${step})`;
      toggle.onclick = () => { state.visible += step; renderFeed(feedUrl); };
    } else {
      toggle.style.display = 'none';
      toggle.onclick = null;
    }
  }

  function renderAllFeeds() {
    Object.keys(store).forEach(renderFeed);
  }

  function upsertIntoStore(feedUrl, msg) {
    const state = store[feedUrl];
    if (!state) return;

    const key = msg.id || msg.link || msg.title;
    if (!key) return;

    const publishedMs =
      typeof msg.publishedMs === 'number'
        ? msg.publishedMs
        : Date.parse(msg.published || '') || Date.now();

    if (state.seen.has(key)) {
      const existing = state.items.find(x => (x.id || x.link || x.title) === key);
      if (existing) {
        if (typeof msg.title === 'string' && msg.title) existing.title = msg.title;
        if (typeof msg.link === 'string' && msg.link) existing.link = msg.link;
        if (typeof msg.feedUrl === 'string' && msg.feedUrl) existing.feedUrl = msg.feedUrl;
        if (Number.isFinite(publishedMs)) existing.publishedMs = publishedMs;

        if (msg.isMatch != null) existing.isMatch = !!msg.isMatch;
        if (typeof msg.matchScore === 'number') existing.matchScore = msg.matchScore;

        if (typeof msg.summary === 'string') {
          existing.summary = msg.summary;
          if (msg.summary.trim()) {
            existing._summaryPending = false;
            existing._bodyMode = 'expanded';
          }
        }
        if (typeof msg.research === 'string') {
          existing.research = msg.research;
          if (msg.research.trim()) {
            existing._researchPending = false;
            existing._bodyMode = 'expanded';
          }
        }

        renderFeed(feedUrl);
      }
      return;
    }

    state.seen.add(key);

    flashKeys.set(key, Date.now());
    setTimeout(() => {
      const t = flashKeys.get(key);
      if (t && Date.now() - t >= FLASH_MS) flashKeys.delete(key);
    }, FLASH_MS + 120);

    state.items.push({
      id: msg.id,
      feedUrl: msg.feedUrl || feedUrl,
      title: msg.title,
      link: msg.link,
      publishedMs,
      isMatch: !!msg.isMatch,
      matchScore: typeof msg.matchScore === 'number' ? msg.matchScore : 0,
      summary: typeof msg.summary === 'string' ? msg.summary : '',
      research: typeof msg.research === 'string' ? msg.research : '',
      _researchPending: false,
      _summaryPending: false,
      _bodyMode: 'expanded',
      _askOpen: false,
      _askUsed: 0,
      _askPending: false,
      _askAlertSeen: false,
      _askDraft: '',
      _askMessages: [],
      _seq: ++seqCounter
    });

    if (state.items.length > 260) state.items.shift();
    state.visible = Math.max(state.visible, Math.min(10, state.items.length));
    renderFeed(feedUrl);
  }

  function handleNews(msg) {
    if (!columns[msg.feedUrl]) {
      const s = getFeedSetting(msg.feedUrl);
      const kind = s && s.kind ? s.kind : 'feed';
      ensureColumn(msg.feedUrl, msg.source || msg.feedUrl, kind, false);
      applyOrderToDom(lastServerOrder);
      applyColumnThemes();
    }

    upsertIntoStore(msg.feedUrl, msg);

    // Filtered column mirrors matched items (server signals filteredOk)
    if (columns[FILTERED_FEED_URL] && msg.isMatch && msg.filteredOk !== false) {
      upsertIntoStore(FILTERED_FEED_URL, msg);
    }

    if (shouldNotifyForMessage(msg)) {
      notify({ title: msg.source, body: msg.title, link: msg.link, isKeywordMatch: !!msg.isMatch });
    }
  }

  function updateSearchInfo() {
    if (!searchInfo) return;
    if (!searchQuery) { searchInfo.textContent = ''; return; }
    searchInfo.textContent = t('filtering_by', { q: searchInput.value.trim() });
  }

  function applySearch(q) {
    searchQuery = norm(q.trim());
    updateSearchInfo();
    Object.keys(store).forEach(feedUrl => (store[feedUrl].visible = 10));
    renderAllFeeds();
  }

  function resetAllToNewest10() {
    Object.keys(store).forEach(feedUrl => {
      store[feedUrl].visible = 10;
      renderFeed(feedUrl);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Feed helpers for menu
  function toRedditRss(input) {
    let s = String(input || '').trim();
    if (!s) return null;
    s = s.replace(/^https?:\/\/(www\.)?reddit\.com\//i, '');
    s = s.replace(/^\//, '');
    if (s.startsWith('r/')) s = s.slice(2);
    s = s.replace(/\/+$/, '');
    s = s.replace(/^\/+/, '');
    s = s.split('/')[0] || s;
    if (!s) return null;
    return { url: `https://www.reddit.com/r/${s}/.rss`, label: `r/${s}` };
  }

  function toYoutubeRss(input) {
    const raw = String(input || '').trim();
    if (!raw) return null;

    const m = raw.match(/\/channel\/(UC[a-zA-Z0-9_-]{10,})/);
    const id = m ? m[1] : (raw.startsWith('UC') ? raw : null);
    if (!id) return null;

    return { url: `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`, label: `YouTube ${id.slice(0, 10)}…` };
  }

  // Connection
  let lastServerOrder = null;

  function connect() {
    const params = new URLSearchParams(window.location.search || '');
    const fromQuery = params.get('ws');
    const fromGlobal = (window && window.__AI_NEWS_WS_URL) ? String(window.__AI_NEWS_WS_URL) : '';
    const wsUrl =
      (fromQuery && fromQuery.trim()) ||
      (fromGlobal && fromGlobal.trim()) ||
      ((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
    ws = new WebSocket(wsUrl);

    ws.onopen = () => setStatusText('connected');

    ws.onclose = () => {
      setStatusText('reconnecting');
      setTimeout(connect, 5000);
    };

    ws.onerror = () => setStatusText('socket_error');

    ws.onmessage = ev => {
      const m = JSON.parse(ev.data);

      if (m.type === 'config') {
        aiAvailable = !!m.aiAvailable;
        aiEnabledServer = !!m.aiEnabled;

        injectThemeToggle();
        applyTheme(theme);

        if (aiEnabledEl) {
          aiEnabledEl.disabled = !aiAvailable;
          aiEnabledEl.checked = !!m.aiEnabled;
        }

        if (summaryLangEl) {
          summaryLangEl.value = m.summaryLang || 'bilingual';
          summaryLangEl.disabled = !aiAvailable;
        }

        if (researchLangEl) {
          researchLangEl.value = m.researchLang || 'bg';
          researchLangEl.disabled = !aiAvailable;
        }

        feedSettings = m.feedSettings || {};
        hiddenIds = new Set(Array.isArray(m.hiddenIds) ? m.hiddenIds : []);
        setTokenUsage(Number(m.aiUsageTotalTokens || 0));
        updateAllBudgetUi();

        const keywords = Array.isArray(m.keywords) ? m.keywords : [];
        const feeds = Array.isArray(m.feeds) ? m.feeds : [];

        lastServerOrder = [
          ...(keywords.length ? [FILTERED_FEED_URL] : []),
          ...feeds.map(f => f.url).filter(Boolean)
        ];

        const desiredSet = new Set(lastServerOrder);
        Object.keys(columns).forEach(url => {
          if (!desiredSet.has(url)) removeColumnLocal(url);
        });

        if (keywords.length && !columns[FILTERED_FEED_URL]) {
          ensureColumn(FILTERED_FEED_URL, `${t('filtered_prefix')} (${keywords.join(', ')})`, 'keywords', true);
        }

        feeds.forEach(f => {
          if (!f || !f.url) return;
          ensureColumn(f.url, f.label || f.url, f.kind || 'feed', false);
        });

        applyOrderToDom(lastServerOrder);
        applyColumnThemes();
        updateAllColumnControlsUi();

        Object.keys(columns).forEach(url => updateColumnUi(url));
        renderAllFeeds();
        return;
      }

      if (m.type === 'ai_usage') {
        setTokenUsage(Number(m.totalTokens || 0));
      }

      if (m.type === 'ask_agent_reply') {
        const hits = findItemsInStore(m.feedUrl, m.id);
        if (!hits.length) return;

        const rerender = new Set();
        hits.forEach(hit => {
          const it = hit.item;
          ensureAskState(it);

          if (Number.isFinite(Number(m.used))) {
            it._askUsed = Math.max(0, Math.min(ASK_AGENT_MAX_QUESTIONS, Math.floor(Number(m.used))));
          }

          it._askPending = false;
          it._askOpen = true;

          if (typeof m.answer === 'string' && m.answer.trim()) pushAskMessage(it, 'a', m.answer);
          if (typeof m.error === 'string' && m.error.trim()) pushAskMessage(it, 'e', m.error);
          rerender.add(hit.feedUrl);
        });

        rerender.forEach(url => renderFeed(url));
        return;
      }

      if (m.type === 'news') handleNews(m);

      if (m.type === 'ok') {
        setAddFeedStatus(m.message || 'OK', 'success');
      }

      if (m.type === 'error') {
        setAddFeedStatus(m.message || 'Error', 'error');
      }
    };
  }

  // UI wiring
  loadOrder();
  applyFontPreset(lsGet(FONT_KEY) || 'system');
  applyFontSizePreset(lsGet(FONT_SIZE_KEY) || 'md');
  applyColorScheme(lsGet(SCHEME_KEY) || 'classic');
  applyButtonMode(lsGet(BTN_MODE_KEY) || 'icons');
  applyVibePreset(lsGet(VIBE_KEY) || 'default');
  applyUiLanguage(lsGet(UI_LANG_KEY) || 'en');
  if (notifyEnabledEl) notifyEnabledEl.checked = lsGet(NOTIFY_ENABLED_KEY) === '1';
  if (notifyModeEl) {
    const savedMode = lsGet(NOTIFY_MODE_KEY);
    notifyModeEl.value = (savedMode === 'all' || savedMode === 'pinned' || savedMode === 'matched' || savedMode === 'matched_pinned')
      ? savedMode
      : 'matched';
  }

  if (notifyEnabledEl) {
    notifyEnabledEl.addEventListener('change', async () => {
      lsSet(NOTIFY_ENABLED_KEY, notifyEnabledEl.checked ? '1' : '0');
      if (notifyEnabledEl.checked) {
        const ok = await ensureNotificationPermissionIfNeeded();
        if (!ok) {
          notifyEnabledEl.checked = false;
          lsSet(NOTIFY_ENABLED_KEY, '0');
        }
      }
      renderHelp();
    });
  }
  if (notifyModeEl) {
    notifyModeEl.addEventListener('change', () => {
      const mode = getNotifyMode();
      lsSet(NOTIFY_MODE_KEY, mode);
      toast(t('notifications_toast', { mode: notifyModeLabel(mode) }));
      renderHelp();
    });
  }

  if (resetBtn) resetBtn.addEventListener('click', resetAllToNewest10);
  if (deleteAgeAllBtn) {
    deleteAgeAllBtn.addEventListener('click', () => {
      const ageRange = normalizeDeleteAge(deleteAgeSelect?.value || 'week');
      const removed = removeOldItemsFromAllFeeds(ageRange);
      if (!removed) return toast(t('no_news_older_than', { age: deleteAgeLabel(ageRange) }));
      toast(t('deleted_news_older_than', { count: removed, age: deleteAgeLabel(ageRange) }));
    });
  }

  if (aiEnabledEl) {
    aiEnabledEl.addEventListener('change', () => {
      send({ type: 'toggle_ai', enabled: aiEnabledEl.checked });
    });
  }

  if (summaryLangEl) {
    summaryLangEl.addEventListener('change', () => {
      send({ type: 'set_summary_lang', lang: summaryLangEl.value });
      renderAllFeeds();
    });
  }

  if (researchLangEl) {
    researchLangEl.addEventListener('change', () => {
      send({ type: 'set_research_lang', lang: researchLangEl.value });
      toast(t('research_language_toast', { lang: researchLangEl.value.toUpperCase() }));
      renderAllFeeds();
    });
  }

  if (allBudgetSelect) {
    allBudgetSelect.addEventListener('change', () => {
      const budget = allBudgetSelect.value;
      if (budget !== 'low' && budget !== 'standard' && budget !== 'high') return;
      send({ type: 'set_all_budget', budget });
      toast(t('all_budget_toast', { budget }));
    });
  }

  if (interfaceLangEl) {
    interfaceLangEl.addEventListener('change', () => applyUiLanguage(interfaceLangEl.value));
  }

  if (fontSelect) {
    fontSelect.addEventListener('change', () => applyFontPreset(fontSelect.value));
  }
  if (fontSizeSelect) {
    fontSizeSelect.addEventListener('change', () => applyFontSizePreset(fontSizeSelect.value));
  }
  if (schemeSelect) {
    schemeSelect.addEventListener('change', () => applyColorScheme(schemeSelect.value));
  }
  if (btnModeSelect) {
    btnModeSelect.addEventListener('change', () => applyButtonMode(btnModeSelect.value));
  }
  if (vibeSelect) {
    vibeSelect.addEventListener('change', () => applyVibePreset(vibeSelect.value));
  }
  if (!useReactTopMenu && quickVibeSelect) {
    quickVibeSelect.addEventListener('change', () => applyVibePreset(quickVibeSelect.value));
  }
  if (!useReactTopMenu) {
    quickSearchBtn?.addEventListener('click', () => toggleQuickSection(searchSectionEl, searchInput));
    quickAddStreamBtn?.addEventListener('click', () => toggleQuickSection(addStreamSectionEl, feedUrlEl));
  }
  searchSectionEl?.addEventListener('toggle', () => {
    if (document.body.classList.contains('controls-collapsed') && !searchSectionEl.open) {
      searchSectionEl.classList.remove('quickSectionVisible');
      updateCollapsedQuickSectionsUi();
    }
    updateQuickSectionButtons();
  });
  addStreamSectionEl?.addEventListener('toggle', () => {
    if (document.body.classList.contains('controls-collapsed') && !addStreamSectionEl.open) {
      addStreamSectionEl.classList.remove('quickSectionVisible');
      updateCollapsedQuickSectionsUi();
    }
    updateQuickSectionButtons();
  });

  if (addFeedBtn) {
    addFeedBtn.addEventListener('click', () => {
      submitAddFeed({
        kind: String(feedTypeEl?.value || 'rss'),
        raw: String(feedUrlEl?.value || ''),
        labelInput: String(feedLabelEl?.value || ''),
        intervalSec: parseInt(String(feedIntervalEl?.value || '120'), 10) || 120
      });
    });
  }

  if (searchInput) searchInput.addEventListener('input', () => applySearch(searchInput.value));
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      applySearch('');
    });
  }

  function openHelp() {
    if (!helpOverlay) return;
    renderHelp();
    helpOverlay.style.display = 'flex';
  }

  function closeHelp() {
    if (!helpOverlay) return;
    helpOverlay.style.display = 'none';
  }

  function toggleHelp() {
    if (!helpOverlay) return;
    if (helpOverlay.style.display === 'flex') closeHelp();
    else openHelp();
  }

  // Help
  if (helpBtn) helpBtn.addEventListener('click', openHelp);
  if (helpClose) helpClose.addEventListener('click', closeHelp);
  if (helpOverlay) {
    helpOverlay.addEventListener('click', e => {
      if (e.target === helpOverlay) closeHelp();
    });
  }

  // Menu toggles
  if (!useReactTopMenu) {
    controlsToggle?.addEventListener('click', toggleControls);
    allColControlsToggle?.addEventListener('click', toggleAllColumnMenus);
    hideAllResearchBtn?.addEventListener('click', hideAllResearchBodies);
    menuToggle?.addEventListener('click', toggleMenu);
  }

  window.addEventListener('ai-news:request-top-state', emitTopUiState);
  window.addEventListener('ai-news:toggle-controls', toggleControls);
  window.addEventListener('ai-news:toggle-all-column-controls', toggleAllColumnMenus);
  window.addEventListener('ai-news:hide-all-research', hideAllResearchBodies);
  window.addEventListener('ai-news:toggle-menu', toggleMenu);
  window.addEventListener('ai-news:toggle-search', () => toggleQuickSection(searchSectionEl, searchInput));
  window.addEventListener('ai-news:toggle-add-stream', () => toggleQuickSection(addStreamSectionEl, feedUrlEl));
  window.addEventListener('ai-news:set-search-query', e => {
    const detail = (e && typeof e === 'object' && 'detail' in e) ? e.detail : null;
    const q = detail && typeof detail.query === 'string' ? detail.query : '';
    if (searchInput) searchInput.value = q;
    applySearch(q);
  });
  window.addEventListener('ai-news:clear-search', () => {
    if (searchInput) searchInput.value = '';
    applySearch('');
  });
  window.addEventListener('ai-news:add-feed', e => {
    const detail = (e && typeof e === 'object' && 'detail' in e) ? e.detail : null;
    submitAddFeed({
      kind: detail && typeof detail.kind === 'string' ? detail.kind : 'rss',
      raw: detail && typeof detail.url === 'string' ? detail.url : '',
      labelInput: detail && typeof detail.label === 'string' ? detail.label : '',
      intervalSec: detail && Number.isFinite(Number(detail.intervalSec)) ? Number(detail.intervalSec) : 120
    });
  });
  window.addEventListener('ai-news:set-vibe', e => {
    const detail = (e && typeof e === 'object' && 'detail' in e) ? e.detail : null;
    const next = detail && typeof detail.vibe === 'string' ? detail.vibe : '';
    if (!next) return;
    applyVibePreset(next);
  });

  // Close only the extended controls section when clicking outside of it.
  document.addEventListener('pointerdown', e => {
    if (document.body.classList.contains('menu-collapsed')) return;
    if (document.body.classList.contains('controls-collapsed')) return;
    const target = e.target;
    if (!topbarInnerEl || !target || !(target instanceof Node)) return;
    const controlsPanel = topbarInnerEl.querySelector('.controls');
    if (!controlsPanel) return;
    if (controlsPanel.contains(target)) return;
    if (topbarInnerEl.contains(target)) return;
    setControlsCollapsed(true);
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeHelp();
      return;
    }

    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const targetEl = e.target;
    const typing =
      targetEl &&
      (targetEl.tagName === 'INPUT' ||
        targetEl.tagName === 'TEXTAREA' ||
        (targetEl.isContentEditable === true));
    if (typing) return;

    const key = String(e.key || '');
    const lower = key.toLowerCase();

    if (key === '?') {
      e.preventDefault();
      toggleHelp();
      return;
    }
    if (key === '/') {
      e.preventDefault();
      ensureSectionVisible(searchSectionEl, searchInput);
      return;
    }
    if (lower === 'h') {
      e.preventDefault();
      toggleHelp();
      return;
    }
    if (lower === 'm') {
      e.preventDefault();
      toggleMenu();
      return;
    }
    if (lower === 'c') {
      e.preventDefault();
      toggleControls();
      return;
    }
    if (lower === 'g') {
      e.preventDefault();
      toggleAllColumnMenus();
      return;
    }
    if (lower === 's') {
      e.preventDefault();
      toggleQuickSection(searchSectionEl, searchInput);
      return;
    }
    if (lower === 'a') {
      e.preventDefault();
      toggleQuickSection(addStreamSectionEl, feedUrlEl);
      return;
    }
    if (lower === 't') {
      e.preventDefault();
      cycleTheme();
      return;
    }
    if (lower === 'v') {
      e.preventDefault();
      cycleVibe();
    }
  });

  renderHelp();
  updateQuickSectionButtons();
  connect();
})();
