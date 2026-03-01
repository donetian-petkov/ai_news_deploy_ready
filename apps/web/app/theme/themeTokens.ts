import { FontPresetValue, FontSizeValue } from '../store/valueEnums';

export const FONT_FAMILY_BY_PRESET: Record<FontPresetValue, string> = {
  [FontPresetValue.System]: "'Inter', 'Segoe UI', sans-serif",
  [FontPresetValue.Manrope]: "'Manrope', 'Segoe UI', sans-serif",
  [FontPresetValue.Grotesk]: "'Space Grotesk', 'Segoe UI', sans-serif",
  [FontPresetValue.Sora]: "'Sora', 'Segoe UI', sans-serif",
  [FontPresetValue.Plex]: "'IBM Plex Sans', 'Segoe UI', sans-serif",
  [FontPresetValue.Serif]: "'Cinzel', Georgia, serif",
  [FontPresetValue.Mono]: "'IBM Plex Mono', 'SF Mono', monospace"
};

export const FONT_SIZE_BY_PRESET: Record<FontSizeValue, number> = {
  [FontSizeValue.Sm]: 13,
  [FontSizeValue.Md]: 14,
  [FontSizeValue.Lg]: 15,
  [FontSizeValue.Xl]: 16
};

