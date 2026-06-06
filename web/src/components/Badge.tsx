type Props = { status: string };

export function Badge({ status }: Props) {
  const cls =
    status === "ACTIVE_FREE" || status === "ACTIVE"
      ? "badge-active"
      : status === "CANCELED_ACTIVE"
        ? "badge-canceled"
        : "badge-unclaimed";
  const label = status.replace(/_/g, " ");
  return <span className={cls}>{label}</span>;
}
