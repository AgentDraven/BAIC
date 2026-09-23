import { Button } from "@/components/ui/button";
import { MenubarIconStylePreview } from "@/components/settings/menubar-icon-preview";
import {
  MENUBAR_ICON_STYLE_OPTIONS,
  MENUBAR_METRIC_OPTIONS,
  type MenubarIconStyle,
  type MenubarMetric,
} from "@/lib/settings";
import type { TraySettingsPreview } from "@/hooks/app/use-tray-icon";

interface MenubarSectionProps {
  menubarIconStyle: MenubarIconStyle;
  onMenubarIconStyleChange: (value: MenubarIconStyle) => void;
  menubarMetric: MenubarMetric;
  onMenubarMetricChange: (value: MenubarMetric) => void;
  traySettingsPreview: TraySettingsPreview;
}

export function MenubarSection({
  menubarIconStyle,
  onMenubarIconStyleChange,
  menubarMetric,
  onMenubarMetricChange,
  traySettingsPreview,
}: MenubarSectionProps) {
  return (
    <section>
      <h3 className="text-lg font-semibold mb-0">Menubar Icon</h3>
      <p className="text-sm text-muted-foreground mb-2">
        What shows in the menu bar
      </p>
      <div className="bg-muted/50 rounded-lg p-1">
        <div className="flex gap-1" role="radiogroup" aria-label="Menubar icon style">
          {MENUBAR_ICON_STYLE_OPTIONS.map((option) => {
            const isActive = option.value === menubarIconStyle;
            return (
              <Button
                key={option.value}
                type="button"
                role="radio"
                aria-label={option.label}
                aria-checked={isActive}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="flex-1 h-9 flex items-center justify-center"
                onClick={() => onMenubarIconStyleChange(option.value)}
              >
                <MenubarIconStylePreview
                  style={option.value}
                  isActive={isActive}
                  traySettingsPreview={traySettingsPreview}
                />
              </Button>
            );
          })}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-3 mb-2">Metric</p>
      <div className="bg-muted/50 rounded-lg p-1">
        <div className="flex gap-1" role="radiogroup" aria-label="Menubar metric">
          {MENUBAR_METRIC_OPTIONS.map((option) => {
            const isActive = option.value === menubarMetric;
            return (
              <Button
                key={option.value}
                type="button"
                role="radio"
                aria-label={option.label}
                aria-checked={isActive}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => onMenubarMetricChange(option.value)}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
}