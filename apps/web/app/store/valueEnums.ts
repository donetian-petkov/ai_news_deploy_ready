import type { BudgetMode, FeedKind, NewsMood, NewsType, SortMode } from './types';

export enum PrimitiveType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Object = 'object'
}

export enum WsMessageType {
  News = 'news',
  Config = 'config',
  AiUsage = 'ai_usage',
  AskAgentReply = 'ask_agent_reply',
  Error = 'error',
  Ok = 'ok',
  FeedError = 'feed_error'
}

export enum FeedKindValue {
  Rss = 'rss',
  Reddit = 'reddit',
  Youtube = 'youtube'
}

export enum BudgetModeValue {
  Low = 'low',
  Standard = 'standard',
  High = 'high'
}

export enum SortModeValue {
  Newest = 'newest',
  Oldest = 'oldest',
  Matched = 'matched'
}

export enum AiProviderValue {
  OpenAI = 'openai',
  Claude = 'claude',
  OpenRouter = 'openrouter'
}

export enum SummaryLangValue {
  Bg = 'bg',
  En = 'en',
  Bilingual = 'bilingual'
}

export enum ResearchLangValue {
  Bg = 'bg',
  En = 'en'
}

export enum NewsMoodValue {
  Pesimistic = 'pesimistic',
  Optimistic = 'optimistic',
  Realistic = 'realistic',
  Melancholy = 'melancholy',
  Happiness = 'happiness',
  Sadness = 'sadness',
  Rage = 'rage',
  Uncertainty = 'uncertainty',
  Neutral = 'neutral',
  Curios = 'curios'
}

export enum NewsTypeValue {
  Science = 'science',
  Movies = 'movies',
  Politics = 'politics',
  Business = 'business',
  Technology = 'technology',
  Sports = 'sports',
  Health = 'health',
  World = 'world',
  Culture = 'culture',
  Environment = 'environment',
  Crime = 'crime',
  Education = 'education',
  Other = 'other'
}

const BUDGET_MODE_SET = new Set<BudgetMode>(Object.values(BudgetModeValue) as BudgetMode[]);
const SORT_MODE_SET = new Set<SortMode>(Object.values(SortModeValue) as SortMode[]);
const FEED_KIND_SET = new Set<FeedKind>(Object.values(FeedKindValue) as FeedKind[]);
const NEWS_MOOD_SET = new Set<NewsMood>(Object.values(NewsMoodValue) as NewsMood[]);
const NEWS_TYPE_SET = new Set<NewsType>(Object.values(NewsTypeValue) as NewsType[]);
const AI_PROVIDER_SET = new Set<string>(Object.values(AiProviderValue));
const SUMMARY_LANG_SET = new Set<string>(Object.values(SummaryLangValue));
const RESEARCH_LANG_SET = new Set<string>(Object.values(ResearchLangValue));

export function isString(value: unknown): value is string {
  return typeof value === PrimitiveType.String;
}

export function isNumber(value: unknown): value is number {
  return typeof value === PrimitiveType.Number;
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === PrimitiveType.Boolean;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === PrimitiveType.Object;
}

export function isBudgetMode(value: unknown): value is BudgetMode {
  return isString(value) && BUDGET_MODE_SET.has(value as BudgetMode);
}

export function isSortMode(value: unknown): value is SortMode {
  return isString(value) && SORT_MODE_SET.has(value as SortMode);
}

export function isFeedKind(value: unknown): value is FeedKind {
  return isString(value) && FEED_KIND_SET.has(value as FeedKind);
}

export function isNewsMood(value: unknown): value is NewsMood {
  return isString(value) && NEWS_MOOD_SET.has(value as NewsMood);
}

export function isNewsType(value: unknown): value is NewsType {
  return isString(value) && NEWS_TYPE_SET.has(value as NewsType);
}

export function isAiProvider(value: unknown): value is AiProviderValue {
  return isString(value) && AI_PROVIDER_SET.has(value);
}

export function isSummaryLang(value: unknown): value is SummaryLangValue {
  return isString(value) && SUMMARY_LANG_SET.has(value);
}

export function isResearchLang(value: unknown): value is ResearchLangValue {
  return isString(value) && RESEARCH_LANG_SET.has(value);
}

