export type PluginSettings = {
  order: string[];
  disabled: string[];
};

export type AutoUpdateIntervalMinutes = 5 | 15 | 30 | 60;

export type ThemeMode = "system" | "light" | "dark";

export type DisplayMode = "used" | "left";

export type ResetTimerDisplayMode = "relative" | "absolute";

export type TimeFormatMode = "auto" | "12h" | "24h";

export type MenubarIconStyle = "gauge" | "provider" | "bars" | "donut";

export type MenubarMetric = "default" | "weekly";

export type GlobalShortcut = string | null;

export type MachineSourceMode = "local" | "remote" | "mixed";

export type MachineSettings = {
  mode: MachineSourceMode;
  remoteBaseUrl: string;
  remotePluginIds: string[];
  setupComplete: boolean;
};

export const DEFAULT_PLUGIN_SETTINGS: PluginSettings = {
  order: [],
  disabled: [],
};

export const DEFAULT_AUTO_UPDATE_INTERVAL: AutoUpdateIntervalMinutes = 15;
export const DEFAULT_THEME_MODE: ThemeMode = "system";
export const DEFAULT_DISPLAY_MODE: DisplayMode = "left";
export const DEFAULT_RESET_TIMER_DISPLAY_MODE: ResetTimerDisplayMode = "relative";
export const DEFAULT_TIME_FORMAT_MODE: TimeFormatMode = "auto";
export const DEFAULT_MENUBAR_ICON_STYLE: MenubarIconStyle = "gauge";
export const DEFAULT_MENUBAR_METRIC: MenubarMetric = "default";
export const DEFAULT_GLOBAL_SHORTCUT: GlobalShortcut = null;
export const DEFAULT_START_ON_LOGIN = false;
export const DEFAULT_PANEL_STAY_OPEN_WHEN_PINNED = true;
export const DEFAULT_PANEL_KEEP_ON_TASKBAR = true;
export const DEFAULT_MACHINE_SETTINGS: MachineSettings = {
  mode: "local",
  remoteBaseUrl: "",
  remotePluginIds: [],
  setupComplete: false,
};

const AUTO_UPDATE_INTERVALS: AutoUpdateIntervalMinutes[] = [5, 15, 30, 60];
const THEME_MODES: ThemeMode[] = ["system", "light", "dark"];
const MACHINE_SOURCE_MODES: MachineSourceMode[] = ["local", "remote", "mixed"];
const DISPLAY_MODES: DisplayMode[] = ["used", "left"];
const RESET_TIMER_DISPLAY_MODES: ResetTimerDisplayMode[] = ["relative", "absolute"];
const TIME_FORMAT_MODES: TimeFormatMode[] = ["auto", "12h", "24h"];
const MENUBAR_ICON_STYLES: MenubarIconStyle[] = ["gauge", "provider", "donut", "bars"];
const MENUBAR_METRICS: MenubarMetric[] = ["default", "weekly"];

export const MENUBAR_ICON_STYLE_OPTIONS: { value: MenubarIconStyle; label: string }[] = [
  { value: "gauge", label: "Logo" },
  { value: "provider", label: "Plugin" },
  { value: "donut", label: "Donut" },
  { value: "bars", label: "Bars" },
];

export const MENUBAR_METRIC_OPTIONS: { value: MenubarMetric; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "weekly", label: "Weekly" },
];

export const AUTO_UPDATE_OPTIONS: { value: AutoUpdateIntervalMinutes; label: string }[] =
  AUTO_UPDATE_INTERVALS.map((value) => ({
    value,
    label: value === 60 ? "1 hour" : `${value} min`,
  }));

export const THEME_OPTIONS: { value: ThemeMode; label: string }[] =
  THEME_MODES.map((value) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
  }));

export const DISPLAY_MODE_OPTIONS: { value: DisplayMode; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "used", label: "Used" },
];

export const RESET_TIMER_DISPLAY_OPTIONS: { value: ResetTimerDisplayMode; label: string }[] = [
  { value: "relative", label: "Relative" },
  { value: "absolute", label: "Absolute" },
];

export const TIME_FORMAT_OPTIONS: { value: TimeFormatMode; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "12h", label: "12-hour" },
  { value: "24h", label: "24-hour" },
];

export const MACHINE_SOURCE_OPTIONS: { value: MachineSourceMode; label: string }[] = [
  { value: "local", label: "Local" },
  { value: "remote", label: "Remote" },
  { value: "mixed", label: "Mixed" },
];

export const AUTO_UPDATE_INTERVAL_VALUES = AUTO_UPDATE_INTERVALS;
export const THEME_MODE_VALUES = THEME_MODES;
export const MACHINE_SOURCE_MODE_VALUES = MACHINE_SOURCE_MODES;
export const DISPLAY_MODE_VALUES = DISPLAY_MODES;
export const RESET_TIMER_DISPLAY_MODE_VALUES = RESET_TIMER_DISPLAY_MODES;
export const TIME_FORMAT_MODE_VALUES = TIME_FORMAT_MODES;
export const MENUBAR_ICON_STYLE_VALUES = MENUBAR_ICON_STYLES;
export const MENUBAR_METRIC_VALUES = MENUBAR_METRICS;
