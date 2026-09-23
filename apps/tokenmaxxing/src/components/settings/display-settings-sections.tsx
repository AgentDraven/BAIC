import { Button } from "@/components/ui/button";
import { getTimeFormatter } from "@/lib/reset-tooltip";
import {
  AUTO_UPDATE_OPTIONS,
  DISPLAY_MODE_OPTIONS,
  RESET_TIMER_DISPLAY_OPTIONS,
  TIME_FORMAT_OPTIONS,
  type AutoUpdateIntervalMinutes,
  type DisplayMode,
  type ResetTimerDisplayMode,
  type TimeFormatMode,
} from "@/lib/settings";
import { cn } from "@/lib/utils";

interface AutoRefreshSectionProps {
  autoUpdateInterval: AutoUpdateIntervalMinutes;
  onAutoUpdateIntervalChange: (value: AutoUpdateIntervalMinutes) => void;
}

export function AutoRefreshSection({
  autoUpdateInterval,
  onAutoUpdateIntervalChange,
}: AutoRefreshSectionProps) {
  return (
    <section>
      <h3 className="text-lg font-semibold mb-0">Auto Refresh</h3>
      <p className="text-sm text-muted-foreground mb-2">
        How obsessive are you
      </p>
      <div className="bg-muted/50 rounded-lg p-1">
        <div className="flex gap-1" role="radiogroup" aria-label="Auto-update interval">
          {AUTO_UPDATE_OPTIONS.map((option) => {
            const isActive = option.value === autoUpdateInterval;
            return (
              <Button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => onAutoUpdateIntervalChange(option.value)}
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

interface UsageModeSectionProps {
  displayMode: DisplayMode;
  onDisplayModeChange: (value: DisplayMode) => void;
}

export function UsageModeSection({
  displayMode,
  onDisplayModeChange,
}: UsageModeSectionProps) {
  return (
    <section>
      <h3 className="text-lg font-semibold mb-0">Usage Mode</h3>
      <p className="text-sm text-muted-foreground mb-2">
        Glass half full or half empty
      </p>
      <div className="bg-muted/50 rounded-lg p-1">
        <div className="flex gap-1" role="radiogroup" aria-label="Usage display mode">
          {DISPLAY_MODE_OPTIONS.map((option) => {
            const isActive = option.value === displayMode;
            return (
              <Button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => onDisplayModeChange(option.value)}
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

interface ResetTimersSectionProps {
  resetTimerDisplayMode: ResetTimerDisplayMode;
  timeFormatMode: TimeFormatMode;
  onResetTimerDisplayModeChange: (value: ResetTimerDisplayMode) => void;
}

export function ResetTimersSection({
  resetTimerDisplayMode,
  timeFormatMode,
  onResetTimerDisplayModeChange,
}: ResetTimersSectionProps) {
  return (
    <section>
      <h3 className="text-lg font-semibold mb-0">Reset Timers</h3>
      <p className="text-sm text-muted-foreground mb-2">
        Countdown or clock time
      </p>
      <div className="bg-muted/50 rounded-lg p-1">
        <div className="flex gap-1" role="radiogroup" aria-label="Reset timer display mode">
          {RESET_TIMER_DISPLAY_OPTIONS.map((option) => {
            const isActive = option.value === resetTimerDisplayMode;
            const absoluteTimeExample = getTimeFormatter(timeFormatMode).format(new Date(2026, 1, 2, 11, 4));
            const example = option.value === "relative" ? "5h 12m" : `today at ${absoluteTimeExample}`;
            return (
              <Button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="flex-1 flex flex-col items-center gap-0 py-2 h-auto"
                onClick={() => onResetTimerDisplayModeChange(option.value)}
              >
                <span>{option.label}</span>
                <span
                  className={cn(
                    "text-xs font-normal",
                    isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  {example}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

interface TimeFormatSectionProps {
  timeFormatMode: TimeFormatMode;
  onTimeFormatModeChange: (value: TimeFormatMode) => void;
}

export function TimeFormatSection({
  timeFormatMode,
  onTimeFormatModeChange,
}: TimeFormatSectionProps) {
  return (
    <section>
      <h3 className="text-lg font-semibold mb-0">Time Format</h3>
      <p className="text-sm text-muted-foreground mb-2">
        12-hour or 24-hour clock
      </p>
      <div className="bg-muted/50 rounded-lg p-1">
        <div className="flex gap-1" role="radiogroup" aria-label="Time format">
          {TIME_FORMAT_OPTIONS.map((option) => {
            const isActive = option.value === timeFormatMode;
            const example = getTimeFormatter(option.value).format(new Date(2026, 1, 2, 11, 4));
            return (
              <Button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                aria-label={option.label}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="flex-1 flex flex-col items-center gap-0 py-2 h-auto"
                onClick={() => onTimeFormatModeChange(option.value)}
              >
                <span>{option.label}</span>
                <span
                  className={cn(
                    "text-xs font-normal",
                    isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  {example}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
}