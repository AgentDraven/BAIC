type Props = {
  side: "left" | "right";
  open: boolean;
  onToggle: () => void;
  leftLabel?: string;
  rightLabel?: string;
};

export function HotDotButton({ side, open, onToggle, leftLabel = "Config", rightLabel = "X-Ray" }: Props) {
  const label =
    side === "left"
      ? open
        ? `${leftLabel} <`
        : `> ${leftLabel}`
      : open
        ? `< ${rightLabel}`
        : `${rightLabel} >`;

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onToggle}
      className="flex h-11 min-w-[44px] items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 text-[10px] font-semibold text-cyan-300 shadow-lg hover:bg-cyan-500/20"
    >
      <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-cyan-400" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
