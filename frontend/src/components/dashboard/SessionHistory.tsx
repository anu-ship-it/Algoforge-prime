import Link from "next/link";
import { SessionListItem } from "../../types";
import { DIFFICULTY_COLORS, HIRE_LABELS } from "../../lib/constants";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";

interface SessionHistoryProps {
  sessions: SessionListItem[];
}

export function SessionHistory({ sessions }: SessionHistoryProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center p-6 bg-surface border border-border rounded-xl">
        <p className="text-muted text-sm">No sessions yet.</p>
        <p className="text-muted text-xs mt-1">
          Start your first interview above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => {
        const href =
          s.status === "completed"
            ? `/debrief/${s.id}`
            : `/interview/${s.id}`;

        const hireInfo = s.hire_recommendation
          ? HIRE_LABELS[s.hire_recommendation as keyof typeof HIRE_LABELS]
          : null;

        return (
          <Link
            key={s.id}
            href={href}
            className="block p-3 bg-surface border border-border rounded-xl hover:border-accent/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-300 truncate">
                {s.problem_title || "Unknown Problem"}
              </span>
              {s.overall_score !== undefined && s.overall_score !== null ? (
                <span
                  className={clsx(
                    "text-xs font-mono shrink-0 ml-2",
                    hireInfo?.color || "text-muted"
                  )}
                >
                  {s.overall_score}/100
                </span>
              ) : (
                <span
                  className={clsx(
                    "text-xs shrink-0 ml-2",
                    s.status === "active" ? "text-accent" : "text-muted"
                  )}
                >
                  {s.status}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {s.problem_difficulty && (
                <span
                  className={clsx(
                    "text-xs",
                    DIFFICULTY_COLORS[
                      s.problem_difficulty as keyof typeof DIFFICULTY_COLORS
                    ]
                  )}
                >
                  {s.problem_difficulty}
                </span>
              )}
              <span className="text-xs text-muted">·</span>
              <span className="text-xs text-muted">{s.language}</span>
              {s.duration_seconds && (
                <>
                  <span className="text-xs text-muted">·</span>
                  <span className="text-xs text-muted">
                    {Math.round(s.duration_seconds / 60)}min
                  </span>
                </>
              )}
            </div>

            <div className="mt-1">
              <span className="text-xs text-muted">
                {formatDistanceToNow(new Date(s.created_at), {
                  addSuffix: true,
                })}
              </span>
              {hireInfo && (
                <span
                  className={clsx(
                    "text-xs ml-2 font-medium",
                    hireInfo.color
                  )}
                >
                  {hireInfo.label}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
