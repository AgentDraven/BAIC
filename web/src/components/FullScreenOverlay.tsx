import type { ReactNode } from "react";

type Props = {
  title: string;
  side: "left" | "right";
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

/** Non-modal full-viewport layer (MERIT §II.J — not blocking center). */
export function FullScreenOverlay({ title, side, visible, onClose, children }: Props) {
  if (!visible) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex flex-col bg-baic-bg"
      role="complementary"
      aria-label={`${side} overlay`}
    >
      <header className="flex items-center justify-between border-b border-baic-border bg-baic-panel px-4 py-3">
        <h2 className="text-sm font-bold text-cyan-300">{title}</h2>
        <button type="button" className="text-xs text-cyan-400 hover:underline" onClick={onClose}>
          Close
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
