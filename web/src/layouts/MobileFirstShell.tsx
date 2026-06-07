import { useEffect, useState, type ReactNode } from "react";
import { ConfigRail } from "../components/ConfigRail";
import { FullScreenOverlay } from "../components/FullScreenOverlay";
import { HotDotButton } from "../components/HotDotButton";
import { XRayTerminal } from "../components/XRayTerminal";
import { nextOverlay, type ActiveWindow } from "../hooks/useActiveWindow";
import { useRailLayout } from "../hooks/useRailLayout";
import { RailResizer } from "../components/RailResizer";

type Props = {
  title: string;
  portfolioStatus?: string;
  stubMode?: boolean;
  children: ReactNode;
};

export function MobileFirstShell({ title, portfolioStatus, stubMode, children }: Props) {
  const [desktop, setDesktop] = useState(false);
  const [active, setActive] = useState<ActiveWindow>("center");
  const rails = useRailLayout();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const headerSubtitle = portfolioStatus ? `PORTFOLIO STATUS: ${portfolioStatus}` : undefined;

  if (desktop) {
    return (
      <div className="flex h-screen min-h-0 flex-col bg-baic-bg">
        <header className="flex items-center justify-between gap-2 border-b border-baic-border bg-baic-panel px-2 py-2">
          <HotDotButton side="left" open={rails.leftOpen} onToggle={rails.toggleLeft} />
          <div className="min-w-0 flex-1 text-center">
            <div className="truncate text-sm font-bold text-cyan-300">{title}</div>
            {headerSubtitle && <div className="truncate text-[10px] text-gray-500">{headerSubtitle}</div>}
            {stubMode && <div className="text-[10px] text-amber-400">STUB MODE</div>}
          </div>
          <HotDotButton side="right" open={rails.rightOpen} onToggle={rails.toggleRight} />
        </header>
        <div className="flex min-h-0 flex-1">
          {rails.leftOpen && (
            <aside
              className="shrink-0 overflow-auto border-r border-baic-border bg-baic-panel/50 p-3"
              style={{ width: rails.leftWidth }}
            >
              <ConfigRail />
            </aside>
          )}
          {rails.leftOpen && (
            <RailResizer onMouseDown={(x) => rails.startResize("left", x)} />
          )}
          <main className="min-w-0 flex-1 overflow-auto">{children}</main>
          {rails.rightOpen && (
            <RailResizer onMouseDown={(x) => rails.startResize("right", x)} />
          )}
          {rails.rightOpen && (
            <aside
              className="shrink-0 overflow-auto border-l border-baic-border bg-black/40 p-2"
              style={{ width: rails.rightWidth }}
            >
              <XRayTerminal enabled />
            </aside>
          )}
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
        <div className="min-w-0 truncate text-center text-xs font-bold text-cyan-300">
          {title}
          {headerSubtitle && <span className="block truncate text-[10px] font-normal text-gray-500">{headerSubtitle}</span>}
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
