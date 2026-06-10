import { Button } from "@/components/ui/button";
import { THEME_OPTIONS, type ThemeMode } from "@/lib/settings";

interface ThemeSectionProps {
  themeMode: ThemeMode;
  onThemeModeChange: (value: ThemeMode) => void;
}

export function ThemeSection({ themeMode, onThemeModeChange }: ThemeSectionProps) {
  return (
    <section>
      <h3 className="text-lg font-semibold mb-0">App Theme</h3>
      <p className="text-sm text-muted-foreground mb-2">
        How it looks around here
      </p>
      <div className="bg-muted/50 rounded-lg p-1">
        <div className="flex gap-1" role="radiogroup" aria-label="Theme mode">
          {THEME_OPTIONS.map((option) => {
            const isActive = option.value === themeMode;
            return (
              <Button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => onThemeModeChange(option.value)}
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