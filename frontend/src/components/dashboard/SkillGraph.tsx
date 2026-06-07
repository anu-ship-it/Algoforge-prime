import { UserSkill } from "../../types";
import clsx from "clsx";

interface SkillGraphProps {
  skills: UserSkill[];
}

export function SkillGraph({ skills }: SkillGraphProps) {
  if (skills.length === 0) {
    return (
      <div className="text-center p-6 bg-surface border border-border rounded-xl">
        <p className="text-muted text-sm">No skill data yet.</p>
        <p className="text-muted text-xs mt-1">
          Complete sessions to build your skill graph.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-4">Skill Graph</h3>
      <div className="space-y-3">
        {skills.map((skill) => {
          const score = Math.round(skill.avg_score);
          const barColor =
            score >= 70
              ? "bg-success"
              : score >= 50
              ? "bg-warning"
              : "bg-danger";

          return (
            <div key={skill.topic}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-300 capitalize">
                  {skill.topic}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">
                    {skill.attempts} attempts
                  </span>
                  <span
                    className={clsx(
                      "text-xs font-mono font-medium",
                      score >= 70
                        ? "text-success"
                        : score >= 50
                        ? "text-warning"
                        : "text-danger"
                    )}
                  >
                    {score}/100
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all duration-700",
                    barColor
                  )}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
