import { useEffect, useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import { LazyStore } from "@tauri-apps/plugin-store"
import { Pin, PinOff } from "lucide-react"
import { Button } from "@/components/ui/button"

function isMac() {
  return (
    navigator.userAgent.includes("Mac OS X") ||
    navigator.userAgent.includes("Macintosh")
  )
}

const UI_STATE_STORE_PATH = "ui-state.json"
const PANEL_PINNED_KEY = "panelPinned"

function applyPinned(pinned: boolean) {
  return invoke("set_panel_pinned", { pinned }).catch(console.error)
}

export function PanelPinControl() {
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    if (isMac()) return

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

  if (isMac()) return null

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
      {pinned && (
        <div
          data-tauri-drag-region
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 48,
            height: 24,
            zIndex: 50,
            cursor: "grab",
          }}
        />
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        aria-label={pinned ? "Unpin panel" : "Pin panel"}
        title={pinned ? "Unpin panel" : "Pin panel"}
        style={{ position: "fixed", top: 4, right: 8, zIndex: 51 }}
      >
        {pinned ? <PinOff /> : <Pin />}
      </Button>
    </>
  )
}