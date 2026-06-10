import { cleanup, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { defaultSettingsPageProps } from "@/pages/settings-page-test-shared"

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  closestCenter: vi.fn(),
  PointerSensor: class {},
  KeyboardSensor: class {},
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}))

vi.mock("@dnd-kit/sortable", () => ({
  arrayMove: vi.fn(),
  SortableContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  verticalListSortingStrategy: vi.fn(),
}))

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => "" } },
}))

import { SettingsPage } from "@/pages/settings"

afterEach(() => {
  cleanup()
})

describe("SettingsPage display", () => {
  it("updates auto-update interval", async () => {
    const onAutoUpdateIntervalChange = vi.fn()
    render(
      <SettingsPage
        {...defaultSettingsPageProps}
        onAutoUpdateIntervalChange={onAutoUpdateIntervalChange}
      />
    )
    await userEvent.click(screen.getByText("30 min"))
    expect(onAutoUpdateIntervalChange).toHaveBeenCalledWith(30)
  })

  it("shows auto-update helper text", () => {
    render(<SettingsPage {...defaultSettingsPageProps} />)
    expect(screen.getByText("How obsessive are you")).toBeInTheDocument()
  })

  it("renders app theme section with theme options", () => {
    render(<SettingsPage {...defaultSettingsPageProps} />)
    expect(screen.getByText("App Theme")).toBeInTheDocument()
    expect(screen.getByText("How it looks around here")).toBeInTheDocument()
    expect(screen.getByText("System")).toBeInTheDocument()
    expect(screen.getByText("Light")).toBeInTheDocument()
    expect(screen.getByText("Dark")).toBeInTheDocument()
  })

  it("updates theme mode", async () => {
    const onThemeModeChange = vi.fn()
    render(
      <SettingsPage
        {...defaultSettingsPageProps}
        onThemeModeChange={onThemeModeChange}
      />
    )
    await userEvent.click(screen.getByText("Dark"))
    expect(onThemeModeChange).toHaveBeenCalledWith("dark")
  })

  it("updates display mode", async () => {
    const onDisplayModeChange = vi.fn()
    render(
      <SettingsPage
        {...defaultSettingsPageProps}
        onDisplayModeChange={onDisplayModeChange}
      />
    )
    await userEvent.click(screen.getByRole("radio", { name: "Left" }))
    expect(onDisplayModeChange).toHaveBeenCalledWith("left")
  })

  it("updates reset timer display mode", async () => {
    const onResetTimerDisplayModeChange = vi.fn()
    render(
      <SettingsPage
        {...defaultSettingsPageProps}
        onResetTimerDisplayModeChange={onResetTimerDisplayModeChange}
      />
    )
    await userEvent.click(screen.getByRole("radio", { name: /Absolute/ }))
    expect(onResetTimerDisplayModeChange).toHaveBeenCalledWith("absolute")
  })

  it("renders renamed usage section heading", () => {
    render(<SettingsPage {...defaultSettingsPageProps} />)
    expect(screen.getByText("Usage Mode")).toBeInTheDocument()
  })

  it("renders reset timers section heading", () => {
    render(<SettingsPage {...defaultSettingsPageProps} />)
    expect(screen.getByText("Reset Timers")).toBeInTheDocument()
  })

  it("renders time format section heading", () => {
    render(<SettingsPage {...defaultSettingsPageProps} />)
    expect(screen.getByText("Time Format")).toBeInTheDocument()
    expect(screen.getByText("12-hour or 24-hour clock")).toBeInTheDocument()
  })

  it("updates time format mode to 12h", async () => {
    const onTimeFormatModeChange = vi.fn()
    render(
      <SettingsPage
        {...defaultSettingsPageProps}
        onTimeFormatModeChange={onTimeFormatModeChange}
      />
    )
    await userEvent.click(screen.getByRole("radio", { name: "12-hour" }))
    expect(onTimeFormatModeChange).toHaveBeenCalledWith("12h")
  })

  it("updates time format mode to 24h", async () => {
    const onTimeFormatModeChange = vi.fn()
    render(
      <SettingsPage
        {...defaultSettingsPageProps}
        onTimeFormatModeChange={onTimeFormatModeChange}
      />
    )
    await userEvent.click(screen.getByRole("radio", { name: "24-hour" }))
    expect(onTimeFormatModeChange).toHaveBeenCalledWith("24h")
  })

  it("renders menubar icon section", () => {
    render(<SettingsPage {...defaultSettingsPageProps} />)
    expect(screen.getByText("Menubar Icon")).toBeInTheDocument()
    expect(screen.getByText("What shows in the menu bar")).toBeInTheDocument()
  })

  it("clicking Bars triggers onMenubarIconStyleChange(\"bars\")", async () => {
    const onMenubarIconStyleChange = vi.fn()
    render(
      <SettingsPage
        {...defaultSettingsPageProps}
        onMenubarIconStyleChange={onMenubarIconStyleChange}
      />
    )
    await userEvent.click(screen.getByRole("radio", { name: "Bars" }))
    expect(onMenubarIconStyleChange).toHaveBeenCalledWith("bars")
  })

  it("clicking Donut triggers onMenubarIconStyleChange(\"donut\")", async () => {
    const onMenubarIconStyleChange = vi.fn()
    render(
      <SettingsPage
        {...defaultSettingsPageProps}
        onMenubarIconStyleChange={onMenubarIconStyleChange}
      />
    )
    await userEvent.click(screen.getByRole("radio", { name: "Donut" }))
    expect(onMenubarIconStyleChange).toHaveBeenCalledWith("donut")
  })

  it("renders the menubar metric control", () => {
    render(<SettingsPage {...defaultSettingsPageProps} />)
    expect(screen.getByText("Metric")).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "Default" })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "Weekly" })).toBeInTheDocument()
  })

  it("clicking Weekly triggers onMenubarMetricChange(\"weekly\")", async () => {
    const onMenubarMetricChange = vi.fn()
    render(
      <SettingsPage
        {...defaultSettingsPageProps}
        onMenubarMetricChange={onMenubarMetricChange}
      />
    )
    await userEvent.click(screen.getByRole("radio", { name: "Weekly" }))
    expect(onMenubarMetricChange).toHaveBeenCalledWith("weekly")
  })

  it("does not render removed bar icon controls", () => {
    render(<SettingsPage {...defaultSettingsPageProps} />)
    expect(screen.queryByText("Bar Icon")).not.toBeInTheDocument()
    expect(screen.queryByText("Show percentage")).not.toBeInTheDocument()
  })

  it("toggles start on login checkbox", async () => {
    const onStartOnLoginChange = vi.fn()
    render(
      <SettingsPage
        {...defaultSettingsPageProps}
        onStartOnLoginChange={onStartOnLoginChange}
      />
    )
    await userEvent.click(screen.getByText("Start on login"))
    expect(onStartOnLoginChange).toHaveBeenCalledWith(true)
  })
})