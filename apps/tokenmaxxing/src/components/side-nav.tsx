import { useCallback } from "react"
import { CircleHelp, Moon, Settings, Sun } from "lucide-react"
import { openUrl } from "@tauri-apps/plugin-opener"
import { invoke } from "@tauri-apps/api/core"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { GaugeIcon } from "@/components/gauge-icon"
import { NavButton } from "@/components/nav-button"
import { PanelPinControl } from "@/components/panel-pin-control"
import { SortableNavPlugin } from "@/components/sortable-nav-plugin"
import type { ActiveView, NavPlugin, PluginContextAction } from "@/components/side-nav-types"
import { usePluginContextMenu } from "@/components/use-plugin-context-menu"
import { useDarkMode } from "@/hooks/use-dark-mode"
import { useAppPreferencesStore } from "@/stores/app-preferences-store"
import { useAppUiStore } from "@/stores/app-ui-store"
import { saveThemeMode } from "@/lib/settings"

interface SideNavProps {
  activeView: ActiveView
  onViewChange: (view: ActiveView) => void
  plugins: NavPlugin[]
  onPluginContextAction?: (pluginId: string, action: PluginContextAction) => void
  isPluginRefreshAvailable?: (pluginId: string) => boolean
  onReorder?: (orderedIds: string[]) => void
}

export function SideNav({
  activeView,
  onViewChange,
  plugins,
  onPluginContextAction,
  isPluginRefreshAvailable,
  onReorder,
}: SideNavProps) {
  const isDark = useDarkMode()
  const panelPinned = useAppUiStore((state) => state.panelPinned)
  const keepOnTaskbar = useAppPreferencesStore((state) => state.panelKeepOnTaskbar)
  const themeMode = useAppPreferencesStore((state) => state.themeMode)
  const setThemeMode = useAppPreferencesStore((state) => state.setThemeMode)
  const dragRegionProps =
    panelPinned || keepOnTaskbar ? { "data-tauri-drag-region": true } : {}

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 300, tolerance: 5 },
    })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!onReorder) return
      const { active, over } = event
      if (over && active.id !== over.id) {
        const oldIndex = plugins.findIndex((p) => p.id === active.id)
        const newIndex = plugins.findIndex((p) => p.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return
        const next = arrayMove(plugins, oldIndex, newIndex)
        onReorder(next.map((p) => p.id))
      }
    },
    [onReorder, plugins]
  )

  const handlePluginContextMenu = usePluginContextMenu(
    onPluginContextAction,
    isPluginRefreshAvailable
  )

  return (
    <nav {...dragRegionProps} className="flex w-12 shrink-0 flex-col py-3">
      <NavButton
        isActive={activeView === "home"}
        onClick={() => onViewChange("home")}
        aria-label="Home"
      >
        <GaugeIcon className="size-6 dark:text-page-accent" />
      </NavButton>

      <div {...dragRegionProps} className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-none">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={plugins.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {plugins.map((plugin) => (
              <SortableNavPlugin
                key={plugin.id}
                plugin={plugin}
                isActive={activeView === plugin.id}
                isDark={isDark}
                onClick={() => onViewChange(plugin.id)}
                onContextMenu={(e) => handlePluginContextMenu(e, plugin.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <PanelPinControl />

      <NavButton
        isActive={false}
        onClick={() => {
          openUrl("https://github.com/falkoro/tokenmaxxing/issues").catch(console.error)
          invoke("hide_panel").catch(console.error)
        }}
        aria-label="Help"
      >
        <CircleHelp className="size-6" />
      </NavButton>

      <NavButton
        isActive={themeMode !== "system"}
        onClick={() => {
          const next = isDark ? "light" : "dark"
          setThemeMode(next)
          saveThemeMode(next).catch((error) => {
            console.error("Failed to save theme mode:", error)
          })
        }}
        aria-label={isDark ? "Use light theme" : "Use dark theme"}
      >
        {isDark ? <Sun className="size-6" /> : <Moon className="size-6" />}
      </NavButton>

      <NavButton
        isActive={activeView === "settings"}
        onClick={() => onViewChange("settings")}
        aria-label="Settings"
      >
        <Settings className="size-6" />
      </NavButton>
    </nav>
  )
}

export type { ActiveView, NavPlugin, PluginContextAction }
