import { PinOff, RefreshCw, Server, Settings } from "lucide-react"
import { invoke } from "@tauri-apps/api/core"
import { LazyStore } from "@tauri-apps/plugin-store"
import { Button } from "@/components/ui/button"
import { MenubarIconStylePreview } from "@/components/settings/menubar-icon-preview"
import type { DisplayPluginState } from "@/hooks/app/use-app-plugin-views"
import type { TraySettingsPreview } from "@/hooks/app/use-tray-icon"
import type { ActiveView } from "@/components/side-nav"
import { useAppPreferencesStore } from "@/stores/app-preferences-store"
import { useAppUiStore } from "@/stores/app-ui-store"
import { cn } from "@/lib/utils"

const UI_STATE_STORE_PATH = "ui-state.json"
const PANEL_PINNED_KEY = "panelPinned"

type PinnedOverlayBarProps = {
  activeView: ActiveView
  displayPlugins: DisplayPluginState[]
  traySettingsPreview: TraySettingsPreview
  onViewChange: (view: ActiveView) => void
  onRefreshAll: () => void
}

function formatPercent(plugin: DisplayPluginState): string {
  const progress = plugin.data?.lines.find((line) => line.type === "progress")
  if (!progress || progress.limit <= 0) {
    if (plugin.loading) return "..."
    if (plugin.error) return "err"
    return "--"
  }
  return `${Math.round((progress.used / progress.limit) * 100)}%`
}

export function PinnedOverlayBar({
  activeView,
  displayPlugins,
  traySettingsPreview,
  onViewChange,
  onRefreshAll,
}: PinnedOverlayBarProps) {
  const setPinned = useAppUiStore((state) => state.setPanelPinned)
  const menubarIconStyle = useAppPreferencesStore((state) => state.menubarIconStyle)
  const machineSettings = useAppPreferencesStore((state) => state.machineSettings)
  const summaries = displayPlugins.slice(0, 4)
  const remotePluginIds = new Set(machineSettings.remotePluginIds)

  const isRemotePlugin = (id: string) => {
    if (machineSettings.mode === "remote") return true
    if (machineSettings.mode === "mixed") return remotePluginIds.has(id)
    return false
  }

  const unpin = () => {
    setPinned(false)
    invoke("set_panel_pinned", { pinned: false }).catch(console.error)

    const store = new LazyStore(UI_STATE_STORE_PATH)
    void store
      .set(PANEL_PINNED_KEY, false)
      .then(() => store.save())
      .catch(console.error)
  }

  return (
    <div
      data-tauri-drag-region
      className={cn(
        "flex h-12 w-full shrink-0 items-center gap-1.5 overflow-hidden border-b border-border/70",
        "bg-card/94 px-2 backdrop-blur-xl",
        "dark:bg-[#242426]/92"
      )}
    >
      <Button
        type="button"
        variant={activeView === "home" ? "default" : "ghost"}
        size="sm"
        aria-label="Home"
        onClick={() => onViewChange("home")}
        className="min-w-8 px-2"
      >
        <MenubarIconStylePreview
          style={menubarIconStyle}
          isActive={activeView === "home"}
          traySettingsPreview={traySettingsPreview}
        />
      </Button>

      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {summaries.length === 0 ? (
          <div className="truncate px-2 text-xs text-muted-foreground">
            No providers enabled
          </div>
        ) : (
          summaries.map((plugin) => (
            <button
              key={plugin.meta.id}
              type="button"
              onClick={() => onViewChange(plugin.meta.id)}
              className={cn(
                "min-w-0 rounded-md border px-2 py-0.5 text-left text-xs transition-colors",
                activeView === plugin.meta.id
                  ? "border-primary/30 bg-primary text-primary-foreground"
                  : "border-border bg-muted/50 hover:bg-muted"
              )}
            >
              <span className="block max-w-28 truncate font-medium leading-tight">
                {plugin.meta.name}
              </span>
              <span className="flex items-center gap-1 tabular-nums text-[10px] leading-tight opacity-70">
                {formatPercent(plugin)}
                {isRemotePlugin(plugin.meta.id) && (
                  <Server aria-label="Remote machine" className="size-2.5" />
                )}
              </span>
            </button>
          ))
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Refresh now"
        onClick={onRefreshAll}
      >
        <RefreshCw className="size-4" />
      </Button>
      <Button
        type="button"
        variant={activeView === "settings" ? "default" : "ghost"}
        size="icon-sm"
        aria-label="Settings"
        onClick={() => onViewChange("settings")}
      >
        <Settings className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Unpin panel"
        onClick={unpin}
      >
        <PinOff className="size-4" />
      </Button>
    </div>
  )
}
