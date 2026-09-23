import { useEffect } from "react"
import { invoke } from "@tauri-apps/api/core"
import { LazyStore } from "@tauri-apps/plugin-store"
import { Pin, PinOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { isMacPlatform } from "@/lib/platform"
import { useAppPreferencesStore } from "@/stores/app-preferences-store"
import { useAppUiStore } from "@/stores/app-ui-store"

const UI_STATE_STORE_PATH = "ui-state.json"
const PANEL_PINNED_KEY = "panelPinned"
const DRAG_EDGE_PX = 24

function applyPinned(pinned: boolean) {
  return invoke("set_panel_pinned", { pinned }).catch(console.error)
}

const DRAG_EDGES: React.CSSProperties[] = [
  { top: 0, left: 0, right: 0, height: DRAG_EDGE_PX },
  { bottom: 0, left: 0, right: 0, height: DRAG_EDGE_PX },
  { top: 0, left: 0, bottom: 0, width: DRAG_EDGE_PX },
  { top: 0, right: 0, bottom: 0, width: DRAG_EDGE_PX },
]

export function PanelPinControl() {
  const pinned = useAppUiStore((state) => state.panelPinned)
  const setPinned = useAppUiStore((state) => state.setPanelPinned)
  const keepOnTaskbar = useAppPreferencesStore((state) => state.panelKeepOnTaskbar)

  useEffect(() => {
    if (isMacPlatform()) return

    const store = new LazyStore(UI_STATE_STORE_PATH)
    void store
      .get<boolean>(PANEL_PINNED_KEY)
      .then((value) => {
        if (!value) return
        setPinned(true)
        applyPinned(true)
      })
      .catch(console.error)
  }, [setPinned])

  if (isMacPlatform()) return null

  const handleToggle = () => {
    const next = !pinned
    setPinned(next)
    applyPinned(next)

    const store = new LazyStore(UI_STATE_STORE_PATH)
    void store
      .set(PANEL_PINNED_KEY, next)
      .then(() => store.save())
      .catch(console.error)
  }

  const draggable = pinned || keepOnTaskbar

  return (
    <>
      {draggable &&
        DRAG_EDGES.map((edge, index) => (
          <div
            key={index}
            data-tauri-drag-region
            style={{ position: "fixed", zIndex: 50, cursor: "grab", ...edge }}
          />
        ))}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={pinned ? "Unpin panel" : "Pin panel"}
        title={
          pinned
            ? "Unpin panel (return to tray dropdown)"
            : "Pin panel (keep open; drag the edges to move it)"
        }
        className={cn(
          "relative mx-1.5 flex items-center justify-center rounded-md p-2 transition-colors hover:bg-accent/55",
          pinned
            ? "bg-accent/70 text-foreground dark:bg-muted/70"
            : "text-muted-foreground"
        )}
      >
        {pinned ? <PinOff className="size-5" /> : <Pin className="size-5" />}
      </button>
    </>
  )
}
