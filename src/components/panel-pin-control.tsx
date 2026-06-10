import { useEffect, useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import { LazyStore } from "@tauri-apps/plugin-store"
import { Pin, PinOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { isMacPlatform } from "@/lib/platform"

const UI_STATE_STORE_PATH = "ui-state.json"
const PANEL_PINNED_KEY = "panelPinned"
// Matches the transparent p-6 margin around the card, so the drag frame never
// covers interactive content.
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

/**
 * Pin toggle rendered as a side-nav button (Windows/Linux only).
 * While pinned, the transparent margin around the card becomes a drag frame
 * so the panel can be moved anywhere on screen.
 */
export function PanelPinControl() {
  const [pinned, setPinned] = useState(false)

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
  }, [])

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

  return (
    <>
      {pinned &&
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
          "relative flex items-center justify-center w-full p-2.5 transition-colors hover:bg-accent",
          pinned ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {pinned ? <PinOff className="size-5" /> : <Pin className="size-5" />}
      </button>
    </>
  )
}
