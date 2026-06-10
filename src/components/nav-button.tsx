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
        "relative flex items-center justify-center w-full p-2.5 transition-colors",
        "hover:bg-accent",
        isActive
          ? "text-foreground before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-primary dark:before:bg-page-accent before:rounded-full"
          : "text-muted-foreground"
      )}
    >
      {children}
    </button>
  )
}