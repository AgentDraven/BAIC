import { invoke } from "@tauri-apps/api/core"

export async function hasPluginEnvValue(name: string): Promise<boolean> {
  return invoke<boolean>("has_plugin_env_value", { name })
}

export async function setPluginEnvValue(name: string, value: string): Promise<void> {
  await invoke("set_plugin_env_value", { name, value })
}