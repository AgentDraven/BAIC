import { useShallow } from "zustand/react/shallow"
import { AppContent, type AppContentActionProps } from "@/components/app/app-content"
import { PinnedOverlayBar } from "@/components/app/pinned-overlay-bar"
import { PanelFooter } from "@/components/panel-footer"
import { SideNav, type NavPlugin, type PluginContextAction } from "@/components/side-nav"
import type { DisplayPluginState } from "@/hooks/app/use-app-plugin-views"
import type { SettingsPluginState } from "@/hooks/app/use-settings-plugin-list"
import { useAppVersion } from "@/hooks/app/use-app-version"
import { usePanel } from "@/hooks/app/use-panel"
import { useAppUpdate } from "@/hooks/use-app-update"
import { useAppUiStore } from "@/stores/app-ui-store"
import { isMacPlatform } from "@/lib/platform"

// Vertical space around the card that counts against the window's max height:
// macOS has the pt-1.5 top + tray arrow + pb-6 bottom (~37px); Windows/Linux
// have the symmetric p-6 margin (48px). Using the wrong value clips the
// footer at the bottom of the panel.
const VERTICAL_OVERHEAD_MAC_PX = 37
const VERTICAL_OVERHEAD_OTHER_PX = 48

type AppShellProps = {
  onRefreshAll: () => void
  navPlugins: NavPlugin[]
  displayPlugins: DisplayPluginState[]
  settingsPlugins: SettingsPluginState[]
  autoUpdateNextAt: number | null
  selectedPlugin: DisplayPluginState | null
  onPluginContextAction: (pluginId: string, action: PluginContextAction) => void
  isPluginRefreshAvailable: (pluginId: string) => boolean
  onNavReorder: (orderedIds: string[]) => void
  appContentProps: AppContentActionProps
}

export function AppShell({
  onRefreshAll,
  navPlugins,
  displayPlugins,
  settingsPlugins,
  autoUpdateNextAt,
  selectedPlugin,
  onPluginContextAction,
  isPluginRefreshAvailable,
  onNavReorder,
  appContentProps,
}: AppShellProps) {
  const {
    activeView,
    setActiveView,
    showAbout,
    setShowAbout,
    panelPinned,
  } = useAppUiStore(
    useShallow((state) => ({
      activeView: state.activeView,
      setActiveView: state.setActiveView,
      showAbout: state.showAbout,
      setShowAbout: state.setShowAbout,
      panelPinned: state.panelPinned,
    }))
  )

  const {
    containerRef,
    scrollRef,
    canScrollDown,
    maxPanelHeightPx,
  } = usePanel({
    activeView,
    setActiveView,
    showAbout,
    setShowAbout,
    displayPlugins,
    panelPinned,
  })

  const appVersion = useAppVersion()
  const { updateStatus, triggerInstall, checkForUpdates } = useAppUpdate()

  // The up-pointing caret targets the macOS menu bar icon above the panel.
  // On Windows/Linux the panel opens above a bottom taskbar, so it points at
  // nothing — hide it and keep the margins symmetric.
  const isMac = isMacPlatform()
  const verticalOverheadPx = isMac
    ? VERTICAL_OVERHEAD_MAC_PX
    : VERTICAL_OVERHEAD_OTHER_PX

  // When pinned on Windows/Linux, show a thin performance bar at the top of
  // the regular panel (Steam-overlay style quick-glance widget). The full
  // panel — side nav, plugin content, footer — is still rendered below.
  const showPinnedBar = panelPinned && !isMac

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className={`flex flex-col items-center p-6 bg-transparent outline-none ${isMac ? "pt-1.5" : ""}`}
    >
      {isMac && <div className="tray-arrow" />}
      <div
        className="relative bg-card/90 rounded-2xl overflow-hidden select-none w-full max-w-105 border border-border/70 ring-1 ring-black/[0.04] dark:ring-white/[0.06] shadow-xl backdrop-blur-xl flex flex-col"
        style={maxPanelHeightPx ? { maxHeight: `${maxPanelHeightPx - verticalOverheadPx}px` } : undefined}
      >
        {showPinnedBar && (
          <PinnedOverlayBar
            activeView={activeView}
            displayPlugins={displayPlugins}
            traySettingsPreview={appContentProps.traySettingsPreview}
            onViewChange={setActiveView}
            onRefreshAll={onRefreshAll}
          />
        )}
        <div className="flex min-h-0 flex-1 flex-row">
          <SideNav
            activeView={activeView}
            onViewChange={setActiveView}
            plugins={navPlugins}
            onPluginContextAction={onPluginContextAction}
            isPluginRefreshAvailable={isPluginRefreshAvailable}
            onReorder={onNavReorder}
          />
          <div className="flex min-w-0 flex-1 flex-col px-3 pt-2 pb-1.5">
            <div className="relative flex-1 min-h-0">
              <div ref={scrollRef} className="h-full overflow-y-auto scrollbar-none">
                <AppContent
                  {...appContentProps}
                  displayPlugins={displayPlugins}
                  settingsPlugins={settingsPlugins}
                  selectedPlugin={selectedPlugin}
                />
              </div>
              <div
                className={`pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-card/95 dark:from-muted/80 to-transparent transition-opacity duration-200 ${canScrollDown ? "opacity-100" : "opacity-0"}`}
              />
            </div>
            <PanelFooter
              version={appVersion}
              autoUpdateNextAt={autoUpdateNextAt}
              updateStatus={updateStatus}
              onUpdateInstall={triggerInstall}
              onUpdateCheck={checkForUpdates}
              onRefreshAll={onRefreshAll}
              showAbout={showAbout}
              onShowAbout={() => setShowAbout(true)}
              onCloseAbout={() => setShowAbout(false)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
