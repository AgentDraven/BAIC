import { Checkbox } from "@/components/ui/checkbox";
import { isMacPlatform } from "@/lib/platform";

interface PinnedPanelSectionProps {
  panelStayOpenWhenPinned: boolean;
  onPanelStayOpenWhenPinnedChange: (value: boolean) => void;
  panelKeepOnTaskbar: boolean;
  onPanelKeepOnTaskbarChange: (value: boolean) => void;
}

export function PinnedPanelSection({
  panelStayOpenWhenPinned,
  onPanelStayOpenWhenPinnedChange,
  panelKeepOnTaskbar,
  onPanelKeepOnTaskbarChange,
}: PinnedPanelSectionProps) {
  if (isMacPlatform()) return null;

  return (
    <section>
      <h3 className="text-lg font-semibold mb-0">Pinned Panel</h3>
      <p className="text-sm text-muted-foreground mb-2">
        Widget mode stays pinned when you hide the panel
      </p>
      <label className="flex items-center gap-2 text-sm select-none text-foreground">
        <Checkbox
          key={`panel-stay-open-${panelStayOpenWhenPinned}`}
          checked={panelStayOpenWhenPinned}
          onCheckedChange={(checked) =>
            onPanelStayOpenWhenPinnedChange(checked === true)
          }
        />
        Keep open while pinned
      </label>
      <p className="text-xs text-muted-foreground mt-1.5">
        Off: click away to hide, but stay pinned. On: pinned panel ignores click-away.
      </p>
      <label className="flex items-center gap-2 text-sm select-none text-foreground mt-3">
        <Checkbox
          key={`panel-keep-on-taskbar-${panelKeepOnTaskbar}`}
          checked={panelKeepOnTaskbar}
          onCheckedChange={(checked) =>
            onPanelKeepOnTaskbarChange(checked === true)
          }
        />
        Keep on taskbar
      </label>
      <p className="text-xs text-muted-foreground mt-1.5">
        On: dismissing the panel minimizes it, so the taskbar button stays while Tokenmaxxing runs. Off: the panel hides completely.
      </p>
    </section>
  );
}

interface StartOnLoginSectionProps {
  startOnLogin: boolean;
  onStartOnLoginChange: (value: boolean) => void;
}

export function StartOnLoginSection({
  startOnLogin,
  onStartOnLoginChange,
}: StartOnLoginSectionProps) {
  return (
    <section>
      <h3 className="text-lg font-semibold mb-0">Start on Login</h3>
      <p className="text-sm text-muted-foreground mb-2">
        Tokenmaxxing starts when you sign in
      </p>
      <label className="flex items-center gap-2 text-sm select-none text-foreground">
        <Checkbox
          key={`start-on-login-${startOnLogin}`}
          checked={startOnLogin}
          onCheckedChange={(checked) => onStartOnLoginChange(checked === true)}
        />
        Start on login
      </label>
    </section>
  );
}