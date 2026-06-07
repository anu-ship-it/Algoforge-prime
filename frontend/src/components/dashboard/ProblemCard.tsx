import { Problem } from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { DIFFICULTY_COLORS } from "../../lib/constants";
import clsx from "clsx";

interface ProblemCardProps {
  problem: Problem;
  onStart: (problemId: string) => void;
  isStarting?: boolean;
  isRecommended?: boolean;
}

export function ProblemCard({
  problem,
  onStart,
  isStarting = false,
  isRecommended = false,
}: ProblemCardProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between p-4 rounded-xl border transition-colors",
        isRecommended
          ? "bg-surface border-accent/50 hover:border-accent"
          : "bg-surface border-border hover:border-accent/40"
      )}
    >
      <div className="flex items-center gap-4 min-w-0">
        <span
          className={clsx(
            "text-xs font-medium w-14 shrink-0",
            DIFFICULTY_COLORS[problem.difficulty]
          )}
        >
          {problem.difficulty}
        </span>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-200 truncate">
              {problem.title}
            </span>
            {isRecommended && (
              <Badge variant="accent">recommended</Badge>
            )}
          </div>
          <span className="text-xs text-muted">{problem.topic}</span>
        </div>

        <div className="hidden md:flex gap-1 shrink-0">
          {(problem.company_tags || []).slice(0, 3).map((tag) => (
            <Badge key={tag} variant="default">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <Button
        size="sm"
        variant={isRecommended ? "primary" : "secondary"}
        onClick={() => onStart(problem.id)}
        isLoading={isStarting}
        className="shrink-0 ml-4"
      >
        {isStarting ? "Starting..." : "Start →"}
      </Button>
    </div>
  );
}
