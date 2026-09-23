import { CheckCircle2, Copy, Loader2, Monitor, Network, Split, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MACHINE_SOURCE_OPTIONS,
  type MachineSettings,
  type MachineSourceMode,
} from "@/lib/settings";
import { buildRemoteUsageUrl, cleanRemoteBaseUrl } from "@/lib/remote-usage-url";
import { cn } from "@/lib/utils";

type MachineSourcePlugin = {
  id: string;
  name: string;
  enabled: boolean;
};

interface MachineSourceSectionProps {
  settings: MachineSettings;
  plugins: MachineSourcePlugin[];
  onChange: (value: MachineSettings) => void;
}

const MODE_ICONS: Record<MachineSourceMode, typeof Monitor> = {
  local: Monitor,
  remote: Network,
  mixed: Split,
};

type RemoteTestState =
  | { status: "idle"; message: string }
  | { status: "checking"; message: string }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

async function copyText(value: string) {
  if (!navigator.clipboard) return;
  await navigator.clipboard.writeText(value);
}

export function MachineSourceSection({
  settings,
  plugins,
  onChange,
}: MachineSourceSectionProps) {
  const enabledPlugins = plugins.filter((plugin) => plugin.enabled);
  const remoteIds = new Set(settings.remotePluginIds);
  const [remoteTest, setRemoteTest] = useState<RemoteTestState>({
    status: "idle",
    message: "Not tested",
  });
  const remoteUsageUrl = buildRemoteUsageUrl(settings.remoteBaseUrl);
  const tunnelCommand = useMemo(() => {
    return "ssh -L 6737:127.0.0.1:6736 user@remote-machine";
  }, []);

  const update = (patch: Partial<MachineSettings>) => {
    onChange({
      ...settings,
      ...patch,
      setupComplete: true,
    });
    if ("remoteBaseUrl" in patch || "mode" in patch) {
      setRemoteTest({ status: "idle", message: "Not tested" });
    }
  };

  const toggleRemotePlugin = (id: string) => {
    const next = new Set(remoteIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    update({ remotePluginIds: Array.from(next) });
  };

  const testRemote = async () => {
    const usageUrl = buildRemoteUsageUrl(settings.remoteBaseUrl);
    if (!usageUrl) {
      setRemoteTest({ status: "error", message: "Enter a remote URL first" });
      return;
    }

    setRemoteTest({ status: "checking", message: "Checking..." });
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(usageUrl, { method: "GET", signal: controller.signal });
      if (!response.ok) {
        setRemoteTest({ status: "error", message: `HTTP ${response.status}` });
        return;
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        setRemoteTest({ status: "error", message: "Invalid response" });
        return;
      }
      setRemoteTest({
        status: "ok",
        message: `${data.length} provider${data.length === 1 ? "" : "s"} visible`,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setRemoteTest({ status: "error", message: "Remote timed out" });
        return;
      }
      setRemoteTest({ status: "error", message: "Cannot reach remote" });
    } finally {
      window.clearTimeout(timeout);
    }
  };

  return (
    <section>
      <h3 className="text-lg font-semibold mb-0">Machine Source</h3>
      <p className="text-sm text-muted-foreground mb-2">
        Choose whether each provider is checked on this computer or read from another
        Tokenmaxxing install.
      </p>
      <div className="bg-muted/50 rounded-lg p-1 space-y-2">
        <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label="Machine source">
          {MACHINE_SOURCE_OPTIONS.map((option) => {
            const Icon = MODE_ICONS[option.value];
            const isActive = option.value === settings.mode;
            return (
              <Button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="gap-1"
                onClick={() => update({ mode: option.value })}
              >
                <Icon className="size-3.5" />
                {option.label}
              </Button>
            );
          })}
        </div>

        {settings.mode !== "local" && (
          <div className="space-y-2 px-2 pb-1">
            <div className="block">
              <label
                htmlFor="machine-source-remote-url"
                className="text-xs font-medium text-muted-foreground"
              >
                Remote Tokenmaxxing URL
              </label>
              <div className="mt-1 flex gap-1">
                <input
                  id="machine-source-remote-url"
                  className={cn(
                    "h-8 min-w-0 flex-1 rounded-md border border-border bg-card px-2 text-sm text-foreground",
                    "placeholder:text-muted-foreground"
                  )}
                  placeholder="http://remote-machine:6737 or .../v1/usage"
                  value={settings.remoteBaseUrl}
                  onChange={(event) => update({ remoteBaseUrl: event.target.value })}
                  onBlur={(event) => update({ remoteBaseUrl: cleanRemoteBaseUrl(event.target.value) })}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={testRemote}
                  disabled={remoteTest.status === "checking"}
                >
                  {remoteTest.status === "checking" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Network className="size-3.5" />
                  )}
                  Test
                </Button>
              </div>
            </div>

            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                remoteTest.status === "ok" && "text-green-500",
                remoteTest.status === "error" && "text-destructive",
                (remoteTest.status === "idle" || remoteTest.status === "checking") &&
                  "text-muted-foreground"
              )}
            >
              {remoteTest.status === "ok" && <CheckCircle2 className="size-3.5" />}
              {remoteTest.status === "error" && <XCircle className="size-3.5" />}
              {remoteTest.status === "checking" && <Loader2 className="size-3.5 animate-spin" />}
              <span>{remoteTest.message}</span>
            </div>

            <div className="rounded-md border border-border bg-card/80 p-2 text-xs text-muted-foreground">
              <div className="mb-1 font-medium text-foreground">Remote setup</div>
              <div>
                Run Tokenmaxxing on the other machine, then expose it with the remote dashboard
                proxy or an SSH tunnel. Paste that URL here.
              </div>
              <div className="mt-2 flex items-center gap-1 rounded bg-muted px-2 py-1 font-mono text-[11px] text-foreground">
                <span className="min-w-0 flex-1 truncate">{tunnelCommand}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Copy SSH tunnel command"
                  onClick={() => copyText(tunnelCommand).catch(console.error)}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
              {remoteUsageUrl && (
                <div className="mt-1 truncate">
                  This app will read {remoteUsageUrl}.
                </div>
              )}
            </div>
          </div>
        )}

        {settings.mode === "mixed" && (
          <div className="px-2 pb-2">
            <div className="mb-1 text-xs font-medium text-muted-foreground">
              Choose which providers use the remote machine
            </div>
            {enabledPlugins.length === 0 ? (
              <div className="rounded-md border border-border bg-card/70 px-2 py-1.5 text-xs text-muted-foreground">
                Enable a provider first.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {enabledPlugins.map((plugin) => {
                  const isRemote = remoteIds.has(plugin.id);
                  const sourceLabel = isRemote ? "Remote" : "Local";
                  return (
                    <Button
                      key={plugin.id}
                      type="button"
                      aria-label={`${plugin.name}: ${sourceLabel}`}
                      variant={isRemote ? "default" : "outline"}
                      size="xs"
                      className="justify-start overflow-hidden"
                      onClick={() => toggleRemotePlugin(plugin.id)}
                    >
                      <span className="truncate">{plugin.name}</span>
                      <span className="ml-auto shrink-0 text-[10px] opacity-70">
                        {sourceLabel}
                      </span>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
