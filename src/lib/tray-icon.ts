import { isMacPlatform } from "@/lib/platform"

/** macOS menu-bar icons are template glyphs; Windows/Linux use full-color PNGs. */
export function isTrayIconTemplate(): boolean {
  return isMacPlatform()
}
