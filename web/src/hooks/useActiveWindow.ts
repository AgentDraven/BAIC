export type ActiveWindow = "center" | "left" | "right";

export function nextOverlay(current: ActiveWindow, target: "left" | "right"): ActiveWindow {
  if (current === target) return "center";
  return target;
}
