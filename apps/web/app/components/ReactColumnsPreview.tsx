'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import AnimationIcon from '@mui/icons-material/Animation';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import BoltIcon from '@mui/icons-material/Bolt';
import ChatIcon from '@mui/icons-material/Chat';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import LinkIcon from '@mui/icons-material/Link';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import MicIcon from '@mui/icons-material/Mic';
import MovieIcon from '@mui/icons-material/Movie';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import RedditIcon from '@mui/icons-material/Reddit';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import ScienceIcon from '@mui/icons-material/Science';
import SendIcon from '@mui/icons-material/Send';
import ShieldMoonIcon from '@mui/icons-material/ShieldMoon';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import TuneIcon from '@mui/icons-material/Tune';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import WizardHatIcon from '@mui/icons-material/AutoAwesome';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Link as MuiLink,
  MenuItem,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  removeFeedLocally,
  hydrateFeedUiState,
  reorderFeeds,
  setAllFeedControlsOpen,
  setFeedBudgetSetting,
  setFeedColumnSettings,
  setFeedDeleteAge,
  setFeedIntervalSetting,
  setFeedResearchSetting,
  setFeedSummarySetting,
  toggleFeedControls,
  togglePinned
} from '../store/slices/feedsSlice';
import {
  clearResearchForItem,
  clearResearchPending,
  enqueueAskQuestion,
  hideItemLocally,
  removeOldItemsInFeed,
  receiveAskReply,
  clearSummaryForItem,
  clearSummaryPending,
  setAskDraft,
  toggleAskOpen,
  togglePinnedNews,
  setResearchPending,
  setSummaryPending
} from '../store/slices/newsSlice';
import { sendWsMessage, startWsConnection, stopWsConnection } from '../store/wsClient';
import type { BudgetMode, FeedInfo, NewsItem, SortMode } from '../store/types';
import { FILTERED_FEED_URL } from '../store/constants';

type Props = {
  wsUrl: string;
};

type BodyMode = 'collapsed' | 'expanded' | 'hidden';
type VibeValue = 'default' | 'anime' | 'arcade' | 'cinema' | 'newspaper' | 'cyberwitch' | 'fantasy' | 'scifi';
type SchemeValue = 'classic' | 'vivid' | 'sunset' | 'neon' | 'ocean' | 'forest';
type FeedFilterPreset =
  | 'all'
  | 'matches'
  | 'researched'
  | 'summaries'
  | 'matches_researched'
  | 'matches_summaries'
  | 'researched_summaries'
  | 'all_flags';

const VIBE_LIST: VibeValue[] = ['default', 'anime', 'arcade', 'cinema', 'newspaper', 'cyberwitch', 'fantasy', 'scifi'];
const SCHEME_LIST: SchemeValue[] = ['classic', 'vivid', 'sunset', 'neon', 'ocean', 'forest'];

type Rgb = { r: number; g: number; b: number };
type Hsl = { h: number; s: number; l: number };
type ColumnPalette = { a: string; b: string; m: string; aSoft: string; bSoft: string; mSoft: string };

const VIBE_BASE_COLORS: Record<VibeValue, [string, string, string]> = {
  default: ['#3d95ff', '#20cb7d', '#ffac1a'],
  anime: ['#ff63bc', '#5fd5ff', '#ffd764'],
  arcade: ['#57ff3b', '#ff4de6', '#00d8ff'],
  cinema: ['#f6b35e', '#cf5a76', '#ffdba2'],
  newspaper: ['#8f9eab', '#627a92', '#d9b770'],
  cyberwitch: ['#cc66ff', '#00e5ff', '#ff86d4'],
  fantasy: ['#4fd08e', '#9b784e', '#ffd06f'],
  scifi: ['#25d8ff', '#7f8cff', '#7affd8']
};

const SCHEME_TUNING: Record<SchemeValue, { hueShift: number; satMul: number; lightMul: number; softAlpha: number }> = {
  classic: { hueShift: 0, satMul: 1.0, lightMul: 1.0, softAlpha: 0.26 },
  vivid: { hueShift: 10, satMul: 1.16, lightMul: 1.02, softAlpha: 0.30 },
  sunset: { hueShift: -22, satMul: 1.08, lightMul: 0.96, softAlpha: 0.29 },
  neon: { hueShift: 32, satMul: 1.28, lightMul: 1.04, softAlpha: 0.27 },
  ocean: { hueShift: -52, satMul: 1.03, lightMul: 0.94, softAlpha: 0.30 },
  forest: { hueShift: -105, satMul: 0.82, lightMul: 0.86, softAlpha: 0.28 }
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function hexToRgb(hex: string): Rgb {
  const clean = String(hex || '').trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return { r: 61, g: 149, b: 255 };
  const n = Number.parseInt(clean, 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255
  };
}

function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hh < 1) { r1 = c; g1 = x; b1 = 0; }
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

function transformHex(hex: string, tuning: { hueShift: number; satMul: number; lightMul: number }): Rgb {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const h = ((hsl.h + tuning.hueShift) % 360 + 360) % 360;
  const s = clamp(hsl.s * tuning.satMul, 0.12, 1);
  const l = clamp(hsl.l * tuning.lightMul, 0.10, 0.86);
  return hslToRgb(h, s, l);
}

