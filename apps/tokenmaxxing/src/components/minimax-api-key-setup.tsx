import { useEffect, useState } from "react"
import { KeyRound, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MINIMAX_API_KEY_ENV } from "@/lib/minimax-api-key"
import { hasPluginEnvValue, setPluginEnvValue } from "@/lib/plugin-env-secrets"
import { cn } from "@/lib/utils"

type MinimaxApiKeySetupProps = {
  error?: string | null
  onSaved?: () => void
}

export function MinimaxApiKeySetup({ error, onSaved }: MinimaxApiKeySetupProps) {
  const [apiKey, setApiKey] = useState("")
  const [checking, setChecking] = useState(true)
  const [needsKey, setNeedsKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setChecking(true)
    hasPluginEnvValue(MINIMAX_API_KEY_ENV)
      .then((hasKey) => {
        if (!cancelled) {
          setNeedsKey(!hasKey)
        }
      })
      .catch((err) => {
        console.error("Failed to check MiniMax API key:", err)
        if (!cancelled) {
          setNeedsKey(true)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setChecking(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [error])

  if (checking || !needsKey) {
    return null
  }

  const handleSave = async () => {
    const trimmed = apiKey.trim()
    if (!trimmed) {
      setSaveError("Enter your MiniMax API key")
      return
    }

    setSaving(true)
    setSaveError(null)
    try {
      await setPluginEnvValue(MINIMAX_API_KEY_ENV, trimmed)
      setNeedsKey(false)
      setApiKey("")
      onSaved?.()
    } catch (err) {
      console.error("Failed to save MiniMax API key:", err)
      setSaveError("Could not save API key")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mb-3 rounded-lg border border-border bg-muted/40 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
        <KeyRound className="size-4" />
        Connect MiniMax
      </div>
      <p className="mb-2 text-xs text-muted-foreground">
        Paste your MiniMax API key to load usage. It is stored locally on this machine.
      </p>
      <div className="flex gap-1">
        <input
          type="password"
          autoComplete="off"
          aria-label="MiniMax API key"
          className={cn(
            "h-8 min-w-0 flex-1 rounded-md border border-border bg-card px-2 text-sm text-foreground",
            "placeholder:text-muted-foreground"
          )}
          placeholder="MINIMAX_API_KEY"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void handleSave()
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          disabled={saving}
          onClick={() => {
            void handleSave()
          }}
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : "Save"}
        </Button>
      </div>
      {saveError && <div className="mt-2 text-xs text-destructive">{saveError}</div>}
    </section>
  )
}