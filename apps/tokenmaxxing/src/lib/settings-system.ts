import { getSettingsStore } from "@/lib/settings-store";
import {
  DEFAULT_GLOBAL_SHORTCUT,
  DEFAULT_PANEL_KEEP_ON_TASKBAR,
  DEFAULT_PANEL_STAY_OPEN_WHEN_PINNED,
  DEFAULT_START_ON_LOGIN,
  type GlobalShortcut,
} from "@/lib/settings-types";

const GLOBAL_SHORTCUT_KEY = "globalShortcut";
const START_ON_LOGIN_KEY = "startOnLogin";
const PANEL_STAY_OPEN_WHEN_PINNED_KEY = "panelStayOpenWhenPinned";
const PANEL_KEEP_ON_TASKBAR_KEY = "panelKeepOnTaskbar";

const store = getSettingsStore();

function isGlobalShortcut(value: unknown): value is GlobalShortcut {
  if (value === null) return true;
  return typeof value === "string";
}

export async function loadGlobalShortcut(): Promise<GlobalShortcut> {
  const stored = await store.get<unknown>(GLOBAL_SHORTCUT_KEY);
  if (isGlobalShortcut(stored)) return stored;
  return DEFAULT_GLOBAL_SHORTCUT;
}

export async function saveGlobalShortcut(shortcut: GlobalShortcut): Promise<void> {
  await store.set(GLOBAL_SHORTCUT_KEY, shortcut);
  await store.save();
}

export async function loadStartOnLogin(): Promise<boolean> {
  const stored = await store.get<unknown>(START_ON_LOGIN_KEY);
  if (typeof stored === "boolean") return stored;
  return DEFAULT_START_ON_LOGIN;
}

export async function saveStartOnLogin(value: boolean): Promise<void> {
  await store.set(START_ON_LOGIN_KEY, value);
  await store.save();
}

export async function loadPanelStayOpenWhenPinned(): Promise<boolean> {
  const stored = await store.get<unknown>(PANEL_STAY_OPEN_WHEN_PINNED_KEY);
  if (typeof stored === "boolean") return stored;
  return DEFAULT_PANEL_STAY_OPEN_WHEN_PINNED;
}

export async function savePanelStayOpenWhenPinned(value: boolean): Promise<void> {
  await store.set(PANEL_STAY_OPEN_WHEN_PINNED_KEY, value);
  await store.save();
}

export async function loadPanelKeepOnTaskbar(): Promise<boolean> {
  const stored = await store.get<unknown>(PANEL_KEEP_ON_TASKBAR_KEY);
  if (typeof stored === "boolean") return stored;
  return DEFAULT_PANEL_KEEP_ON_TASKBAR;
}

export async function savePanelKeepOnTaskbar(value: boolean): Promise<void> {
  await store.set(PANEL_KEEP_ON_TASKBAR_KEY, value);
  await store.save();
}