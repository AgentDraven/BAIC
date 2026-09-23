const { cpSync, readdirSync, rmSync } = require("fs")
const { join } = require("path")

const root = __dirname
// "antigravity" is macOS-only (reads the macOS keychain + ~/Library paths) and
// carries Antigravity's public OAuth constants — deferred ("pending") for the
// cross-platform port. Re-include it once a cross-platform auth path exists.
const exclude = new Set(["mock", "antigravity"])
const srcDir = join(root, "plugins")
const dstDir = join(root, "src-tauri", "resources", "bundled_plugins")

rmSync(dstDir, { recursive: true, force: true })

const plugins = readdirSync(srcDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !exclude.has(d.name))
  .map((d) => d.name)

for (const id of plugins) {
  cpSync(join(srcDir, id), join(dstDir, id), { recursive: true })
}

console.log(`Bundled ${plugins.length} plugins: ${plugins.join(", ")}`)
