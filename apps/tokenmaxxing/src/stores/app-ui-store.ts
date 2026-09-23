import { create } from "zustand"
import type { ActiveView } from "@/components/side-nav"

type AppUiStore = {
  activeView: ActiveView
  showAbout: boolean
  panelPinned: boolean
  setActiveView: (view: ActiveView) => void
  setShowAbout: (value: boolean) => void
  setPanelPinned: (value: boolean) => void
  resetState: () => void
}

const initialState = {
  activeView: "home" as ActiveView,
  showAbout: false,
}

export const useAppUiStore = create<AppUiStore>((set) => ({
  ...initialState,
  panelPinned: false,
  setActiveView: (view) => set({ activeView: view }),
  setShowAbout: (value) => set({ showAbout: value }),
  setPanelPinned: (value) => set({ panelPinned: value }),
  resetState: () => set(initialState),
}))