import { cn } from "@/lib/utils"

interface NavButtonProps {
  isActive: boolean
  onClick: () => void
  onContextMenu?: (e: React.MouseEvent) => void
  children: React.ReactNode
  "aria-label"?: string
}

export function NavButton({
  isActive,
  onClick,
  onContextMenu,
  children,
  "aria-label": ariaLabel,
}: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onContextMenu={onContextMenu}
      aria-label={ariaLabel}
      className={cn(
        "relative mx-1.5 flex items-center justify-center rounded-md p-2 transition-colors",
        "hover:bg-accent/55",
        isActive
          ? "bg-accent/70 text-foreground dark:bg-muted/70"
          : "text-muted-foreground"
      )}
    >
      {children}
    </button>
  )
}
