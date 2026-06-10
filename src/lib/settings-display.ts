import { getSettingsStore } from "@/lib/settings-store";
import {
  AUTO_UPDATE_INTERVAL_VALUES,
  DEFAULT_AUTO_UPDATE_INTERVAL,
  DEFAULT_DISPLAY_MODE,
  DEFAULT_MENUBAR_ICON_STYLE,
  DEFAULT_MENUBAR_METRIC,
  DEFAULT_RESET_TIMER_DISPLAY_MODE,
  DEFAULT_THEME_MODE,
  DEFAULT_TIME_FORMAT_MODE,
  DISPLAY_MODE_VALUES,
  MENUBAR_ICON_STYLE_VALUES,
  MENUBAR_METRIC_VALUES,
  RESET_TIMER_DISPLAY_MODE_VALUES,
  THEME_MODE_VALUES,
  TIME_FORMAT_MODE_VALUES,
  type AutoUpdateIntervalMinutes,
  type DisplayMode,
  type MenubarIconStyle,
  type MenubarMetric,
  type ResetTimerDisplayMode,
  type ThemeMode,
  type TimeFormatMode,
} from "@/lib/settings-types";

const AUTO_UPDATE_SETTINGS_KEY = "autoUpdateInterval";
const THEME_MODE_KEY = "themeMode";
const DISPLAY_MODE_KEY = "displayMode";
const RESET_TIMER_DISPLAY_MODE_KEY = "resetTimerDisplayMode";
const TIME_FORMAT_MODE_KEY = "timeFormatMode";
const MENUBAR_ICON_STYLE_KEY = "menubarIconStyle";
const MENUBAR_METRIC_KEY = "menubarMetric";

const store = getSettingsStore();

function isAutoUpdateInterval(value: unknown): value is AutoUpdateIntervalMinutes {
  return (
    typeof value === "number" &&
    AUTO_UPDATE_INTERVAL_VALUES.includes(value as AutoUpdateIntervalMinutes)
  );
}

export async function loadAutoUpdateInterval(): Promise<AutoUpdateIntervalMinutes> {
  const stored = await store.get<unknown>(AUTO_UPDATE_SETTINGS_KEY);
  if (isAutoUpdateInterval(stored)) return stored;
  return DEFAULT_AUTO_UPDATE_INTERVAL;
}

export async function saveAutoUpdateInterval(
  interval: AutoUpdateIntervalMinutes
): Promise<void> {
  await store.set(AUTO_UPDATE_SETTINGS_KEY, interval);
  await store.save();
}

function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === "string" && THEME_MODE_VALUES.includes(value as ThemeMode);
}

export async function loadThemeMode(): Promise<ThemeMode> {
  const stored = await store.get<unknown>(THEME_MODE_KEY);
  if (isThemeMode(stored)) return stored;
  return DEFAULT_THEME_MODE;
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  await store.set(THEME_MODE_KEY, mode);
  await store.save();
}

function isDisplayMode(value: unknown): value is DisplayMode {
  return typeof value === "string" && DISPLAY_MODE_VALUES.includes(value as DisplayMode);
}

export async function loadDisplayMode(): Promise<DisplayMode> {
  const stored = await store.get<unknown>(DISPLAY_MODE_KEY);
  if (isDisplayMode(stored)) return stored;
  return DEFAULT_DISPLAY_MODE;
}

export async function saveDisplayMode(mode: DisplayMode): Promise<void> {
  await store.set(DISPLAY_MODE_KEY, mode);
  await store.save();
}

function isResetTimerDisplayMode(value: unknown): value is ResetTimerDisplayMode {
  return (
    typeof value === "string" &&
    RESET_TIMER_DISPLAY_MODE_VALUES.includes(value as ResetTimerDisplayMode)
  );
}

export async function loadResetTimerDisplayMode(): Promise<ResetTimerDisplayMode> {
  const stored = await store.get<unknown>(RESET_TIMER_DISPLAY_MODE_KEY);
  if (isResetTimerDisplayMode(stored)) return stored;
  return DEFAULT_RESET_TIMER_DISPLAY_MODE;
}

export async function saveResetTimerDisplayMode(mode: ResetTimerDisplayMode): Promise<void> {
  await store.set(RESET_TIMER_DISPLAY_MODE_KEY, mode);
  await store.save();
}

function isTimeFormatMode(value: unknown): value is TimeFormatMode {
  return (
    typeof value === "string" &&
    TIME_FORMAT_MODE_VALUES.includes(value as TimeFormatMode)
  );
}

export async function loadTimeFormatMode(): Promise<TimeFormatMode> {
  const stored = await store.get<unknown>(TIME_FORMAT_MODE_KEY);
  if (isTimeFormatMode(stored)) return stored;
  return DEFAULT_TIME_FORMAT_MODE;
}

export async function saveTimeFormatMode(mode: TimeFormatMode): Promise<void> {
  await store.set(TIME_FORMAT_MODE_KEY, mode);
  await store.save();
}

function isMenubarIconStyle(value: unknown): value is MenubarIconStyle {
  return (
    typeof value === "string" &&
    MENUBAR_ICON_STYLE_VALUES.includes(value as MenubarIconStyle)
  );
}

export async function loadMenubarIconStyle(): Promise<MenubarIconStyle> {
  const stored = await store.get<unknown>(MENUBAR_ICON_STYLE_KEY);
  if (isMenubarIconStyle(stored)) return stored;
  return DEFAULT_MENUBAR_ICON_STYLE;
}

export async function saveMenubarIconStyle(style: MenubarIconStyle): Promise<void> {
  await store.set(MENUBAR_ICON_STYLE_KEY, style);
  await store.save();
}

function isMenubarMetric(value: unknown): value is MenubarMetric {
  return typeof value === "string" && MENUBAR_METRIC_VALUES.includes(value as MenubarMetric);
}

export async function loadMenubarMetric(): Promise<MenubarMetric> {
  const stored = await store.get<unknown>(MENUBAR_METRIC_KEY);
  if (isMenubarMetric(stored)) return stored;
  return DEFAULT_MENUBAR_METRIC;
}

export async function saveMenubarMetric(metric: MenubarMetric): Promise<void> {
  await store.set(MENUBAR_METRIC_KEY, metric);
  await store.save();
}