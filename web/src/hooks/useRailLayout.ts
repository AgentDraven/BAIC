import { useCallback, useEffect, useState } from "react";

type RailDefaults = {
  left_width_px: number;
  right_width_px: number;
  left_min_px: number;
  left_max_px: number;
  right_min_px: number;
  right_max_px: number;
};

const STORAGE_KEY = "baic.rail.layout";

const DEFAULTS: RailDefaults = {
  left_width_px: 288,
  right_width_px: 460,
  left_min_px: 220,
  left_max_px: 560,
  right_min_px: 320,
  right_max_px: 820,
};

type Stored = {
  leftOpen: boolean;
  rightOpen: boolean;
  leftWidth: number;
  rightWidth: number;
};

function loadStored(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Stored>;
      return {
        leftOpen: parsed.leftOpen ?? true,
        rightOpen: parsed.rightOpen ?? true,
        leftWidth: parsed.leftWidth ?? DEFAULTS.left_width_px,
        rightWidth: parsed.rightWidth ?? DEFAULTS.right_width_px,
      };
    }
  } catch {
    /* ignore */
  }
  return {
    leftOpen: true,
    rightOpen: true,
    leftWidth: DEFAULTS.left_width_px,
    rightWidth: DEFAULTS.right_width_px,
  };
}

export function useRailLayout(defaults: Partial<RailDefaults> = {}) {
  const limits = { ...DEFAULTS, ...defaults };
  const [stored, setStored] = useState<Stored>(loadStored);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }, [stored]);

  const toggleLeft = useCallback(() => {
    setStored((s) => ({ ...s, leftOpen: !s.leftOpen }));
  }, []);

  const toggleRight = useCallback(() => {
    setStored((s) => ({ ...s, rightOpen: !s.rightOpen }));
  }, []);

  const startResize = useCallback(
    (side: "left" | "right", startX: number) => {
      const startWidth = side === "left" ? stored.leftWidth : stored.rightWidth;

      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX;
        if (side === "left") {
          const next = Math.min(limits.left_max_px, Math.max(limits.left_min_px, startWidth + delta));
          setStored((s) => ({ ...s, leftWidth: next }));
        } else {
          const next = Math.min(limits.right_max_px, Math.max(limits.right_min_px, startWidth - delta));
          setStored((s) => ({ ...s, rightWidth: next }));
        }
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [stored.leftWidth, stored.rightWidth, limits]
  );

  return { ...stored, limits, toggleLeft, toggleRight, startResize };
}