function rgba(rgb: Rgb, alpha = 1): string {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function buildColumnPalette(vibe: VibeValue, scheme: SchemeValue): ColumnPalette {
  const base = VIBE_BASE_COLORS[vibe] || VIBE_BASE_COLORS.default;
  const tuning = SCHEME_TUNING[scheme] || SCHEME_TUNING.classic;
  const a = transformHex(base[0], tuning);
  const b = transformHex(base[1], tuning);
  const m = transformHex(base[2], tuning);
  return {
    a: rgba(a, 1),
    b: rgba(b, 1),
    m: rgba(m, 1),
    aSoft: rgba(a, tuning.softAlpha),
    bSoft: rgba(b, Math.max(0.16, tuning.softAlpha - 0.03)),
    mSoft: rgba(m, Math.min(0.36, tuning.softAlpha + 0.03))
  };
}

function getFeedFilterPreset(filters: FeedInfo['filters']): FeedFilterPreset {
  const m = !!filters.onlyMatches;
  const r = !!filters.onlyResearched;
  const s = !!filters.onlySummaries;
  if (!m && !r && !s) return 'all';
  if (m && !r && !s) return 'matches';
  if (!m && r && !s) return 'researched';
  if (!m && !r && s) return 'summaries';
  if (m && r && !s) return 'matches_researched';
  if (m && !r && s) return 'matches_summaries';
  if (!m && r && s) return 'researched_summaries';
  return 'all_flags';
}

function presetToFeedFilters(preset: FeedFilterPreset): FeedInfo['filters'] {
  if (preset === 'matches') return { onlyMatches: true, onlyResearched: false, onlySummaries: false };
  if (preset === 'researched') return { onlyMatches: false, onlyResearched: true, onlySummaries: false };
  if (preset === 'summaries') return { onlyMatches: false, onlyResearched: false, onlySummaries: true };
  if (preset === 'matches_researched') return { onlyMatches: true, onlyResearched: true, onlySummaries: false };
  if (preset === 'matches_summaries') return { onlyMatches: true, onlyResearched: false, onlySummaries: true };
  if (preset === 'researched_summaries') return { onlyMatches: false, onlyResearched: true, onlySummaries: true };
  if (preset === 'all_flags') return { onlyMatches: true, onlyResearched: true, onlySummaries: true };
  return { onlyMatches: false, onlyResearched: false, onlySummaries: false };
}

function getVibeIcons(vibe: VibeValue): {
  summary: React.ElementType;
  research: React.ElementType;
  ask: React.ElementType;
  share: React.ElementType;
  hide: React.ElementType;
  copy: React.ElementType;
} {
  if (vibe === 'anime') {
    return { summary: AnimationIcon, research: WizardHatIcon, ask: TheaterComedyIcon, share: SendIcon, hide: PersonOffIcon, copy: MicIcon };
  }
  if (vibe === 'arcade') {
    return { summary: SportsEsportsIcon, research: BoltIcon, ask: SmartToyIcon, share: RocketLaunchIcon, hide: VisibilityOffIcon, copy: FactCheckIcon };
  }
  if (vibe === 'cinema') {
    return { summary: MovieIcon, research: MicIcon, ask: TheaterComedyIcon, share: OpenInNewIcon, hide: VisibilityOffIcon, copy: LocalLibraryIcon };
  }
  if (vibe === 'newspaper') {
    return { summary: NewspaperIcon, research: FactCheckIcon, ask: HistoryEduIcon, share: LinkIcon, hide: VisibilityOffIcon, copy: AutoStoriesIcon };
  }
  if (vibe === 'cyberwitch') {
    return { summary: WizardHatIcon, research: ScienceIcon, ask: SupportAgentIcon, share: RocketLaunchIcon, hide: ShieldMoonIcon, copy: AnimationIcon };
  }
  if (vibe === 'fantasy') {
    return { summary: LocalLibraryIcon, research: WizardHatIcon, ask: HelpOutlineIcon, share: LinkIcon, hide: ShieldMoonIcon, copy: HistoryEduIcon };
  }
  if (vibe === 'scifi') {
    return { summary: SmartToyIcon, research: PrecisionManufacturingIcon, ask: ChatIcon, share: RocketLaunchIcon, hide: VisibilityOffIcon, copy: ScienceIcon };
  }
  return { summary: AutoStoriesIcon, research: ManageSearchIcon, ask: ChatIcon, share: OpenInNewIcon, hide: VisibilityOffIcon, copy: ContentCopyIcon };
}

function formatTime(ms: number): string {
  if (!Number.isFinite(ms)) return '';
  try {
    return new Date(ms).toLocaleString('bg-BG', { hour12: false });
  } catch {
    return '';
  }
}

function extractConfidence(research: string): string {
  const m = String(research || '').match(/confidence\s*:\s*(low|medium|high)/i);
  if (!m) return '';
  const level = String(m[1] || '').toLowerCase();
  if (level === 'high') return 'High';
  if (level === 'medium') return 'Medium';
  if (level === 'low') return 'Low';
  return '';
}

function compactResearch(research: string): string {
  const normalized = String(research || '').replace(/\s+/g, ' ').trim();
  return normalized.length > 340 ? `${normalized.slice(0, 340)}...` : normalized;
}

function collapseText(text: string, maxChars: number): string {
  const normalized = String(text || '').trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars)}...`;
}

function cutoffFromAge(age: 'yesterday' | 'week' | 'month' | 'year'): number {
  const now = Date.now();
  if (age === 'yesterday') return now - 24 * 60 * 60 * 1000;
  if (age === 'month') return now - 30 * 24 * 60 * 60 * 1000;
  if (age === 'year') return now - 365 * 24 * 60 * 60 * 1000;
  return now - 7 * 24 * 60 * 60 * 1000;
}

type AskCardState = {
  open: boolean;
  draft: string;
  pending: boolean;
  remaining: number;
  messages: Array<{ q: string; a?: string; error?: string }>;
};

type CardLabels = {
  pinNews: string;
  unpinNews: string;
  match: string;
  shareLink: string;
  copyNews: string;
  hideNews: string;
  generatingSummary: string;
  summary: string;
  researching: string;
  research: string;
  askAgent: string;
  showSummary: string;
  hideSummary: string;
  showMore: string;
  showLess: string;
  autoResearching: string;
  confidence: string;
  showResearch: string;
  hideResearch: string;
  questionsLeft: string;
  askPlaceholder: string;
  thinking: string;
  send: string;
};

type VibeIcons = {
  summary: React.ElementType;
  research: React.ElementType;
  ask: React.ElementType;
  share: React.ElementType;
  hide: React.ElementType;
  copy: React.ElementType;
};

type NewsCardProps = {
  item: NewsItem;
  askState: AskCardState;
  labels: CardLabels;
  vibeIcons: VibeIcons;
  compactBtnSx: Record<string, unknown>;
  buttonMode: 'icons' | 'text';
  performanceMode: boolean;
  fontScale: number;
  connected: boolean;
  hideAllResearch: boolean;
  hideAllSummaries: boolean;
  summaryPending: boolean;
  researchPending: boolean;
  isPinnedNews: boolean;
  accent: string;
  soft: string;
  matchAccent: string;
  showAutoResearching: boolean;
  summaryMode: BodyMode;
  summaryLong: boolean;
  summaryText: string;
  researchMode: BodyMode;
  researchLong: boolean;
  researchText: string;
  researchConfidence: string;
  onTogglePinnedNews: (id: string) => void;
  onCopyLink: (url: string) => void;
  onCopyNews: (it: NewsItem) => void;
  onHideItem: (it: NewsItem) => void;
  onRequestSummary: (it: NewsItem) => void;
  onRequestResearch: (it: NewsItem) => void;
  onToggleAsk: (id: string, feedUrl: string) => void;
  onSetSummaryMode: (mode: BodyMode) => void;
  onSetResearchMode: (mode: BodyMode) => void;
  onAskDraft: (id: string, feedUrl: string, draft: string) => void;
  onAskSubmit: (it: NewsItem) => void;
};

const NewsCard = memo(function NewsCard({
  item,
  askState,
  labels,
  vibeIcons,
  compactBtnSx,
  buttonMode,
  performanceMode,
  fontScale,
  connected,
  hideAllResearch,
  hideAllSummaries,
  summaryPending,
  researchPending,
  isPinnedNews,
  accent,
  soft,
  matchAccent,
  showAutoResearching,
  summaryMode,
  summaryLong,
  summaryText,
  researchMode,
  researchLong,
  researchText,
  researchConfidence,
  onTogglePinnedNews,
  onCopyLink,
  onCopyNews,
  onHideItem,
  onRequestSummary,
  onRequestResearch,
  onToggleAsk,
  onSetSummaryMode,
  onSetResearchMode,
  onAskDraft,
  onAskSubmit
}: NewsCardProps) {
  const summaryVisible = !hideAllSummaries && summaryMode !== 'hidden';
  const researchVisible = researchMode !== 'hidden';
  const hasSummaryBlock = !!item.summary && !hideAllSummaries;
  const hasResearchBlock = !!item.research && !hideAllResearch;
  const hasBodyBlock = hasSummaryBlock || hasResearchBlock;
  const SummaryIconComp = vibeIcons.summary;
  const ResearchIconComp = vibeIcons.research;
  const AskIconComp = vibeIcons.ask;
  const ShareIconComp = vibeIcons.share;
  const HideIconComp = vibeIcons.hide;
  const CopyIconComp = vibeIcons.copy;
  const iconOnly = buttonMode === 'icons';
  const actionSx = {
    ...compactBtnSx,
    minWidth: iconOnly ? 36 : 86,
    px: iconOnly ? 0.85 : 1.2,
    borderRadius: performanceMode ? 1.2 : 999,
    color: accent,
    borderColor: accent,
    '&:hover': {
      borderColor: accent,
      backgroundColor: soft
    },
    '&.MuiButton-contained': {
      color: 'rgba(230, 239, 255, 0.98)',
      border: `1px solid ${accent}`,
      backgroundColor: soft
    }
  };
  const matchActionSx = {
    ...actionSx,
    color: matchAccent,
    borderColor: matchAccent,
    '&:hover': {
      borderColor: matchAccent,
      backgroundColor: 'rgba(255, 168, 42, 0.16)'
    },
    '&.MuiButton-contained': {
      color: 'rgba(255, 226, 179, 0.98)',
      border: `1px solid ${matchAccent}`,
      backgroundColor: 'rgba(255, 168, 42, 0.2)'
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        background: performanceMode
          ? 'rgba(8, 14, 29, 0.98)'
          : `linear-gradient(155deg, rgba(5, 12, 25, 0.92), rgba(7, 14, 28, 0.86)), radial-gradient(550px 180px at 0% 0%, ${soft}, transparent 72%), var(--news-card-overlay)`,
        borderColor: item.isMatch ? matchAccent : `${accent}88`,
        color: 'rgba(234, 242, 255, 0.96)',
        contentVisibility: 'auto',
        containIntrinsicSize: '360px',
        borderRadius: 'var(--news-card-radius, 14px)',
        boxShadow: performanceMode ? 'none' : '0 10px 20px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.03)'
      }}
    >
      <CardContent sx={{ pb: '12px !important' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.9 }}>
          <Typography variant="caption" sx={{ color: 'rgba(210,219,235,0.74)' }}>
            {formatTime(item.publishedMs)}
          </Typography>
          <Stack direction="row" spacing={0.6} alignItems="center">
            <Tooltip title={isPinnedNews ? labels.unpinNews : labels.pinNews}>
              <Button
                size="small"
                variant={isPinnedNews ? 'contained' : 'outlined'}
                sx={{ ...actionSx, minWidth: 36, px: iconOnly ? 0.8 : 1.05 }}
                onClick={() => onTogglePinnedNews(item.id)}
              >
                <PushPinIcon sx={{ fontSize: 15 }} aria-hidden />
              </Button>
            </Tooltip>
            {item.isMatch ? <Chip size="small" label={labels.match} variant="outlined" sx={{ color: matchAccent, borderColor: matchAccent, fontWeight: 800 }} /> : null}
            <Tooltip title={labels.shareLink}>
              <Button
                size="small"
                variant="outlined"
                sx={actionSx}
                onClick={() => onCopyLink(item.link)}
              >
                {iconOnly ? <ShareIconComp sx={{ fontSize: 15 }} aria-hidden /> : labels.shareLink}
              </Button>
            </Tooltip>
            <Tooltip title={labels.copyNews}>
              <Button
                size="small"
                variant="outlined"
                sx={actionSx}
                onClick={() => onCopyNews(item)}
              >
                {iconOnly ? <CopyIconComp sx={{ fontSize: 15 }} aria-hidden /> : labels.copyNews}
              </Button>
            </Tooltip>
            <Tooltip title={labels.hideNews}>
              <Button
                size="small"
                variant="outlined"
                sx={matchActionSx}
                onClick={() => onHideItem(item)}
                disabled={!connected}
              >
                {iconOnly ? <HideIconComp sx={{ fontSize: 15 }} aria-hidden /> : labels.hideNews}
              </Button>
            </Tooltip>
          </Stack>
        </Stack>

        <MuiLink
          href={item.link}
          target="_blank"
          rel="noreferrer"
          underline="hover"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.6,
            fontSize: `${1.12 * fontScale}rem`,
            lineHeight: 1.36,
            fontWeight: 800,
            color: 'primary.light',
            mb: 1.1,
            fontFamily: 'var(--news-title-font-family, var(--font-family))'
          }}
        >
          <span>{item.title}</span>
          <OpenInNewIcon sx={{ fontSize: 14 }} />
        </MuiLink>

        {hasBodyBlock ? <Box sx={{ borderTop: performanceMode ? '1px solid rgba(128, 154, 201, 0.22)' : '1px solid rgba(128, 154, 201, 0.34)', mb: 1.1 }} /> : null}

        {hasSummaryBlock ? (
          <Box>
            {summaryVisible ? (
              <Typography
                variant="body2"
                sx={{
                  fontSize: `${0.96 * fontScale}rem`,
                  lineHeight: 1.52,
                  color: 'rgba(226,234,250,0.96)',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'var(--news-body-font-family, var(--font-family))'
                }}
              >
                {summaryText}
              </Typography>
            ) : null}
            {summaryVisible && summaryLong ? (
              <Button
                size="small"
                variant="text"
                onClick={() => onSetSummaryMode(summaryMode === 'collapsed' ? 'expanded' : 'collapsed')}
                sx={{ mt: 0.35, color: accent, textTransform: 'none', fontWeight: 700 }}
              >
                {summaryMode === 'collapsed' ? labels.showMore : labels.showLess}
              </Button>
            ) : null}
          </Box>
        ) : null}
        {showAutoResearching ? (
          <Chip
            size="small"
            label={labels.autoResearching}
            icon={<CircularProgress size={11} color="inherit" />}
            variant="outlined"
            sx={{ mb: 0.9, color: 'rgba(152, 228, 255, 0.96)', borderColor: 'rgba(73,167,255,0.55)' }}
          />
        ) : null}
        {hasResearchBlock ? (
          <Box sx={{ mt: 1 }}>
            {researchVisible ? (
              <>
                {researchConfidence ? (
                  <Typography variant="caption" sx={{ color: 'rgba(212,220,236,0.75)', display: 'block', mb: 0.35 }}>
                    {labels.confidence}: {researchConfidence}
                  </Typography>
                ) : null}
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: `${0.98 * fontScale}rem`,
                    lineHeight: 1.52,
                    color: 'rgba(205,218,238,0.93)',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'var(--news-body-font-family, var(--font-family))'
                  }}
                >
                  {researchText}
                </Typography>
              </>
            ) : null}
            {researchVisible && researchLong ? (
              <Button
                size="small"
                variant="text"
                onClick={() => onSetResearchMode(researchMode === 'collapsed' ? 'expanded' : 'collapsed')}
                sx={{ mt: 0.35, color: accent, textTransform: 'none', fontWeight: 700 }}
              >
                {researchMode === 'collapsed' ? labels.showMore : labels.showLess}
              </Button>
            ) : null}
          </Box>
        ) : null}
        <Stack
          direction="row"
          spacing={0.8}
          sx={hasBodyBlock
            ? { mt: 1.2, pt: 0.95, borderTop: performanceMode ? '1px solid rgba(124, 150, 193, 0.22)' : '1px dashed rgba(124, 150, 193, 0.3)' }
            : { mt: 0.5, pt: 0 }}
          flexWrap="wrap"
        >
          <Tooltip title={summaryPending ? labels.generatingSummary : labels.summary}>
            <Button
              size="small"
              variant={summaryPending ? 'contained' : 'outlined'}
              sx={actionSx}
              onClick={() => onRequestSummary(item)}
              disabled={!connected || summaryPending}
            >
              {iconOnly
                ? (summaryPending
                  ? <AutoFixHighIcon sx={{ fontSize: 15 }} className="spinAnim" aria-hidden />
                  : <SummaryIconComp sx={{ fontSize: 15 }} aria-hidden />)
                : (summaryPending ? labels.generatingSummary : labels.summary)}
            </Button>
          </Tooltip>
          <Tooltip title={researchPending ? labels.researching : labels.research}>
            <Button
              size="small"
              variant={researchPending ? 'contained' : 'outlined'}
              sx={actionSx}
              onClick={() => onRequestResearch(item)}
              disabled={!connected || researchPending}
            >
              {iconOnly
                ? (researchPending
                  ? <AutoFixHighIcon sx={{ fontSize: 15 }} className="spinAnim" aria-hidden />
                  : <ResearchIconComp sx={{ fontSize: 15 }} aria-hidden />)
                : (researchPending ? labels.researching : labels.research)}
            </Button>
          </Tooltip>
          <Tooltip title={labels.askAgent}>
            <Button
              size="small"
              variant={askState.open ? 'contained' : 'outlined'}
              sx={actionSx}
              onClick={() => onToggleAsk(item.id, item.feedUrl)}
              disabled={!connected}
            >
              {iconOnly
                ? (askState.pending
                  ? <AutoFixHighIcon sx={{ fontSize: 15 }} className="spinAnim" aria-hidden />
                  : <AskIconComp sx={{ fontSize: 15 }} aria-hidden />)
                : labels.askAgent}
            </Button>
          </Tooltip>
          {hasSummaryBlock ? (
            <Tooltip title={summaryVisible ? labels.hideSummary : labels.showSummary}>
              <Button
                size="small"
                variant={summaryVisible ? 'contained' : 'outlined'}
                sx={summaryVisible ? matchActionSx : actionSx}
                onClick={() => onSetSummaryMode(summaryVisible ? 'hidden' : (summaryLong ? 'collapsed' : 'expanded'))}
              >
                {iconOnly ? <SummaryIconComp sx={{ fontSize: 15 }} aria-hidden /> : (summaryVisible ? labels.hideSummary : labels.showSummary)}
              </Button>
            </Tooltip>
          ) : null}
          {hasResearchBlock ? (
            <Tooltip title={researchVisible ? labels.hideResearch : labels.showResearch}>
              <Button
                size="small"
                variant={researchVisible ? 'contained' : 'outlined'}
                sx={researchVisible ? matchActionSx : actionSx}
                onClick={() => onSetResearchMode(researchVisible ? 'hidden' : (researchLong ? 'collapsed' : 'expanded'))}
              >
                {iconOnly ? <ResearchIconComp sx={{ fontSize: 15 }} aria-hidden /> : (researchVisible ? labels.hideResearch : labels.showResearch)}
              </Button>
            </Tooltip>
          ) : null}
        </Stack>
        {askState.open ? (
          <Box sx={{ mt: 1.1, p: 1, border: '1px solid rgba(106,128,162,0.4)', borderRadius: performanceMode ? 1 : 1.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
              <Typography variant="caption" sx={{ color: 'rgba(210,219,235,0.74)' }}>
                {labels.askAgent}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(188,203,229,0.75)' }}>
                {labels.questionsLeft}: {askState.remaining}
              </Typography>
            </Stack>
            <Stack spacing={0.8} sx={{ mb: 0.8, maxHeight: 180, overflow: 'auto' }}>
              {askState.messages.map((m, idx) => (
                <Box key={`${idx}-${m.q.slice(0, 18)}`}>
                  <Typography variant="caption" sx={{ color: 'rgba(146,204,255,0.92)', display: 'block' }}>
                    Q: {m.q}
                  </Typography>
                  <Typography variant="caption" sx={{ color: m.error ? 'rgba(255,168,168,0.95)' : 'rgba(216,227,246,0.92)', display: 'block' }}>
                    A: {m.error || m.a || '...'}
                  </Typography>
                </Box>
              ))}
            </Stack>
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                fullWidth
                placeholder={labels.askPlaceholder}
                value={askState.draft}
                onChange={e => onAskDraft(item.id, item.feedUrl, e.target.value.slice(0, 400))}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAskSubmit(item);
                  }
                }}
              />
              <Button
                size="small"
                variant="contained"
                onClick={() => onAskSubmit(item)}
                disabled={!connected || askState.pending || askState.remaining <= 0 || !String(askState.draft || '').trim()}
              >
                {askState.pending ? labels.thinking : labels.send}
              </Button>
            </Stack>
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
}, (prev, next) => {
  return prev.item === next.item
    && prev.askState === next.askState
    && prev.labels === next.labels
    && prev.vibeIcons === next.vibeIcons
    && prev.compactBtnSx === next.compactBtnSx
    && prev.buttonMode === next.buttonMode
    && prev.performanceMode === next.performanceMode
    && prev.fontScale === next.fontScale
    && prev.connected === next.connected
    && prev.hideAllResearch === next.hideAllResearch
    && prev.hideAllSummaries === next.hideAllSummaries
    && prev.summaryPending === next.summaryPending
    && prev.researchPending === next.researchPending
    && prev.isPinnedNews === next.isPinnedNews
    && prev.accent === next.accent
    && prev.soft === next.soft
    && prev.matchAccent === next.matchAccent
    && prev.showAutoResearching === next.showAutoResearching
    && prev.summaryMode === next.summaryMode
    && prev.summaryLong === next.summaryLong
    && prev.summaryText === next.summaryText
    && prev.researchMode === next.researchMode
    && prev.researchLong === next.researchLong
    && prev.researchText === next.researchText
    && prev.researchConfidence === next.researchConfidence;
});

export default function ReactColumnsPreview({ wsUrl }: Props) {
  const dispatch = useAppDispatch();
  const connected = useAppSelector(s => s.connection.connected);
  const status = useAppSelector(s => s.connection.status);
  const language = useAppSelector(s => s.ui.language);
  const vibe = useAppSelector(s => s.ui.vibe);
  const scheme = useAppSelector(s => s.ui.scheme);
  const buttonMode = useAppSelector(s => s.ui.buttonMode);
  const performanceMode = useAppSelector(s => s.ui.performanceMode);
  const fontSize = useAppSelector(s => s.ui.fontSize);
  const notifyEnabled = useAppSelector(s => s.ui.notifyEnabled);
  const notifyMode = useAppSelector(s => s.ui.notifyMode);
  const hideAllResearch = useAppSelector(s => s.ui.hideAllResearch);
  const hideAllSummaries = useAppSelector(s => s.ui.hideAllSummaries);
  const showMoreNewsAllSeq = useAppSelector(s => s.ui.showMoreNewsAllSeq);
  const resetNewsShownAllSeq = useAppSelector(s => s.ui.resetNewsShownAllSeq);
  const aiEnabled = useAppSelector(s => s.ui.aiEnabled);
  const feeds = useAppSelector(s => s.feeds.feeds);
  const pinnedByUrl = useAppSelector(s => s.feeds.pinnedByUrl);
  const controlsOpenByUrl = useAppSelector(s => s.feeds.controlsOpenByUrl);
  const deleteAgeByUrl = useAppSelector(s => s.feeds.deleteAgeByUrl);
  const orderByUrl = useAppSelector(s => s.feeds.orderByUrl);
  const searchQuery = useAppSelector(s => s.ui.searchQuery);
  const allColumnControlsHidden = useAppSelector(s => s.ui.allColumnControlsHidden);
  const itemsByFeed = useAppSelector(s => s.news.itemsByFeed);
  const summaryPendingById = useAppSelector(s => s.news.summaryPendingById);
  const researchPendingById = useAppSelector(s => s.news.researchPendingById);
  const pinnedNewsById = useAppSelector(s => s.news.pinnedNewsById);
  const askByItem = useAppSelector(s => s.news.askByItem);
  const pendingTimeoutsRef = useRef<Record<string, number>>({});
  const researchTimeoutsRef = useRef<Record<string, number>>({});
  const hydratedFeedUiRef = useRef(false);
  const seenNewsIdsRef = useRef<Set<string>>(new Set());
  const notificationsPrimedRef = useRef(false);
  const [bodyModes, setBodyModes] = useState<Record<string, BodyMode>>({});
  const [clipboardNoticeOpen, setClipboardNoticeOpen] = useState(false);
  const [clipboardNotice, setClipboardNotice] = useState('');
  const [dragFeedUrl, setDragFeedUrl] = useState<string | null>(null);
  const [dragOverFeedUrl, setDragOverFeedUrl] = useState<string | null>(null);
  const [advancedControlsByUrl, setAdvancedControlsByUrl] = useState<Record<string, boolean>>({});
  const dragCommittedRef = useRef(false);
  const dragLastTargetRef = useRef<string | null>(null);
  const [visibleByFeed, setVisibleByFeed] = useState<Record<string, number>>({});
  const [hydratedColumns, setHydratedColumns] = useState<Record<string, true>>({});
  const columnNodesRef = useRef<Record<string, HTMLDivElement | null>>({});
  const prevAllControlsHiddenRef = useRef<boolean | null>(null);
  const bg = language === 'bg';
  const l = useMemo(() => ({
    previewTitle: bg ? 'Колони На Живо' : 'Live Columns',
    live: bg ? 'На живо през WebSocket' : 'Live via WebSocket',
    disconnected: bg ? 'Разкачен' : 'Disconnected',
    waiting: bg ? 'Изчакване на новини...' : 'Waiting for news...',
    waitingMatches: bg ? 'Няма съвпадения засега...' : 'No matched news yet...',
    noMatches: bg ? 'Няма съвпадения за търсенето в този поток.' : 'No search matches in this stream.',
    pinned: bg ? 'Закачена' : 'Pinned',
    pin: bg ? 'Закачи' : 'Pin',
    remove: bg ? 'Премахни' : 'Remove',
    hideControls: bg ? 'Скрий контроли' : 'Hide controls',
    showControls: bg ? 'Покажи контроли' : 'Show controls',
    summariesOn: bg ? 'Резюмета: ВКЛ' : 'Summaries: ON',
    summariesOff: bg ? 'Резюмета: ИЗКЛ' : 'Summaries: OFF',
    researchOn: bg ? 'Авто проучване: ВКЛ' : 'Auto Research: ON',
    researchOff: bg ? 'Авто проучване: ИЗКЛ' : 'Auto Research: OFF',
    budgetLow: bg ? 'Бюджет: Нисък' : 'Budget: Low',
    budgetStandard: bg ? 'Бюджет: Стандарт' : 'Budget: Standard',
    budgetHigh: bg ? 'Бюджет: Висок' : 'Budget: High',
    poll45: bg ? 'Проверка: 45с' : 'Poll: 45s',
    poll60: bg ? 'Проверка: 60с' : 'Poll: 60s',
    poll90: bg ? 'Проверка: 90с' : 'Poll: 90s',
    poll120: bg ? 'Проверка: 120с' : 'Poll: 120s',
    poll180: bg ? 'Проверка: 180с' : 'Poll: 180s',
    poll300: bg ? 'Проверка: 300с' : 'Poll: 300s',
    sortNewest: bg ? 'Сортиране: Най-нови' : 'Sort: Newest',
    sortOldest: bg ? 'Сортиране: Най-стари' : 'Sort: Oldest',
    sortMatched: bg ? 'Сортиране: Съвпадения' : 'Sort: Matched',
    filterAll: bg ? 'Филтър: Всички' : 'Filter: All',
    filterMatches: bg ? 'Филтър: Само съвпадения' : 'Filter: Matches',
    filterResearched: bg ? 'Филтър: Само проучени' : 'Filter: Researched',
    filterSummaries: bg ? 'Филтър: Само резюмета' : 'Filter: Summaries',
    filterMatchesResearched: bg ? 'Филтър: Съвпадения + проучени' : 'Filter: Matches + Researched',
    filterMatchesSummaries: bg ? 'Филтър: Съвпадения + резюмета' : 'Filter: Matches + Summaries',
    filterResearchedSummaries: bg ? 'Филтър: Проучени + резюмета' : 'Filter: Researched + Summaries',
    filterAllFlags: bg ? 'Филтър: Всички флагове' : 'Filter: All flags',
    moreOptions: bg ? 'Още опции' : 'More options',
    lessOptions: bg ? 'По-малко опции' : 'Less options',
    matches: bg ? 'Съвпадения' : 'Matches',
    researched: bg ? 'Проучени' : 'Researched',
    summaries: bg ? 'Резюмета' : 'Summaries',
    match: bg ? 'СЪВПАДЕНИЕ' : 'MATCH',
    shareLink: bg ? 'Сподели линк' : 'Share Link',
    copyNews: bg ? 'Копирай новината' : 'Copy News',
    hideNews: bg ? 'Скрий новина' : 'Hide News',
    generatingSummary: bg ? 'Генериране на резюме...' : 'Generating Summary...',
    summary: bg ? 'Резюме' : 'Summary',
    researching: bg ? 'Проучване...' : 'Researching...',
    research: bg ? 'Проучване' : 'Research',
    askAgent: bg ? 'Питай агента' : 'Ask Agent',
    confidence: bg ? 'Увереност' : 'Confidence',
    showSummary: bg ? 'Покажи резюме' : 'Show Summary',
    hideSummary: bg ? 'Скрий резюме' : 'Hide Summary',
    showResearch: bg ? 'Покажи проучване' : 'Show Research',
    hideResearch: bg ? 'Скрий проучване' : 'Hide Research',
    showMore: bg ? 'Покажи още' : 'Show More',
    showLess: bg ? 'Покажи по-малко' : 'Show Less',
    showFiveMore: bg ? 'Покажи още 5' : 'Show 5 more',
    resetToTenItems: bg ? 'Нулирай до 10' : 'Reset to 10',
    autoResearching: bg ? 'Авто проучване...' : 'Auto researching...',
    pinNews: bg ? 'Закачи новина' : 'Pin news',
    unpinNews: bg ? 'Откачи новина' : 'Unpin news',
    questionsLeft: bg ? 'Оставащи въпроси' : 'Questions left',
    askPlaceholder: bg ? 'Питай за тази конкретна новина...' : 'Ask about this specific news...',
    thinking: bg ? 'Мисля...' : 'Thinking...',
    send: bg ? 'Изпрати' : 'Send',
    linkCopied: bg ? 'Линкът е копиран' : 'Link copied',
    newsCopied: bg ? 'Новината е копирана' : 'News copied',
    deleteYesterday: bg ? 'Изтрий: Вчера' : 'Delete: Yesterday',
    deleteWeek: bg ? 'Изтрий: Седмица' : 'Delete: Past week',
    deleteMonth: bg ? 'Изтрий: Месец' : 'Delete: Past month',
    deleteYear: bg ? 'Изтрий: Година' : 'Delete: Past year',
    deleteOld: bg ? 'Изтрий стари' : 'Delete old'
  }), [bg]);

  useEffect(() => {
    document.body.dataset.reactRenderer = '1';
    startWsConnection(dispatch, wsUrl);

    return () => {
      delete document.body.dataset.reactRenderer;
      stopWsConnection();
      const ids = Object.keys(pendingTimeoutsRef.current);
      for (const id of ids) {
        window.clearTimeout(pendingTimeoutsRef.current[id]);
      }
      pendingTimeoutsRef.current = {};
      const rIds = Object.keys(researchTimeoutsRef.current);
      for (const id of rIds) {
        window.clearTimeout(researchTimeoutsRef.current[id]);
      }
      researchTimeoutsRef.current = {};
    };
  }, [dispatch, wsUrl]);

  useEffect(() => {
    if (typeof window === 'undefined' || hydratedFeedUiRef.current || !feeds.length) return;
    try {
      const raw = window.localStorage.getItem('aiNews.feedUi.v1');
      if (raw) {
        const parsed = JSON.parse(raw) as {
          pinnedByUrl?: Record<string, boolean>;
          controlsOpenByUrl?: Record<string, boolean>;
          deleteAgeByUrl?: Record<string, 'yesterday' | 'week' | 'month' | 'year'>;
          orderByUrl?: string[];
        };
        dispatch(hydrateFeedUiState(parsed));
      }
    } catch {}
    hydratedFeedUiRef.current = true;
  }, [dispatch, feeds.length]);

  useEffect(() => {
    if (typeof window === 'undefined' || !feeds.length) return;
    try {
      window.localStorage.setItem('aiNews.feedUi.v1', JSON.stringify({
        pinnedByUrl,
        controlsOpenByUrl,
        deleteAgeByUrl,
        orderByUrl
      }));
    } catch {}
  }, [controlsOpenByUrl, deleteAgeByUrl, feeds.length, orderByUrl, pinnedByUrl]);

  useEffect(() => {
    if (!feeds.length) return;
    const feedUrlSet = new Set(feeds.map(f => f.url));
    setAdvancedControlsByUrl(prev => {
      let changed = false;
      const next: Record<string, boolean> = {};
      for (const [url, value] of Object.entries(prev)) {
        if (feedUrlSet.has(url)) next[url] = !!value;
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [feeds]);

  useEffect(() => {
    if (!notificationsPrimedRef.current) {
      Object.values(itemsByFeed).forEach(items => {
        (items || []).forEach(item => {
          if (item?.id) seenNewsIdsRef.current.add(item.id);
        });
      });
      notificationsPrimedRef.current = true;
      return;
    }

    const newlySeen: Array<{ feedUrl: string; item: NewsItem }> = [];
    Object.entries(itemsByFeed).forEach(([feedUrl, items]) => {
      const list = Array.isArray(items) ? items : [];
      // Lists are kept newest-first; stop scanning once we hit first known id.
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (!item?.id) continue;
        if (seenNewsIdsRef.current.has(item.id)) break;
        newlySeen.push({ feedUrl, item });
      }
    });

    if (!newlySeen.length) return;

    const notificationsAllowed = notifyEnabled
      && typeof Notification !== 'undefined'
      && Notification.permission === 'granted';

    const shouldNotify = (feedUrl: string, it: NewsItem): boolean => {
      if (notifyMode === 'all') return true;
      if (notifyMode === 'pinned') return !!pinnedByUrl[feedUrl];
      if (notifyMode === 'matched_pinned') return !!it.isMatch && !!pinnedByUrl[feedUrl];
      return !!it.isMatch;
    };

    // Notify in chronological order when multiple items land in one batch.
    for (let i = newlySeen.length - 1; i >= 0; i--) {
      const { feedUrl, item } = newlySeen[i];
      seenNewsIdsRef.current.add(item.id);
      if (!notificationsAllowed) continue;
      if (!shouldNotify(feedUrl, item)) continue;
      const body = String(item.summary || item.research || '').trim();
      const n = new Notification(item.isMatch ? `MATCH · ${item.title}` : item.title, {
        body: body || item.link
      });
      n.onclick = () => window.open(item.link, '_blank', 'noopener,noreferrer');
    }
  }, [itemsByFeed, notifyEnabled, notifyMode, pinnedByUrl]);

  useEffect(() => {
    if (!feeds.length) return;
    if (prevAllControlsHiddenRef.current === null) {
      prevAllControlsHiddenRef.current = allColumnControlsHidden;
      if (allColumnControlsHidden) {
        dispatch(setAllFeedControlsOpen(false));
      }
      return;
    }

    if (prevAllControlsHiddenRef.current !== allColumnControlsHidden) {
      dispatch(setAllFeedControlsOpen(!allColumnControlsHidden));
      prevAllControlsHiddenRef.current = allColumnControlsHidden;
      return;
    }

    if (allColumnControlsHidden) {
      dispatch(setAllFeedControlsOpen(false));
    }
  }, [allColumnControlsHidden, dispatch, feeds.length]);

  const previewFeeds = useMemo(() => {
    if (feeds.length) {
      const list = [...feeds];
      const orderIndex = new Map(orderByUrl.map((url, idx) => [url, idx]));
      list.sort((a, b) => {
        const aFiltered = a.url === FILTERED_FEED_URL;
        const bFiltered = b.url === FILTERED_FEED_URL;
        if (aFiltered !== bFiltered) return aFiltered ? -1 : 1;
        const ai = orderIndex.get(a.url) ?? Number.MAX_SAFE_INTEGER;
        const bi = orderIndex.get(b.url) ?? Number.MAX_SAFE_INTEGER;
        return ai - bi;
      });
      return list;
    }
    const fallback = Object.keys(itemsByFeed).map(url => ({
      url,
      label: url,
      kind: 'rss' as const,
      intervalSec: 120,
      summaryEnabled: false,
      researchEnabled: false,
      budget: 'standard' as const,
      sortMode: 'newest' as const,
      filters: { onlyMatches: false, onlyResearched: false, onlySummaries: false }
    }));
    return fallback;
  }, [feeds, itemsByFeed, orderByUrl]);

  const renderedFeeds = previewFeeds;

  const filteredColumnItems = useMemo(() => {
    const all = Object.values(itemsByFeed).flatMap(items => Array.isArray(items) ? items : []);
    const map = new Map<string, NewsItem>();
    all.forEach(it => {
      if (!it || !it.id) return;
      if (!it.isMatch || it.filteredOk === false) return;
      const prev = map.get(it.id);
      if (!prev || (Number(it.publishedMs || 0) > Number(prev.publishedMs || 0))) {
        map.set(it.id, { ...it, feedUrl: FILTERED_FEED_URL });
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      const aPinned = !!pinnedNewsById[a.id];
      const bPinned = !!pinnedNewsById[b.id];
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
      return b.publishedMs - a.publishedMs;
    });
  }, [itemsByFeed, pinnedNewsById]);

  useEffect(() => {
    if (!renderedFeeds.length) return;
    setVisibleByFeed(prev => {
      const next: Record<string, number> = {};
      renderedFeeds.forEach(feed => {
        next[feed.url] = Math.max(10, prev[feed.url] || 10);
      });
      return next;
    });
  }, [renderedFeeds]);

  useEffect(() => {
    if (showMoreNewsAllSeq <= 0 || !renderedFeeds.length) return;
    setVisibleByFeed(prev => {
      const next = { ...prev };
      renderedFeeds.forEach(feed => {
        next[feed.url] = Math.max(10, (next[feed.url] || 10) + 5);
      });
      return next;
    });
  }, [showMoreNewsAllSeq, renderedFeeds]);

  useEffect(() => {
    if (resetNewsShownAllSeq <= 0 || !renderedFeeds.length) return;
    setVisibleByFeed(prev => {
      const next = { ...prev };
      renderedFeeds.forEach(feed => {
        next[feed.url] = 10;
      });
      return next;
    });
  }, [resetNewsShownAllSeq, renderedFeeds]);

  useEffect(() => {
    setHydratedColumns(prev => {
      const next = { ...prev };
      let changed = false;
      for (let i = 0; i < Math.min(4, renderedFeeds.length); i++) {
        const url = renderedFeeds[i].url;
        if (!next[url]) {
          next[url] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [renderedFeeds]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      const found: string[] = [];
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const url = String(el.dataset.feedUrl || '');
        if (url) found.push(url);
      });
      if (!found.length) return;
      setHydratedColumns(prev => {
        const next = { ...prev };
        let changed = false;
        found.forEach(url => {
          if (!next[url]) {
            next[url] = true;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, {
      root: null,
      rootMargin: '320px 0px',
      threshold: 0.01
    });

    renderedFeeds.forEach(feed => {
      const node = columnNodesRef.current[feed.url];
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, [renderedFeeds]);

  const requestSummary = (it: NewsItem) => {
    if (!connected) return;

    dispatch(setSummaryPending(it.id));
    dispatch(clearSummaryForItem({ id: it.id, feedUrl: it.feedUrl }));

    if (pendingTimeoutsRef.current[it.id]) {
      window.clearTimeout(pendingTimeoutsRef.current[it.id]);
    }
    pendingTimeoutsRef.current[it.id] = window.setTimeout(() => {
      dispatch(clearSummaryPending(it.id));
      delete pendingTimeoutsRef.current[it.id];
    }, 30000);

    const ok = sendWsMessage({
      type: 'run_summary_item',
      id: it.id,
      feedUrl: it.feedUrl
    });
    if (!ok) dispatch(clearSummaryPending(it.id));
  };

  const requestResearch = (it: NewsItem) => {
    if (!connected) return;

    dispatch(setResearchPending(it.id));
    dispatch(clearResearchForItem({ id: it.id, feedUrl: it.feedUrl }));

    if (researchTimeoutsRef.current[it.id]) {
      window.clearTimeout(researchTimeoutsRef.current[it.id]);
    }
    researchTimeoutsRef.current[it.id] = window.setTimeout(() => {
      dispatch(clearResearchPending(it.id));
      delete researchTimeoutsRef.current[it.id];
    }, 45000);

    const ok = sendWsMessage({
      type: 'run_research_item',
      id: it.id,
      feedUrl: it.feedUrl
    });
    if (!ok) dispatch(clearResearchPending(it.id));
  };

  const askKey = (it: NewsItem) => `${it.feedUrl}::${it.id}`;
  const bodyKey = (it: NewsItem, kind: 'summary' | 'research') => `${it.feedUrl}::${it.id}::${kind}`;

  const getBodyMode = (key: string, text: string, threshold: number): BodyMode => {
    const saved = bodyModes[key];
    if (saved) return saved;
    return String(text || '').trim().length > threshold ? 'collapsed' : 'expanded';
  };
  const getDefaultBodyMode = (text: string, threshold: number): BodyMode =>
    String(text || '').trim().length > threshold ? 'collapsed' : 'expanded';

  const setBodyMode = (key: string, mode: BodyMode) => {
    setBodyModes(prev => ({ ...prev, [key]: mode }));
  };

  const hideItem = (it: NewsItem) => {
    const ok = sendWsMessage({ type: 'hide_item', id: it.id });
    if (ok) dispatch(hideItemLocally(it.id));
  };

  const copyLink = async (url: string) => {
    const value = String(url || '').trim();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setClipboardNotice(l.linkCopied);
      setClipboardNoticeOpen(true);
    } catch {
      window.open(value, '_blank', 'noopener,noreferrer');
    }
  };

  const copyNewsPayload = async (it: NewsItem) => {
    const title = String(it.title || '').trim();
    const summary = String(it.summary || '').trim();
    const research = String(it.research || '').trim();
    const link = String(it.link || '').trim();
    if (!title && !summary && !research && !link) return;

    const chunks: string[] = [];
    if (title) chunks.push(`Title: ${title}`);
    if (summary) chunks.push(`Summary: ${summary}`);
    if (research) chunks.push(`Research: ${research}`);
    if (link) chunks.push(`Link: ${link}`);
    const payload = chunks.join('\n\n');

    try {
      await navigator.clipboard.writeText(payload);
      setClipboardNotice(l.newsCopied);
      setClipboardNoticeOpen(true);
    } catch {
      if (link) window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  const removeFeed = (feedUrl: string) => {
    if (!connected) return;
    const ok = sendWsMessage({ type: 'remove_feed', feedUrl });
    if (ok) dispatch(removeFeedLocally(feedUrl));
  };

  const requestAsk = (it: NewsItem) => {
    if (!connected) return;
    const k = askKey(it);
    const askState = askByItem[k] || { used: 0, remaining: 5, draft: '', pending: false };
    const question = String(askState.draft || '').trim().slice(0, 400);
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
  };

  const toggleFeedSummary = (feed: FeedInfo) => {
    if (!connected) return;
    const nextEnabled = !feed.summaryEnabled;
    const ok = sendWsMessage({ type: 'set_feed_summary', feedUrl: feed.url, enabled: nextEnabled });
    if (ok) dispatch(setFeedSummarySetting({ feedUrl: feed.url, enabled: nextEnabled }));
  };

  const toggleFeedResearch = (feed: FeedInfo) => {
    if (!connected) return;
    const nextEnabled = !feed.researchEnabled;
    const ok = sendWsMessage({ type: 'set_feed_research', feedUrl: feed.url, enabled: nextEnabled });
    if (ok) dispatch(setFeedResearchSetting({ feedUrl: feed.url, enabled: nextEnabled }));
  };

  const setFeedBudget = (feed: FeedInfo, budget: BudgetMode) => {
    if (!connected) return;
    const ok = sendWsMessage({ type: 'set_feed_budget', feedUrl: feed.url, budget });
    if (ok) dispatch(setFeedBudgetSetting({ feedUrl: feed.url, budget }));
  };

  const setFeedInterval = (feed: FeedInfo, intervalSec: number) => {
    if (!connected) return;
    const next = Math.max(20, Math.min(3600, Math.floor(intervalSec)));
    const ok = sendWsMessage({ type: 'set_feed_interval', feedUrl: feed.url, intervalSec: next });
    if (ok) dispatch(setFeedIntervalSetting({ feedUrl: feed.url, intervalSec: next }));
  };

  const setFeedSortMode = (feed: FeedInfo, sortMode: SortMode) => {
    if (!connected) return;
    const ok = sendWsMessage({
      type: 'set_feed_column_settings',
      feedUrl: feed.url,
      sortMode,
      filters: feed.filters
    });
    if (ok) dispatch(setFeedColumnSettings({ feedUrl: feed.url, sortMode }));
  };

  const setFeedFilters = (feed: FeedInfo, filters: FeedInfo['filters']) => {
    if (!connected) return;
    const ok = sendWsMessage({
      type: 'set_feed_column_settings',
      feedUrl: feed.url,
      sortMode: feed.sortMode,
      filters
    });
    if (ok) dispatch(setFeedColumnSettings({ feedUrl: feed.url, filters }));
  };

  const setFeedFilterPreset = (feed: FeedInfo, preset: FeedFilterPreset) => {
    setFeedFilters(feed, presetToFeedFilters(preset));
  };

  const removeOldInFeed = (feed: FeedInfo) => {
    const age = deleteAgeByUrl[feed.url] || 'week';
    dispatch(removeOldItemsInFeed({
      feedUrl: feed.url,
      cutoffMs: cutoffFromAge(age)
    }));
  };

  const fontScale = fontSize === 'xl' ? 1.17 : fontSize === 'lg' ? 1.09 : fontSize === 'sm' ? 0.93 : 1;
  const resolvedVibe: VibeValue = (VIBE_LIST.includes(vibe as VibeValue) ? vibe : 'default') as VibeValue;
  const resolvedScheme: SchemeValue = (SCHEME_LIST.includes(scheme as SchemeValue) ? scheme : 'classic') as SchemeValue;
  const palette = useMemo(() => buildColumnPalette(resolvedVibe, resolvedScheme), [resolvedVibe, resolvedScheme]);
  const vibeIcons = useMemo(() => getVibeIcons(resolvedVibe), [resolvedVibe]);
  const compactBtnSx = useMemo(() => ({
    minHeight: 34,
    px: 1.2,
    py: 0.18,
    fontSize: `${0.82 * fontScale}rem`,
    lineHeight: 1.15,
    borderRadius: performanceMode ? 1.2 : 999,
    whiteSpace: 'nowrap'
  }), [fontScale, performanceMode]);
  const compactFormSx = useMemo(() => ({
    '& .MuiOutlinedInput-root': {
      height: 34,
      fontSize: `${0.82 * fontScale}rem`,
      background: performanceMode ? 'rgba(10,16,29,0.98)' : 'rgba(12,20,38,0.92)',
      color: 'rgba(231,240,255,0.96)',
      borderRadius: performanceMode ? 1.2 : 999
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(122,149,194,0.44)'
    },
    '& .MuiSvgIcon-root': {
      color: 'rgba(203,217,243,0.9)'
    }
  }), [fontScale, performanceMode]);
  const cardLabels = useMemo<CardLabels>(() => ({
    pinNews: l.pinNews,
    unpinNews: l.unpinNews,
    match: l.match,
    shareLink: l.shareLink,
    copyNews: l.copyNews,
    hideNews: l.hideNews,
    generatingSummary: l.generatingSummary,
    summary: l.summary,
    researching: l.researching,
    research: l.research,
    askAgent: l.askAgent,
    showSummary: l.showSummary,
    hideSummary: l.hideSummary,
    showMore: l.showMore,
    showLess: l.showLess,
    autoResearching: l.autoResearching,
    confidence: l.confidence,
    showResearch: l.showResearch,
    hideResearch: l.hideResearch,
    questionsLeft: l.questionsLeft,
    askPlaceholder: l.askPlaceholder,
    thinking: l.thinking,
    send: l.send
  }), [l]);

  return (
    <Box className="container" sx={{ pt: 1, pb: 0.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
        <Typography variant="overline" sx={{ color: 'var(--text-muted)', letterSpacing: '0.14em', fontWeight: 800 }}>
          {l.previewTitle}
        </Typography>
        <Chip
          size="small"
          label={connected ? l.live : `${l.disconnected} (${status})`}
          color={connected ? 'success' : 'default'}
          variant={connected ? 'filled' : 'outlined'}
        />
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(320px, 1fr))',
            lg: 'repeat(3, minmax(330px, 1fr))',
            xl: 'repeat(4, minmax(330px, 1fr))'
          }
        }}
        onDragOver={e => {
          if (!dragFeedUrl) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={e => {
          if (!dragFeedUrl) return;
          if (dragCommittedRef.current) return;
          e.preventDefault();
          const fromUrl = String(
            e.dataTransfer.getData('application/x-ai-news-feed')
            || e.dataTransfer.getData('text/plain')
            || dragFeedUrl
            || ''
          ).trim();
          if (!fromUrl) return;

          const nodes = renderedFeeds
            .map(feed => ({ url: feed.url, node: columnNodesRef.current[feed.url] }))
            .filter((x): x is { url: string; node: HTMLDivElement } => !!x.node);
          if (!nodes.length) return;

          let bestUrl = nodes[0].url;
          let bestDist = Number.POSITIVE_INFINITY;
          for (const n of nodes) {
            const rect = n.node.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const d = Math.abs(e.clientX - centerX);
            if (d < bestDist) {
              bestDist = d;
              bestUrl = n.url;
            }
          }
          if (bestUrl && bestUrl !== fromUrl) {
            dispatch(reorderFeeds({ fromUrl, toUrl: bestUrl }));
          }
          dragCommittedRef.current = true;
          setDragFeedUrl(null);
          setDragOverFeedUrl(null);
          dragLastTargetRef.current = null;
        }}
      >
        {renderedFeeds.map((feed: FeedInfo, columnIdx: number) => {
          const isMatchColumn = feed.url === FILTERED_FEED_URL || String(feed.label || '').toLowerCase().startsWith('filtered');
          const colTheme: 'a' | 'b' | 'match' = isMatchColumn ? 'match' : (columnIdx % 2 === 0 ? 'a' : 'b');
          const accent = colTheme === 'a' ? palette.a : colTheme === 'b' ? palette.b : palette.m;
          const soft = colTheme === 'a' ? palette.aSoft : colTheme === 'b' ? palette.bSoft : palette.mSoft;
          const items = isMatchColumn ? filteredColumnItems : (itemsByFeed[feed.url] || []);
          const normalizedQuery = String(searchQuery || '').trim().toLowerCase();
          const itemsVisible = normalizedQuery
            ? items.filter(it => {
              const hay = `${it.title}\n${it.summary || ''}\n${it.research || ''}`.toLowerCase();
              return hay.includes(normalizedQuery);
            })
            : items;
          const visibleLimit = Math.max(10, visibleByFeed[feed.url] || 10);
          const shownItems = itemsVisible.slice(0, visibleLimit);
          const isHydrated = !!hydratedColumns[feed.url];
          const pinned = !!pinnedByUrl[feed.url];
          const controlsOpen = typeof controlsOpenByUrl[feed.url] === 'boolean' ? !!controlsOpenByUrl[feed.url] : true;
          const canDrag = !isMatchColumn;
          const isDragging = dragFeedUrl === feed.url;
          const isDropTarget = !!dragFeedUrl && dragFeedUrl !== feed.url && dragOverFeedUrl === feed.url;
          return (
            <Box
              key={feed.url}
              data-feed-url={feed.url}
              draggable={canDrag}
              onDragStart={e => {
                if (!canDrag) return;
                const target = e.target as HTMLElement | null;
                if (target?.closest('button, a, input, textarea, select, label, [role="button"]')) {
                  e.preventDefault();
                  return;
                }
                dragCommittedRef.current = false;
                dragLastTargetRef.current = null;
                setDragFeedUrl(feed.url);
                setDragOverFeedUrl(feed.url);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', feed.url);
                e.dataTransfer.setData('application/x-ai-news-feed', feed.url);
              }}
              onDragEnd={() => {
                const fallbackTarget = dragLastTargetRef.current || dragOverFeedUrl;
                if (!dragCommittedRef.current && dragFeedUrl && fallbackTarget && dragFeedUrl !== fallbackTarget) {
                  dispatch(reorderFeeds({ fromUrl: dragFeedUrl, toUrl: fallbackTarget }));
                }
                setDragFeedUrl(null);
                setDragOverFeedUrl(null);
                dragCommittedRef.current = false;
                dragLastTargetRef.current = null;
              }}
              ref={node => {
                columnNodesRef.current[feed.url] = node as HTMLDivElement | null;
              }}
              onDragEnter={() => {
                if (!canDrag) return;
                if (dragFeedUrl && dragFeedUrl !== feed.url) {
                  setDragOverFeedUrl(feed.url);
                  if (dragLastTargetRef.current !== feed.url) {
                    dispatch(reorderFeeds({ fromUrl: dragFeedUrl, toUrl: feed.url }));
                    dragCommittedRef.current = true;
                    dragLastTargetRef.current = feed.url;
                  }
                }
              }}
              onDragOver={e => {
                if (!canDrag) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragFeedUrl && dragFeedUrl !== feed.url && dragOverFeedUrl !== feed.url) {
                  setDragOverFeedUrl(feed.url);
                  if (dragLastTargetRef.current !== feed.url) {
                    dispatch(reorderFeeds({ fromUrl: dragFeedUrl, toUrl: feed.url }));
                    dragCommittedRef.current = true;
                    dragLastTargetRef.current = feed.url;
                  }
                }
              }}
              onDrop={e => {
                if (!canDrag) return;
                e.preventDefault();
                e.stopPropagation();
                dragCommittedRef.current = true;
                dragLastTargetRef.current = feed.url;
                setDragFeedUrl(null);
                setDragOverFeedUrl(null);
              }}
            >
            <Card
              variant="outlined"
              sx={{
                background: performanceMode
                  ? (isMatchColumn ? 'rgba(28, 20, 7, 0.98)' : 'rgba(8, 14, 29, 0.98)')
                  : (isMatchColumn
                    ? `linear-gradient(180deg, ${palette.mSoft}, rgba(34, 20, 7, 0.95) 74%, rgba(10, 14, 28, 0.98) 100%), var(--column-shell-overlay)`
                    : `linear-gradient(180deg, ${soft}, rgba(9, 15, 30, 0.96) 78%), var(--column-shell-overlay)`),
                borderColor: isDropTarget
                  ? accent
                  : (isDragging ? accent : (isMatchColumn ? `${palette.m}` : 'rgba(97, 123, 161, 0.42)')),
                borderTop: `4px solid ${isMatchColumn ? palette.m : accent}`,
                boxShadow: performanceMode
                  ? (isDropTarget ? `0 0 0 1px ${accent}` : 'none')
                  : (isDropTarget
                    ? `0 0 0 2px ${accent}66, 0 18px 34px rgba(0,0,0,0.30)`
                    : (isMatchColumn
                      ? '0 12px 26px rgba(0,0,0,0.30), inset 0 0 0 1px rgba(255,180,62,0.12)'
                      : '0 10px 22px rgba(0,0,0,0.22)')),
                borderRadius: 'var(--column-radius, 16px)',
                color: 'rgba(234, 242, 255, 0.96)',
                opacity: isDragging ? 0.45 : 1,
                transform: isDragging ? 'scale(0.985)' : (isDropTarget ? 'translateY(-4px)' : 'translateY(0)'),
                transition: performanceMode ? 'none' : 'transform 130ms ease, box-shadow 130ms ease, opacity 130ms ease, border-color 130ms ease',
                cursor: canDrag ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }}
            >
              <CardContent sx={{ pb: '12px !important', px: 2.2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: `${18 * fontScale}px`,
                      fontWeight: 800,
                      lineHeight: 1.2,
                      pr: 1,
                      pl: 0.3,
                      color: 'rgba(232,243,255,0.97)',
                      fontFamily: 'var(--news-title-font-family, var(--font-family))'
                    }}
                  >
                    {feed.label}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={itemsVisible.length} sx={{ color: 'rgba(231,242,255,0.96)', bgcolor: 'rgba(79, 114, 168, 0.24)', borderColor: accent }} />
                    <Chip
                      size="small"
                      variant="outlined"
                      icon={feed.kind === 'youtube' ? <SmartDisplayIcon /> : feed.kind === 'reddit' ? <RedditIcon /> : <RssFeedIcon />}
                      label=""
                      sx={{
                        color: 'rgba(231,242,255,0.96)',
                        borderColor: accent,
                        '& .MuiChip-label': { px: 0.2 },
                        '& .MuiChip-icon': { color: 'rgba(231,242,255,0.96)', ml: 0.5, mr: 0.1, fontSize: 16 }
                      }}
                    />
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mb: 1.1 }} flexWrap="wrap">
                  {!isMatchColumn ? (
                    <Button
                      size="small"
                      variant={pinned ? 'contained' : 'outlined'}
                      startIcon={pinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
                      onClick={() => dispatch(togglePinned(feed.url))}
                      sx={compactBtnSx}
                    >
                      {pinned ? l.pinned : l.pin}
                    </Button>
                  ) : null}
                  {!isMatchColumn ? (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={() => removeFeed(feed.url)}
                      disabled={!connected}
                      sx={compactBtnSx}
                    >
                      {l.remove}
                    </Button>
                  ) : null}
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<TuneIcon />}
                    onClick={() => dispatch(toggleFeedControls(feed.url))}
                    sx={compactBtnSx}
                  >
                    {controlsOpen ? l.hideControls : l.showControls}
                  </Button>
                </Stack>
                {isHydrated && controlsOpen ? (
                  <Box
                    sx={{
                      mb: 1.1,
                      display: 'grid',
                      gap: 0.8,
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, minmax(0, 1fr))'
                      }
                    }}
                  >
                    <Button
                      size="small"
                      fullWidth
                      variant={feed.summaryEnabled ? 'contained' : 'outlined'}
                      onClick={() => toggleFeedSummary(feed)}
                      disabled={!connected}
                      sx={compactBtnSx}
                    >
                      {feed.summaryEnabled ? l.summariesOn : l.summariesOff}
                    </Button>
                    <Button
                      size="small"
                      fullWidth
                      variant={feed.researchEnabled ? 'contained' : 'outlined'}
                      onClick={() => toggleFeedResearch(feed)}
                      disabled={!connected}
                      sx={compactBtnSx}
                    >
                      {feed.researchEnabled ? l.researchOn : l.researchOff}
                    </Button>
                    <FormControl size="small" fullWidth sx={compactFormSx}>
                      <Select
                        value={feed.budget}
                        onChange={e => setFeedBudget(feed, e.target.value as BudgetMode)}
                        disabled={!connected}
                      >
                        <MenuItem value="low">{l.budgetLow}</MenuItem>
                        <MenuItem value="standard">{l.budgetStandard}</MenuItem>
                        <MenuItem value="high">{l.budgetHigh}</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth sx={compactFormSx}>
                      <Select
                        value={String(feed.intervalSec || 120)}
                        onChange={e => setFeedInterval(feed, Number(e.target.value) || 120)}
                        disabled={!connected}
                      >
                        <MenuItem value="45">{l.poll45}</MenuItem>
                        <MenuItem value="60">{l.poll60}</MenuItem>
                        <MenuItem value="90">{l.poll90}</MenuItem>
                        <MenuItem value="120">{l.poll120}</MenuItem>
                        <MenuItem value="180">{l.poll180}</MenuItem>
                        <MenuItem value="300">{l.poll300}</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth sx={compactFormSx}>
                      <Select
                        value={feed.sortMode}
                        onChange={e => setFeedSortMode(feed, e.target.value as SortMode)}
                        disabled={!connected}
                      >
                        <MenuItem value="newest">{l.sortNewest}</MenuItem>
                        <MenuItem value="oldest">{l.sortOldest}</MenuItem>
                        <MenuItem value="matched">{l.sortMatched}</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth sx={compactFormSx}>
                      <Select
                        value={getFeedFilterPreset(feed.filters)}
                        onChange={e => setFeedFilterPreset(feed, e.target.value as FeedFilterPreset)}
                        disabled={!connected}
                      >
                        <MenuItem value="all">{l.filterAll}</MenuItem>
                        <MenuItem value="matches">{l.filterMatches}</MenuItem>
                        <MenuItem value="researched">{l.filterResearched}</MenuItem>
                        <MenuItem value="summaries">{l.filterSummaries}</MenuItem>
                        <MenuItem value="matches_researched">{l.filterMatchesResearched}</MenuItem>
                        <MenuItem value="matches_summaries">{l.filterMatchesSummaries}</MenuItem>
                        <MenuItem value="researched_summaries">{l.filterResearchedSummaries}</MenuItem>
                        <MenuItem value="all_flags">{l.filterAllFlags}</MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth
                      onClick={() => setAdvancedControlsByUrl(prev => ({ ...prev, [feed.url]: !prev[feed.url] }))}
                      sx={{ ...compactBtnSx, gridColumn: '1 / -1' }}
                    >
                      {advancedControlsByUrl[feed.url] ? l.lessOptions : l.moreOptions}
                    </Button>
                    {advancedControlsByUrl[feed.url] ? (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ gridColumn: '1 / -1' }}>
                        <FormControl size="small" fullWidth sx={compactFormSx}>
                          <Select
                            value={deleteAgeByUrl[feed.url] || 'week'}
                            onChange={e => dispatch(setFeedDeleteAge({
                              feedUrl: feed.url,
                              age: e.target.value as 'yesterday' | 'week' | 'month' | 'year'
                            }))}
                          >
                            <MenuItem value="yesterday">{l.deleteYesterday}</MenuItem>
                            <MenuItem value="week">{l.deleteWeek}</MenuItem>
                            <MenuItem value="month">{l.deleteMonth}</MenuItem>
                            <MenuItem value="year">{l.deleteYear}</MenuItem>
                          </Select>
                        </FormControl>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteOutlineIcon />}
                          onClick={() => removeOldInFeed(feed)}
                          sx={{ ...compactBtnSx, minWidth: { sm: 136 } }}
                        >
                          {l.deleteOld}
                        </Button>
                      </Stack>
                    ) : null}
                  </Box>
                ) : null}
                {!isHydrated ? (
                  <Stack spacing={1.2} sx={{ py: 0.6 }}>
                    <Skeleton variant="rounded" height={80} sx={{ bgcolor: 'rgba(120,140,180,0.14)' }} />
                    <Skeleton variant="rounded" height={80} sx={{ bgcolor: 'rgba(120,140,180,0.14)' }} />
                    <Alert severity="info" variant="outlined">Loading column...</Alert>
                  </Stack>
                ) : (
                <Stack spacing={1.2}>
                  {itemsVisible.length === 0 ? (
                    <Alert severity="info" variant="outlined">
                      {items.length === 0 ? (isMatchColumn ? l.waitingMatches : l.waiting) : l.noMatches}
                    </Alert>
                  ) : shownItems.map(it => {
                    const askState = askByItem[askKey(it)] || {
                      open: false,
                      draft: '',
                      pending: false,
                      remaining: 5,
                      messages: []
                    };
                    const summaryKey = bodyKey(it, 'summary');
                    const researchKey = bodyKey(it, 'research');
                    const summaryResearchHidden = hideAllResearch || bodyModes[researchKey] === 'hidden';
                    const savedSummaryMode = bodyModes[summaryKey];
                    const summaryMode = summaryResearchHidden && savedSummaryMode === 'hidden'
                      ? getDefaultBodyMode(it.summary || '', 260)
                      : getBodyMode(summaryKey, it.summary || '', 260);
                    const summaryLong = String(it.summary || '').trim().length > 260;
                    const summaryText = summaryMode === 'collapsed' ? collapseText(it.summary || '', 260) : String(it.summary || '');
                    const researchMode = getBodyMode(researchKey, it.research || '', 340);
                    const researchLong = String(it.research || '').trim().length > 340;
                    const researchText = researchMode === 'collapsed' ? compactResearch(it.research || '') : String(it.research || '');
                    const researchConfidence = extractConfidence(it.research || '');
                    return (
                      <NewsCard
                        key={it.id}
                        item={it}
                        askState={askState}
                        labels={cardLabels}
                        vibeIcons={vibeIcons}
                        compactBtnSx={compactBtnSx}
                        buttonMode={buttonMode}
                        performanceMode={performanceMode}
                        fontScale={fontScale}
                        connected={connected}
                        hideAllResearch={hideAllResearch}
                        hideAllSummaries={hideAllSummaries}
                        summaryPending={!!summaryPendingById[it.id]}
                        researchPending={!!researchPendingById[it.id]}
                        isPinnedNews={!!pinnedNewsById[it.id]}
                        accent={accent}
                        soft={soft}
                        matchAccent={palette.m}
                        showAutoResearching={feed.researchEnabled && aiEnabled && !it.research && !researchPendingById[it.id] && !hideAllResearch}
                        summaryMode={summaryMode}
                        summaryLong={summaryLong}
                        summaryText={summaryText}
                        researchMode={researchMode}
                        researchLong={researchLong}
                        researchText={researchText}
                        researchConfidence={researchConfidence}
                        onTogglePinnedNews={(id: string) => dispatch(togglePinnedNews(id))}
                        onCopyLink={copyLink}
                        onCopyNews={copyNewsPayload}
                        onHideItem={hideItem}
                        onRequestSummary={requestSummary}
                        onRequestResearch={requestResearch}
                        onToggleAsk={(id: string, feedUrl: string) => dispatch(toggleAskOpen({ id, feedUrl }))}
                        onSetSummaryMode={(mode: BodyMode) => setBodyMode(summaryKey, mode)}
                        onSetResearchMode={(mode: BodyMode) => setBodyMode(researchKey, mode)}
                        onAskDraft={(id: string, feedUrl: string, draft: string) => dispatch(setAskDraft({ id, feedUrl, draft }))}
                        onAskSubmit={requestAsk}
                      />
                    );
                  })}
                  {itemsVisible.length > shownItems.length ? (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setVisibleByFeed(prev => ({ ...prev, [feed.url]: (prev[feed.url] || 10) + 5 }))}
                    >
                      {l.showFiveMore}
                    </Button>
                  ) : null}
                  {itemsVisible.length > 10 && shownItems.length > 10 ? (
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      onClick={() => setVisibleByFeed(prev => ({ ...prev, [feed.url]: 10 }))}
                    >
                      {l.resetToTenItems}
                    </Button>
                  ) : null}
                </Stack>
                )}
              </CardContent>
            </Card>
            </Box>
          );
        })}
      </Box>
      <Snackbar
        open={clipboardNoticeOpen}
        autoHideDuration={1400}
        onClose={() => setClipboardNoticeOpen(false)}
        message={clipboardNotice || l.linkCopied}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
