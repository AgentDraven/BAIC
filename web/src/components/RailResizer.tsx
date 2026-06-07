type ResizerProps = {
  onMouseDown: (clientX: number) => void;
};

export function RailResizer({ onMouseDown }: ResizerProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className="group relative w-1 shrink-0 cursor-col-resize bg-baic-border/60 hover:bg-cyan-500/40"
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown(e.clientX);
      }}
    >
      <div className="absolute inset-y-0 -left-1 -right-1" />
    </div>
  );
}
