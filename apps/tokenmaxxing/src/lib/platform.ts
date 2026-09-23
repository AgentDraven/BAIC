/** True when running on macOS (menu-bar NSPanel backend). */
export function isMacPlatform(): boolean {
  return (
    navigator.userAgent.includes("Mac OS X") ||
    navigator.userAgent.includes("Macintosh")
  )
}
