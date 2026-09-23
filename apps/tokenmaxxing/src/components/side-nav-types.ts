export type ActiveView = "home" | "settings" | string

export type PluginContextAction = "reload" | "remove"

export interface NavPlugin {
  id: string
  name: string
  iconUrl: string
  brandColor?: string
}