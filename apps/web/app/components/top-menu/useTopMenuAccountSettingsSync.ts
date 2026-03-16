'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { sendWsMessage } from '../../store/wsClient';
import { hydrateUiSettings, setAiSettings, setKeywords, setTitleDisplayLanguage } from '../../store/slices/uiSlice';
import type { AppDispatch, RootState } from '../../store/store';
import { fetchAccountSettings, saveAccountSettings } from './topMenuAuth.services';
import { UI_PREFS_STORAGE_KEY, parsePersistedUiPrefs, type PersistedUiPrefs } from './useTopMenuUiPersistence';
import type { TopMenuAiProvider } from './topMenu.services';

type AccountLike = {
  user: { id: number } | null;
  token: string;
};

type Args = {
  dispatch: AppDispatch;
  ui: RootState['ui'];
  account: AccountLike;
};

type AccountSettingsPayload = PersistedUiPrefs & {
  summaryLang: RootState['ui']['summaryLang'];
  researchLang: RootState['ui']['researchLang'];
  allBudget: RootState['ui']['allBudget'];
  aiProvider: RootState['ui']['aiProvider'];
  summaryModel: string;
  researchModel: string;
  askModel: string;
  keywords: string[];
  insightFeatures: RootState['ui']['insightFeatures'];
  localImpactRegion: RootState['ui']['localImpactRegion'];
  trackedTopics: RootState['ui']['trackedTopics'];
  dailyBriefingDelivery: RootState['ui']['dailyBriefingDelivery'];
  dailyBriefingEmail: RootState['ui']['dailyBriefingEmail'];
  dailyBriefingFormat: RootState['ui']['dailyBriefingFormat'];
  dailyBriefingAudio: RootState['ui']['dailyBriefingAudio'];
  dailyBriefingFeedUrls: RootState['ui']['dailyBriefingFeedUrls'];
};

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return !!raw && typeof raw === 'object' && !Array.isArray(raw);
}

const LEGACY_DISABLED_INSIGHT_FEATURES: RootState['ui']['insightFeatures'] = {
  biasDetection: false,
  sensationalismDetection: false,
  factHighlights: false,
  storyImpact: false,
  dailyBriefing: false,
  topicTracking: false,
  perspectiveSimulator: false,
  emergingStoryDetector: false,
  historicalComparison: false,
  futureScenarioGenerator: false,
  localImpactDetector: false
};

function isLegacyAutoEnabledInsightFeatures(input: unknown): boolean {
  if (!isRecord(input)) return false;
  return input.biasDetection === true
    && input.sensationalismDetection === true
    && input.factHighlights === true
    && input.storyImpact === true
    && input.dailyBriefing === true
    && input.topicTracking === true
    && input.perspectiveSimulator === true
    && input.emergingStoryDetector === true
    && input.historicalComparison === false
    && input.futureScenarioGenerator === false
    && input.localImpactDetector === false;
}

function readLocalPersistedMeta(): { persistedAtMs: number; hasPrefs: boolean } {
  if (typeof window === 'undefined') return { persistedAtMs: 0, hasPrefs: false };
  const raw = window.localStorage.getItem(UI_PREFS_STORAGE_KEY);
  if (!raw) return { persistedAtMs: 0, hasPrefs: false };
  const parsed = parsePersistedUiPrefs(raw);
  const persistedAtMs = typeof parsed?.persistedAtMs === 'number' && Number.isFinite(parsed.persistedAtMs)
    ? parsed.persistedAtMs
    : 0;
  const hasPrefs = !!parsed && Object.keys(parsed).some(key => key !== 'persistedAtMs');
  return { persistedAtMs, hasPrefs };
}

