import clsx from "clsx";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div
      className={clsx(
        "rounded-full border-accent border-t-transparent animate-spin",
        sizes[size],
        className
      )}
    />
  );
}

interface FullPageSpinnerProps {
  message?: string;
}

export function FullPageSpinner({ message }: FullPageSpinnerProps) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      {message && (
        <p className="text-muted text-sm">{message}</p>
      )}
    </div>
  );
}
