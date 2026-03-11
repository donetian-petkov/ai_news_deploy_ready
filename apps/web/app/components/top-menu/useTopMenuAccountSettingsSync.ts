'use client';

import { useEffect, useMemo, useRef } from 'react';
import { sendWsMessage } from '../../store/wsClient';
import { hydrateUiSettings, setAiSettings, setKeywords, setTitleDisplayLanguage } from '../../store/slices/uiSlice';
import type { AppDispatch, RootState } from '../../store/store';
import { fetchAccountSettings, saveAccountSettings } from './topMenuAuth.services';
import type { PersistedUiPrefs } from './useTopMenuUiPersistence';
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
};

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return !!raw && typeof raw === 'object' && !Array.isArray(raw);
}

export function useTopMenuAccountSettingsSync({ dispatch, ui, account }: Args) {
  const isApplyingRef = useRef(false);
  const hydratedUserIdRef = useRef<number | null>(null);
  const loadedUserIdRef = useRef<number | null>(null);
  const lastSavedJsonRef = useRef('');
  const saveTimerRef = useRef<number | null>(null);

  const settingsPayload = useMemo<AccountSettingsPayload>(() => ({
    language: ui.language,
    colorMode: ui.colorMode,
    menuCollapsed: ui.menuCollapsed,
    controlsCollapsed: ui.controlsCollapsed,
    searchVisible: ui.searchVisible,
    addStreamVisible: ui.addStreamVisible,
    allColumnControlsHidden: ui.allColumnControlsHidden,
    hideAllResearch: ui.hideAllResearch,
    hideAllSummaries: ui.hideAllSummaries,
    notifyEnabled: ui.notifyEnabled,
    notifyMode: ui.notifyMode,
    moodFilter: ui.moodFilter,
    typeFilter: ui.typeFilter,
    titleDisplayLanguage: ui.titleDisplayLanguage,
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
  }), [ui.addStreamVisible, ui.aiProvider, ui.allBudget, ui.allColumnControlsHidden, ui.askModel, ui.buttonMode, ui.colorMode, ui.controlsCollapsed, ui.dateFormat, ui.effectIntensity, ui.font, ui.fontSize, ui.hideAllResearch, ui.hideAllSummaries, ui.keywords, ui.language, ui.menuCollapsed, ui.menuHintMode, ui.moodFilter, ui.notifyEnabled, ui.notifyMode, ui.performanceMode, ui.researchLang, ui.researchModel, ui.scheme, ui.searchVisible, ui.soundEnabled, ui.soundTheme, ui.summaryLang, ui.summaryModel, ui.timezone, ui.titleDisplayLanguage, ui.typeFilter, ui.vibe]);

  useEffect(() => {
    const userId = account.user?.id ?? null;
    const token = String(account.token || '').trim();
    if (!userId || !token) {
      hydratedUserIdRef.current = null;
      loadedUserIdRef.current = null;
      lastSavedJsonRef.current = '';
      return;
    }
    if (hydratedUserIdRef.current === userId) return;

    hydratedUserIdRef.current = userId;
    loadedUserIdRef.current = null;
    isApplyingRef.current = true;
    void (async () => {
      try {
        const remote = await fetchAccountSettings(token);
        if (!isRecord(remote)) return;
        const uiPatch: PersistedUiPrefs = {};

        const maybeString = (k: string) => (typeof remote[k] === 'string' ? String(remote[k]) : undefined);
        const maybeBool = (k: string) => (typeof remote[k] === 'boolean' ? Boolean(remote[k]) : undefined);

        const copyUiStringKeys: Array<keyof PersistedUiPrefs> = [
          'language',
          'colorMode',
          'menuCollapsed',
          'controlsCollapsed',
          'searchVisible',
          'addStreamVisible',
          'allColumnControlsHidden',
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
            sendWsMessage({ type: 'run_title_translate_backfill', max: 700 });
          }
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
      } catch {
        // Keep UI usable even when account settings storage is not initialized yet.
      } finally {
        isApplyingRef.current = false;
        loadedUserIdRef.current = userId;
      }
    })();
  }, [account.token, account.user?.id, dispatch]);

  useEffect(() => {
    const userId = account.user?.id ?? null;
    const token = String(account.token || '').trim();
    if (!userId || !token) return;
    if (loadedUserIdRef.current !== userId) return;
    if (isApplyingRef.current) return;

    const payloadJson = JSON.stringify(settingsPayload);
    if (payloadJson === lastSavedJsonRef.current) return;

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void saveAccountSettings(token, settingsPayload)
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
  }, [account.token, account.user?.id, settingsPayload]);
}
