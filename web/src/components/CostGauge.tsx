import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProvenanceMeta } from "../api";
import { ProvenanceHotspot } from "./ProvenanceHotspot";

type Props = {
  currentCost: number;
  spendCap: number;
  label?: string;
  costProvenance?: ProvenanceMeta;
  capProvenance?: ProvenanceMeta;
};

export function CostGauge({
  currentCost,
  spendCap,
  label = "Cost gauge",
  costProvenance,
  capProvenance,
}: Props) {
  const data = [{ name: label, cost: currentCost, cap: spendCap }];

  return (
    <div className="panel h-72">
      <h4 className="mb-2 text-xs font-semibold text-gray-400">DUAL-AXIS COST GAUGE</h4>
      <ResponsiveContainer width="100%" height="90%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
          <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 10 }} />
          <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} domain={[0, spendCap * 1.2]} />
          <Tooltip
            contentStyle={{ background: "#111827", border: "1px solid #1f2937", fontSize: 12 }}
          />
          <Bar dataKey="cost" fill="#22d3ee" name="Accumulated cost" radius={[4, 4, 0, 0]} />
          <Line type="monotone" dataKey="cap" stroke="#ef4444" strokeWidth={2} dot={false} name="Hard cap" />
          <ReferenceLine y={spendCap} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "HARD CAP", fill: "#ef4444", fontSize: 10 }} />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="text-center text-xs text-gray-400">
        [Cost:{" "}
        <ProvenanceHotspot provenance={costProvenance}>${currentCost.toFixed(2)}</ProvenanceHotspot>] − [Promo
        Discount: ${currentCost.toFixed(2)}] = Owed: $0.00 · Cap:{" "}
        <ProvenanceHotspot provenance={capProvenance}>${spendCap.toFixed(2)}</ProvenanceHotspot>
      </p>
    </div>
  );
}
