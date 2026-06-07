import clsx from "clsx";

interface BadgeProps {
  variant?: "easy" | "medium" | "hard" | "default" | "accent";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  const variants = {
    easy: "text-success border-success/30 bg-success/10",
    medium: "text-warning border-warning/30 bg-warning/10",
    hard: "text-danger border-danger/30 bg-danger/10",
    default: "text-muted border-border bg-surface",
    accent: "text-accent border-accent/30 bg-accent/10",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
