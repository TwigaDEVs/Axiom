import { formatConfidence } from "../utils/constants";

interface Props {
  confidence: number; // basis points 0-10000
}

export default function ConfidenceBar({ confidence }: Props) {
  const pct = confidence / 100;
  const color =
    confidence >= 8500
      ? "bg-success text-success"
      : confidence >= 7000
      ? "bg-warning text-warning"
      : "bg-danger text-danger";

  return (
    <div className="w-full">
      <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color.split(" ")[0]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-xs font-mono font-semibold mt-1 ${color.split(" ")[1]}`}>
        {formatConfidence(confidence)}
      </p>
    </div>
  );
}
