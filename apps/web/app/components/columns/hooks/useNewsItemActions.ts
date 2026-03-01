'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppDispatch } from '../../../store/store';
import {
  clearResearchForItem,
  clearResearchPending,
  clearSummaryForItem,
  clearSummaryPending,
  enqueueAskQuestion,
  hideItemLocally,
  receiveAskReply,
  setResearchPending,
  setSummaryPending
} from '../../../store/slices/newsSlice';
import { sendWsMessage } from '../../../store/wsClient';
import type { NewsItem } from '../../../store/types';
import { COLUMN_LAYOUT_TOKENS } from '../designTokens';

type AskStateMap = Record<string, { used: number; remaining: number; draft: string; pending: boolean }>;

type UseNewsItemActionsArgs = {
  dispatch: AppDispatch;
  connected: boolean;
  askByItem: AskStateMap;
  labels: Record<string, string>;
};

function askKey(it: NewsItem): string {
  return `${it.feedUrl}::${it.id}`;
}

export function useNewsItemActions({
  dispatch,
  connected,
  askByItem,
  labels
}: UseNewsItemActionsArgs) {
  const summaryTimeoutsRef = useRef<Record<string, number>>({});
  const researchTimeoutsRef = useRef<Record<string, number>>({});
  const [clipboardNoticeOpen, setClipboardNoticeOpen] = useState(false);
  const [clipboardNotice, setClipboardNotice] = useState('');

  useEffect(() => {
    return () => {
      Object.values(summaryTimeoutsRef.current).forEach(id => window.clearTimeout(id));
      Object.values(researchTimeoutsRef.current).forEach(id => window.clearTimeout(id));
      summaryTimeoutsRef.current = {};
      researchTimeoutsRef.current = {};
    };
  }, []);

  const requestSummary = useCallback((it: NewsItem) => {
    if (!connected) return;
    dispatch(setSummaryPending(it.id));
    dispatch(clearSummaryForItem({ id: it.id, feedUrl: it.feedUrl }));

    if (summaryTimeoutsRef.current[it.id]) {
      window.clearTimeout(summaryTimeoutsRef.current[it.id]);
    }
    summaryTimeoutsRef.current[it.id] = window.setTimeout(() => {
      dispatch(clearSummaryPending(it.id));
      delete summaryTimeoutsRef.current[it.id];
    }, COLUMN_LAYOUT_TOKENS.summaryPendingTimeoutMs);

    const ok = sendWsMessage({
      type: 'run_summary_item',
      id: it.id,
      feedUrl: it.feedUrl
    });
    if (!ok) dispatch(clearSummaryPending(it.id));
  }, [connected, dispatch]);

  const requestResearch = useCallback((it: NewsItem) => {
    if (!connected) return;
    dispatch(setResearchPending(it.id));
    dispatch(clearResearchForItem({ id: it.id, feedUrl: it.feedUrl }));

    if (researchTimeoutsRef.current[it.id]) {
      window.clearTimeout(researchTimeoutsRef.current[it.id]);
    }
    researchTimeoutsRef.current[it.id] = window.setTimeout(() => {
      dispatch(clearResearchPending(it.id));
      delete researchTimeoutsRef.current[it.id];
    }, COLUMN_LAYOUT_TOKENS.researchPendingTimeoutMs);

    const ok = sendWsMessage({
      type: 'run_research_item',
      id: it.id,
      feedUrl: it.feedUrl
    });
    if (!ok) dispatch(clearResearchPending(it.id));
  }, [connected, dispatch]);

  const hideItem = useCallback((it: NewsItem) => {
    const ok = sendWsMessage({ type: 'hide_item', id: it.id });
    if (ok) dispatch(hideItemLocally(it.id));
  }, [dispatch]);

  const copyLink = useCallback(async (url: string) => {
    const value = String(url || '').trim();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setClipboardNotice(labels.linkCopied);
      setClipboardNoticeOpen(true);
    } catch {
      window.open(value, '_blank', 'noopener,noreferrer');
    }
  }, [labels.linkCopied]);

  const copyNewsPayload = useCallback(async (it: NewsItem) => {
    const title = String(it.title || '').trim();
    const summary = String(it.summary || '').trim();
    const research = String(it.research || '').trim();
    const link = String(it.link || '').trim();
    if (!title && !summary && !research && !link) return;

    const chunks: string[] = [];
    if (title) chunks.push(`${labels.copiedTitle}: ${title}`);
    if (summary) chunks.push(`${labels.copiedSummary}: ${summary}`);
    if (research) chunks.push(`${labels.copiedResearch}: ${research}`);
    if (link) chunks.push(`${labels.copiedLink}: ${link}`);
    const payload = chunks.join('\n\n');

    try {
      await navigator.clipboard.writeText(payload);
      setClipboardNotice(labels.newsCopied);
      setClipboardNoticeOpen(true);
    } catch {
      if (link) window.open(link, '_blank', 'noopener,noreferrer');
    }
  }, [labels.copiedLink, labels.copiedResearch, labels.copiedSummary, labels.copiedTitle, labels.newsCopied]);

  const requestAsk = useCallback((it: NewsItem) => {
    if (!connected) return;
    const k = askKey(it);
    const askState = askByItem[k] || { used: 0, remaining: 5, draft: '', pending: false };
    const question = String(askState.draft || '').trim().slice(0, COLUMN_LAYOUT_TOKENS.askQuestionMaxLength);
    if (!question || askState.pending || askState.remaining <= 0) return;

    const usedBefore = askState.used;
    const remainingBefore = askState.remaining;
    dispatch(enqueueAskQuestion({ id: it.id, feedUrl: it.feedUrl, question }));

    const ok = sendWsMessage({
      type: 'ask_agent_item',
      id: it.id,
      feedUrl: it.feedUrl,
      question,
      researchMode: 'auto'
    });
    if (!ok) {
      dispatch(receiveAskReply({
        id: it.id,
        feedUrl: it.feedUrl,
        question,
        error: 'Socket unavailable. Try again.',
        used: usedBefore,
        remaining: remainingBefore
      }));
    }
  }, [askByItem, connected, dispatch]);

  return {
    requestSummary,
    requestResearch,
    hideItem,
    copyLink,
    copyNewsPayload,
    requestAsk,
    clipboardNoticeOpen,
    clipboardNotice,
    setClipboardNoticeOpen
  };
}

