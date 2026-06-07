import { Session } from "../../types";
import { Badge } from "../ui/Badge";

interface ProblemPaneProps {
  session: Session;
}

export function ProblemPane({ session }: ProblemPaneProps) {
  const difficulty = session.problem_difficulty as "easy" | "medium" | "hard";

  return (
    <div className="p-4 border-b border-border bg-surface overflow-y-auto max-h-48">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-sm font-medium text-gray-200">
          {session.problem_title}
        </h2>
        {difficulty && (
          <Badge variant={difficulty}>{difficulty}</Badge>
        )}
        {session.problem_topic && (
          <Badge variant="default">{session.problem_topic}</Badge>
        )}
      </div>

      <p className="text-xs text-gray-300 leading-relaxed mb-2">
        {session.problem_description}
      </p>

      {session.problem_constraints && (
        <p className="text-xs text-muted">
          <span className="text-gray-400 font-medium">Constraints: </span>
          {session.problem_constraints}
        </p>
      )}

      {session.problem_hints && session.problem_hints.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-accent cursor-pointer hover:text-white transition-colors">
            Show hints ({session.problem_hints.length})
          </summary>
          <ul className="mt-1 space-y-1">
            {session.problem_hints.map((hint, i) => (
              <li key={i} className="text-xs text-muted pl-2 border-l border-border">
                {hint}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