export function useTopMenuAccountSettingsSync({ dispatch, ui, account }: Args) {
  const isApplyingRef = useRef(false);
  const hydratedUserIdRef = useRef<number | null>(null);
  const loadedUserIdRef = useRef<number | null>(null);
  const lastSavedJsonRef = useRef('');
  const saveTimerRef = useRef<number | null>(null);
  const [saveReadyUserId, setSaveReadyUserId] = useState<number | null>(null);

  const settingsPayload = useMemo<AccountSettingsPayload>(() => ({
    language: ui.language,
    colorMode: ui.colorMode,
    menuCollapsed: ui.menuCollapsed,
    controlsCollapsed: ui.controlsCollapsed,
    searchVisible: ui.searchVisible,
    addStreamVisible: ui.addStreamVisible,
    allColumnControlsHidden: ui.allColumnControlsHidden,
    showFilteredColumn: ui.showFilteredColumn,
    showEmergingColumn: ui.showEmergingColumn,
    hideAllResearch: ui.hideAllResearch,
    hideAllSummaries: ui.hideAllSummaries,
    notifyEnabled: ui.notifyEnabled,
    notifyMode: ui.notifyMode,
    moodFilter: ui.moodFilter,
    typeFilter: ui.typeFilter,
    titleDisplayLanguage: ui.titleDisplayLanguage,
    insightFeatures: ui.insightFeatures,
    localImpactRegion: ui.localImpactRegion,
    trackedTopics: ui.trackedTopics,
    dailyBriefingDelivery: ui.dailyBriefingDelivery,
    dailyBriefingEmail: ui.dailyBriefingEmail,
    dailyBriefingFormat: ui.dailyBriefingFormat,
    dailyBriefingAudio: ui.dailyBriefingAudio,
    dailyBriefingFeedUrls: ui.dailyBriefingFeedUrls,
    font: ui.font,
    fontSize: ui.fontSize,
    scheme: ui.scheme,
    timezone: ui.timezone,
    dateFormat: ui.dateFormat,
    performanceMode: ui.performanceMode,
    buttonMode: ui.buttonMode,
    menuHintMode: ui.menuHintMode,
    effectIntensity: ui.effectIntensity,
    soundEnabled: ui.soundEnabled,
    soundTheme: ui.soundTheme,
    vibe: ui.vibe,
    summaryLang: ui.summaryLang,
    researchLang: ui.researchLang,
    allBudget: ui.allBudget,
    aiProvider: ui.aiProvider,
    summaryModel: ui.summaryModel,
    researchModel: ui.researchModel,
    askModel: ui.askModel,
    keywords: Array.isArray(ui.keywords) ? ui.keywords : []
  }), [ui.addStreamVisible, ui.aiProvider, ui.allBudget, ui.allColumnControlsHidden, ui.askModel, ui.buttonMode, ui.colorMode, ui.controlsCollapsed, ui.dailyBriefingAudio, ui.dailyBriefingDelivery, ui.dailyBriefingEmail, ui.dailyBriefingFeedUrls, ui.dailyBriefingFormat, ui.dateFormat, ui.effectIntensity, ui.font, ui.fontSize, ui.hideAllResearch, ui.hideAllSummaries, ui.insightFeatures, ui.keywords, ui.language, ui.localImpactRegion, ui.menuCollapsed, ui.menuHintMode, ui.moodFilter, ui.notifyEnabled, ui.notifyMode, ui.performanceMode, ui.researchLang, ui.researchModel, ui.scheme, ui.searchVisible, ui.soundEnabled, ui.soundTheme, ui.summaryLang, ui.summaryModel, ui.timezone, ui.titleDisplayLanguage, ui.trackedTopics, ui.typeFilter, ui.vibe]);

  useEffect(() => {
    const userId = account.user?.id ?? null;
    const token = String(account.token || '').trim();
    if (!userId || !token) {
      hydratedUserIdRef.current = null;
      loadedUserIdRef.current = null;
      lastSavedJsonRef.current = '';
      setSaveReadyUserId(null);
      return;
    }
    if (hydratedUserIdRef.current === userId) return;

    hydratedUserIdRef.current = userId;
    loadedUserIdRef.current = null;
    setSaveReadyUserId(null);
    isApplyingRef.current = true;
    let cancelled = false;
    void (async () => {
      let loaded = false;
      const retryDelaysMs = [0, 700, 1500, 3000];
      try {
        for (const delayMs of retryDelaysMs) {
          if (cancelled) return;
          if (delayMs > 0) {
            await new Promise(resolve => window.setTimeout(resolve, delayMs));
            if (cancelled) return;
          }

          try {
            const remote = await fetchAccountSettings(token);
            if (!isRecord(remote)) continue;
            const localPersisted = readLocalPersistedMeta();
            const localPersistedAtMs = localPersisted.persistedAtMs;
            const remotePersistedAtMs = typeof remote.persistedAtMs === 'number' && Number.isFinite(remote.persistedAtMs)
              ? remote.persistedAtMs
              : 0;
            const shouldApplyRemote =
              remotePersistedAtMs > localPersistedAtMs
              || (remotePersistedAtMs === 0 && localPersistedAtMs === 0 && !localPersisted.hasPrefs);
            if (!shouldApplyRemote && (localPersistedAtMs > 0 || localPersisted.hasPrefs)) {
              loaded = true;
              break;
            }
            const uiPatch: PersistedUiPrefs = {};

            const maybeString = (k: string) => (typeof remote[k] === 'string' ? String(remote[k]) : undefined);

            const copyUiStringKeys: Array<keyof PersistedUiPrefs> = [
              'language',
              'colorMode',
              'menuCollapsed',
              'controlsCollapsed',
              'searchVisible',
              'addStreamVisible',
              'allColumnControlsHidden',
              'showFilteredColumn',
              'showEmergingColumn',
              'hideAllResearch',
              'hideAllSummaries',
              'notifyEnabled',
              'notifyMode',
              'moodFilter',
              'typeFilter',
              'titleDisplayLanguage',
              'font',
              'fontSize',
              'scheme',
              'timezone',
              'dateFormat',
              'performanceMode',
              'buttonMode',
              'menuHintMode',
              'effectIntensity',
              'soundEnabled',
              'soundTheme',
              'vibe'
            ];

            copyUiStringKeys.forEach(key => {
              const raw = remote[key as string];
              if (typeof raw === 'string' || typeof raw === 'boolean') {
                (uiPatch as Record<string, unknown>)[key] = raw;
              }
            });
            dispatch(hydrateUiSettings(uiPatch));

            const summaryLang = maybeString('summaryLang');
            if (summaryLang === 'bg' || summaryLang === 'en' || summaryLang === 'bilingual') {
              sendWsMessage({ type: 'set_summary_lang', lang: summaryLang });
              dispatch(setAiSettings({ summaryLang }));
            }

            const researchLang = maybeString('researchLang');
            if (researchLang === 'bg' || researchLang === 'en') {
              sendWsMessage({ type: 'set_research_lang', lang: researchLang });
              dispatch(setAiSettings({ researchLang }));
            }

            const allBudget = maybeString('allBudget');
            if (allBudget === 'low' || allBudget === 'standard' || allBudget === 'high' || allBudget === 'mixed') {
              dispatch(setAiSettings({ allBudget }));
              if (allBudget === 'low' || allBudget === 'standard' || allBudget === 'high') {
                sendWsMessage({ type: 'set_all_budget', budget: allBudget });
              }
            }

            const titleDisplayLanguage = maybeString('titleDisplayLanguage');
            if (titleDisplayLanguage === 'original' || titleDisplayLanguage === 'bg' || titleDisplayLanguage === 'en') {
              dispatch(setTitleDisplayLanguage(titleDisplayLanguage));
              if (titleDisplayLanguage !== 'original') {
                sendWsMessage({ type: 'run_title_translate_backfill', max: 220 });
              }
            }

            const insightFeatures = isRecord(remote.insightFeatures)
              ? (
                  isLegacyAutoEnabledInsightFeatures(remote.insightFeatures)
                    ? LEGACY_DISABLED_INSIGHT_FEATURES
                    : remote.insightFeatures as RootState['ui']['insightFeatures']
                )
              : undefined;
            const localImpactRegion = maybeString('localImpactRegion');
            const trackedTopics = Array.isArray(remote.trackedTopics)
              ? remote.trackedTopics.map(v => String(v || '').trim()).filter(Boolean).slice(0, 80)
              : undefined;
            const dailyBriefingDelivery = maybeString('dailyBriefingDelivery');
            const dailyBriefingEmail = maybeString('dailyBriefingEmail');
            const dailyBriefingFormat = maybeString('dailyBriefingFormat');
            const dailyBriefingAudio = typeof remote.dailyBriefingAudio === 'boolean' ? remote.dailyBriefingAudio : undefined;
            const dailyBriefingFeedUrls = Array.isArray(remote.dailyBriefingFeedUrls)
              ? remote.dailyBriefingFeedUrls.map(v => String(v || '').trim()).filter(Boolean).slice(0, 80)
              : undefined;

            dispatch(hydrateUiSettings({
              ...(insightFeatures ? { insightFeatures } : {}),
              ...(typeof localImpactRegion === 'string' ? { localImpactRegion } : {}),
              ...(trackedTopics ? { trackedTopics } : {}),
              ...(dailyBriefingDelivery === 'site' || dailyBriefingDelivery === 'email' ? { dailyBriefingDelivery } : {}),
              ...(typeof dailyBriefingEmail === 'string' ? { dailyBriefingEmail } : {}),
              ...(dailyBriefingFormat === 'executive' || dailyBriefingFormat === 'bullets' || dailyBriefingFormat === 'narrative' ? { dailyBriefingFormat } : {}),
              ...(typeof dailyBriefingAudio === 'boolean' ? { dailyBriefingAudio } : {}),
              ...(dailyBriefingFeedUrls ? { dailyBriefingFeedUrls } : {})
            }));
            if (insightFeatures || localImpactRegion || trackedTopics) {
              sendWsMessage({
                type: 'set_ai_features',
                ...(insightFeatures ? { features: insightFeatures } : {}),
                ...(typeof localImpactRegion === 'string' ? { localRegion: localImpactRegion } : {}),
                ...(trackedTopics ? { trackedTopics } : {})
              });
            }

            const aiProvider = maybeString('aiProvider');
            if (aiProvider === 'openai' || aiProvider === 'claude' || aiProvider === 'openrouter') {
              sendWsMessage({ type: 'set_ai_provider', provider: aiProvider as TopMenuAiProvider, authToken: token });
              dispatch(setAiSettings({ aiProvider: aiProvider as TopMenuAiProvider }));
            }

            const summaryModel = maybeString('summaryModel');
            const researchModel = maybeString('researchModel');
            const askModel = maybeString('askModel');
            if (summaryModel || researchModel || askModel) {
              sendWsMessage({
                type: 'set_ai_models',
                ...(summaryModel ? { summaryModel } : {}),
                ...(researchModel ? { researchModel } : {}),
                ...(askModel ? { askModel } : {})
              });
              dispatch(setAiSettings({
                ...(summaryModel ? { summaryModel } : {}),
                ...(researchModel ? { researchModel } : {}),
                ...(askModel ? { askModel } : {})
              }));
            }

            if (Array.isArray(remote.keywords)) {
              const keywords = remote.keywords
                .map(v => String(v || '').trim())
                .filter(Boolean)
                .slice(0, 120);
              sendWsMessage({ type: 'set_keywords', keywords });
              dispatch(setKeywords(keywords));
            }

            loaded = true;
            break;
          } catch {
            // retry below
          }
        }
      } catch {
        // keep UI usable
      } finally {
        if (!loaded) hydratedUserIdRef.current = null;
        isApplyingRef.current = false;
        loadedUserIdRef.current = loaded ? userId : null;
        setSaveReadyUserId(loaded ? userId : null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [account.token, account.user?.id, dispatch]);

  useEffect(() => {
    const userId = account.user?.id ?? null;
    const token = String(account.token || '').trim();
    if (!userId || !token) return;
    if (saveReadyUserId !== userId) return;
    if (isApplyingRef.current) return;

    const payloadJson = JSON.stringify(settingsPayload);
    if (payloadJson === lastSavedJsonRef.current) return;

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void saveAccountSettings(token, {
        ...settingsPayload,
        persistedAtMs: Date.now()
      })
        .then(() => {
          lastSavedJsonRef.current = payloadJson;
        })
        .catch(() => {});
    }, 750);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [account.token, account.user?.id, saveReadyUserId, settingsPayload]);
}
