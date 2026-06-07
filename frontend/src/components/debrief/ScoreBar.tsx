import clsx from "clsx";

interface ScoreBarProps {
  label: string;
  score: number;
  showLabel?: boolean;
}

export function ScoreBar({ label, score, showLabel = true }: ScoreBarProps) {
  const color =
    score >= 70 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-danger";

  const textColor =
    score >= 70
      ? "text-success"
      : score >= 50
      ? "text-warning"
      : "text-danger";

  return (
    <div>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-muted">{label}</span>
          <span className={clsx("text-sm font-mono font-medium", textColor)}>
            {score}
            <span className="text-muted font-normal">/100</span>
          </span>
        </div>
      )}
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-700",
            color
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
