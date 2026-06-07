import { HIRE_LABELS } from "../../lib/constants";
import clsx from "clsx";

interface VerdictCardProps {
  hireRecommendation: string;
  overallScore: number;
}

export function VerdictCard({ hireRecommendation, overallScore }: VerdictCardProps) {
  const verdict =
    HIRE_LABELS[hireRecommendation as keyof typeof HIRE_LABELS] ||
    HIRE_LABELS.no_hire;

  return (
    <div className="flex gap-4 mb-8">
      {/* Hire verdict */}
      <div
        className={clsx(
          "flex-1 border rounded-xl p-6",
          verdict.bg
        )}
      >
        <div className="text-xs text-muted mb-2">Interviewer verdict</div>
        <div className={clsx("text-2xl font-semibold", verdict.color)}>
          {verdict.label}
        </div>
      </div>

      {/* Overall score */}
      <div className="flex-1 bg-surface border border-border rounded-xl p-6">
        <div className="text-xs text-muted mb-2">Overall score</div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold font-mono">
            {overallScore}
          </span>
          <span className="text-muted text-sm">/100</span>
        </div>
      </div>
    </div>
  );
}
