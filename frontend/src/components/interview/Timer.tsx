import clsx from "clsx";

interface TimerProps {
  elapsedSeconds: number;
  isWarning: boolean;
  isDanger: boolean;
}

export function Timer({ elapsedSeconds, isWarning, isDanger }: TimerProps) {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <span
      className={clsx(
        "font-mono text-sm font-medium transition-colors",
        isDanger && "text-danger animate-pulse",
        isWarning && !isDanger && "text-warning",
        !isWarning && !isDanger && "text-muted"
      )}
    >
      {formatted}
    </span>
  );
}
