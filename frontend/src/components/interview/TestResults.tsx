import { TestResult } from "../../types";
import clsx from "clsx";

interface TestResultsProps {
  results: TestResult[];
}

export function TestResults({ results }: TestResultsProps) {
  const passedCount = results.filter((r) => r.passed).length;
  const allPassed = passedCount === results.length;

  return (
    <div className="border-t border-border bg-surface p-3 max-h-40 overflow-y-auto">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={clsx(
            "text-xs font-medium",
            allPassed ? "text-success" : "text-danger"
          )}
        >
          {passedCount}/{results.length} tests passed
        </span>
        {allPassed && (
          <span className="text-xs text-success">✓ All tests passing</span>
        )}
      </div>

      <div className="space-y-1">
        {results.map((r, i) => (
          <div
            key={i}
            className={clsx(
              "text-xs font-mono flex items-start gap-2 p-1.5 rounded",
              r.passed ? "bg-success/5" : "bg-danger/5"
            )}
          >
            <span
              className={clsx(
                "mt-0.5 shrink-0",
                r.passed ? "text-success" : "text-danger"
              )}
            >
              {r.passed ? "✓" : "✗"}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-400">Test {i + 1}</span>
              {!r.passed && (
                <div className="mt-0.5 space-y-0.5">
                  {r.got !== null && (
                    <div className="text-danger truncate">
                      got: {String(r.got).slice(0, 60)}
                    </div>
                  )}
                  <div className="text-muted truncate">
                    expected: {JSON.stringify(r.expected).slice(0, 60)}
                  </div>
                  {r.stderr && (
                    <div className="text-warning truncate">
                      {r.stderr.slice(0, 80)}
                    </div>
                  )}
                </div>
              )}
              <span className="text-muted ml-2">{r.status}</span>
              {r.time && (
                <span className="text-muted ml-1">{r.time}s</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
