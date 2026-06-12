import { getSettingsStore } from "@/lib/settings-store";
import type { PluginMeta } from "@/lib/plugin-types";
import { DEFAULT_PLUGIN_SETTINGS, type PluginSettings } from "@/lib/settings-types";

export * from "@/lib/settings-types";
export {
  loadAutoUpdateInterval,
  saveAutoUpdateInterval,
  loadThemeMode,
  saveThemeMode,
  loadDisplayMode,
  saveDisplayMode,
  loadResetTimerDisplayMode,
  saveResetTimerDisplayMode,
  loadTimeFormatMode,
  saveTimeFormatMode,
  loadMenubarIconStyle,
  saveMenubarIconStyle,
  loadMenubarMetric,
  saveMenubarMetric,
  loadMachineSettings,
  saveMachineSettings,
} from "@/lib/settings-display";
export {
  loadGlobalShortcut,
  saveGlobalShortcut,
  loadStartOnLogin,
  saveStartOnLogin,
  loadPanelStayOpenWhenPinned,
  savePanelStayOpenWhenPinned,
  loadPanelKeepOnTaskbar,
  savePanelKeepOnTaskbar,
} from "@/lib/settings-system";
export {
  migrateWindsurfToDevin,
  migrateLegacyTraySettings,
} from "@/lib/settings-migrations";

export const REFRESH_COOLDOWN_MS = 300_000;

const PLUGIN_SETTINGS_KEY = "plugins";
const store = getSettingsStore();
const DEFAULT_ENABLED_PLUGINS = new Set(["claude", "codex", "cursor"]);

export async function loadPluginSettings(): Promise<PluginSettings> {
  const stored = await store.get<PluginSettings>(PLUGIN_SETTINGS_KEY);
  if (!stored) return { ...DEFAULT_PLUGIN_SETTINGS };
  return {
    order: Array.isArray(stored.order) ? stored.order : [],
    disabled: Array.isArray(stored.disabled) ? stored.disabled : [],
  };
}

export async function savePluginSettings(settings: PluginSettings): Promise<void> {
  await store.set(PLUGIN_SETTINGS_KEY, settings);
  await store.save();
}

export function normalizePluginSettings(
  settings: PluginSettings,
  plugins: PluginMeta[]
): PluginSettings {
  const knownIds = plugins.map((plugin) => plugin.id);
  const knownSet = new Set(knownIds);

  const order: string[] = [];
  const seen = new Set<string>();
  for (const id of settings.order) {
    if (!knownSet.has(id) || seen.has(id)) continue;
    seen.add(id);
    order.push(id);
  }
  const newlyAdded: string[] = [];
  for (const id of knownIds) {
    if (!seen.has(id)) {
      seen.add(id);
      order.push(id);
      newlyAdded.push(id);
    }
  }

  const disabled = settings.disabled.filter((id) => knownSet.has(id));
  for (const id of newlyAdded) {
    if (!DEFAULT_ENABLED_PLUGINS.has(id) && !disabled.includes(id)) {
      disabled.push(id);
    }
  }
  return { order, disabled };
}

export function arePluginSettingsEqual(a: PluginSettings, b: PluginSettings): boolean {
  if (a.order.length !== b.order.length) return false;
  if (a.disabled.length !== b.disabled.length) return false;
  for (let i = 0; i < a.order.length; i += 1) {
    if (a.order[i] !== b.order[i]) return false;
  }
  for (let i = 0; i < a.disabled.length; i += 1) {
    if (a.disabled[i] !== b.disabled[i]) return false;
  }
  return true;
}

export function getEnabledPluginIds(settings: PluginSettings): string[] {
  const disabledSet = new Set(settings.disabled);
  return settings.order.filter((id) => !disabledSet.has(id));
}
