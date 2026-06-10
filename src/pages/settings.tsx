import { GlobalShortcutSection } from "@/components/global-shortcut-section";
import {
  AutoRefreshSection,
  ResetTimersSection,
  TimeFormatSection,
  UsageModeSection,
} from "@/components/settings/display-settings-sections";
import { MenubarSection } from "@/components/settings/menubar-section";
import { PluginsSection } from "@/components/settings/plugins-section";
import {
  PinnedPanelSection,
  StartOnLoginSection,
} from "@/components/settings/system-settings-sections";
import { ThemeSection } from "@/components/settings/theme-section";
import type { TraySettingsPreview } from "@/hooks/app/use-tray-icon";
import {
  type AutoUpdateIntervalMinutes,
  type DisplayMode,
  type GlobalShortcut,
  type MenubarIconStyle,
  type MenubarMetric,
  type ResetTimerDisplayMode,
  type ThemeMode,
  type TimeFormatMode,
} from "@/lib/settings";

interface SettingsPageProps {
  plugins: { id: string; name: string; enabled: boolean }[];
  onReorder: (orderedIds: string[]) => void;
  onToggle: (id: string) => void;
  autoUpdateInterval: AutoUpdateIntervalMinutes;
  onAutoUpdateIntervalChange: (value: AutoUpdateIntervalMinutes) => void;
  themeMode: ThemeMode;
  onThemeModeChange: (value: ThemeMode) => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (value: DisplayMode) => void;
  resetTimerDisplayMode: ResetTimerDisplayMode;
  onResetTimerDisplayModeChange: (value: ResetTimerDisplayMode) => void;
  timeFormatMode: TimeFormatMode;
  onTimeFormatModeChange: (value: TimeFormatMode) => void;
  menubarIconStyle: MenubarIconStyle;
  onMenubarIconStyleChange: (value: MenubarIconStyle) => void;
  menubarMetric: MenubarMetric;
  onMenubarMetricChange: (value: MenubarMetric) => void;
  traySettingsPreview: TraySettingsPreview;
  globalShortcut: GlobalShortcut;
  onGlobalShortcutChange: (value: GlobalShortcut) => void;
  startOnLogin: boolean;
  onStartOnLoginChange: (value: boolean) => void;
  panelStayOpenWhenPinned: boolean;
  onPanelStayOpenWhenPinnedChange: (value: boolean) => void;
  panelKeepOnTaskbar: boolean;
  onPanelKeepOnTaskbarChange: (value: boolean) => void;
}

export function SettingsPage({
  plugins,
  onReorder,
  onToggle,
  autoUpdateInterval,
  onAutoUpdateIntervalChange,
  themeMode,
  onThemeModeChange,
  displayMode,
  onDisplayModeChange,
  resetTimerDisplayMode,
  onResetTimerDisplayModeChange,
  timeFormatMode,
  onTimeFormatModeChange,
  menubarIconStyle,
  onMenubarIconStyleChange,
  menubarMetric,
  onMenubarMetricChange,
  traySettingsPreview,
  globalShortcut,
  onGlobalShortcutChange,
  startOnLogin,
  onStartOnLoginChange,
  panelStayOpenWhenPinned,
  onPanelStayOpenWhenPinnedChange,
  panelKeepOnTaskbar,
  onPanelKeepOnTaskbarChange,
}: SettingsPageProps) {
  return (
    <div className="py-3 space-y-4">
      <AutoRefreshSection
        autoUpdateInterval={autoUpdateInterval}
        onAutoUpdateIntervalChange={onAutoUpdateIntervalChange}
      />
      <UsageModeSection
        displayMode={displayMode}
        onDisplayModeChange={onDisplayModeChange}
      />
      <ResetTimersSection
        resetTimerDisplayMode={resetTimerDisplayMode}
        timeFormatMode={timeFormatMode}
        onResetTimerDisplayModeChange={onResetTimerDisplayModeChange}
      />
      <TimeFormatSection
        timeFormatMode={timeFormatMode}
        onTimeFormatModeChange={onTimeFormatModeChange}
      />
      <MenubarSection
        menubarIconStyle={menubarIconStyle}
        onMenubarIconStyleChange={onMenubarIconStyleChange}
        menubarMetric={menubarMetric}
        onMenubarMetricChange={onMenubarMetricChange}
        traySettingsPreview={traySettingsPreview}
      />
      <ThemeSection
        themeMode={themeMode}
        onThemeModeChange={onThemeModeChange}
      />
      <GlobalShortcutSection
        globalShortcut={globalShortcut}
        onGlobalShortcutChange={onGlobalShortcutChange}
      />
      <PinnedPanelSection
        panelStayOpenWhenPinned={panelStayOpenWhenPinned}
        onPanelStayOpenWhenPinnedChange={onPanelStayOpenWhenPinnedChange}
        panelKeepOnTaskbar={panelKeepOnTaskbar}
        onPanelKeepOnTaskbarChange={onPanelKeepOnTaskbarChange}
      />
      <StartOnLoginSection
        startOnLogin={startOnLogin}
        onStartOnLoginChange={onStartOnLoginChange}
      />
      <PluginsSection
        plugins={plugins}
        onReorder={onReorder}
        onToggle={onToggle}
      />
    </div>
  );
}