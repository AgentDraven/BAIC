import { useEffect, useState, type ReactNode } from "react";
import { ConfigRail } from "../components/ConfigRail";
import { FullScreenOverlay } from "../components/FullScreenOverlay";
import { HotDotButton } from "../components/HotDotButton";
import { XRayTerminal } from "../components/XRayTerminal";
import { nextOverlay, type ActiveWindow } from "../hooks/useActiveWindow";

type Props = {
  title: string;
  stubMode?: boolean;
  children: ReactNode;
};

export function MobileFirstShell({ title, stubMode, children }: Props) {
  const [desktop, setDesktop] = useState(false);
  const [active, setActive] = useState<ActiveWindow>("center");

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  if (desktop) {
    return (
      <div className="flex h-screen min-h-0 flex-col bg-baic-bg">
        <header className="border-b border-baic-border bg-baic-panel px-4 py-2 text-sm font-bold text-cyan-300">
          {title}
          {stubMode && <span className="ml-2 text-xs text-amber-400">STUB MODE</span>}
        </header>
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(220px,288px)_1fr_minmax(320px,460px)]">
          <aside className="overflow-auto border-r border-baic-border bg-baic-panel/50 p-3">
            <ConfigRail />
          </aside>
          <main className="min-w-0 overflow-auto">{children}</main>
          <aside className="overflow-auto border-l border-baic-border bg-black/40 p-2">
            <XRayTerminal enabled />
          </aside>
        </div>
      </div>
    );
  }

  const toggleLeft = () => setActive((a) => nextOverlay(a, "left"));
  const toggleRight = () => setActive((a) => nextOverlay(a, "right"));

  return (
    <div className="relative min-h-screen bg-baic-bg">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-baic-border bg-baic-panel px-2 py-2">
        <HotDotButton side="left" open={active === "left"} onToggle={toggleLeft} />
        <div className="truncate text-center text-xs font-bold text-cyan-300">
          {title}
          {stubMode && <span className="block text-[10px] text-amber-400">STUB</span>}
        </div>
        <HotDotButton side="right" open={active === "right"} onToggle={toggleRight} />
      </header>

      <main className="relative z-0">{children}</main>

      <FullScreenOverlay
        title="Config"
        side="left"
        visible={active === "left"}
        onClose={() => setActive("center")}
      >
        <ConfigRail />
      </FullScreenOverlay>

      <FullScreenOverlay
        title="X-Ray Terminal"
        side="right"
        visible={active === "right"}
        onClose={() => setActive("center")}
      >
        <XRayTerminal enabled={active === "right"} />
      </FullScreenOverlay>
    </div>
  );
}
