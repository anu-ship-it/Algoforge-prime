export const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "typescript", label: "TypeScript" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
];

export const PERSONAS = [
  { value: "generic", label: "Generic", description: "Professional and balanced" },
  { value: "google", label: "Google", description: "Scalability-focused, pushes for optimal" },
  { value: "amazon", label: "Amazon", description: "Edge cases, operational thinking" },
  { value: "meta", label: "Meta", description: "Fast-paced, expects optimal fast" },
  { value: "microsoft", label: "Microsoft", description: "Collaborative, design-focused" },
];

export const DIFFICULTY_COLORS = {
  easy: "text-success",
  medium: "text-warning",
  hard: "text-danger",
};

export const DIFFICULTY_BORDER_COLORS = {
  easy: "border-success",
  medium: "border-warning",
  hard: "border-danger",
};

export const HIRE_LABELS = {
  strong_hire: { label: "Strong Hire", color: "text-success", bg: "bg-success/10 border-success/30" },
  hire: { label: "Hire", color: "text-success", bg: "bg-success/10 border-success/30" },
  no_hire: { label: "No Hire", color: "text-danger", bg: "bg-danger/10 border-danger/30" },
  strong_no_hire: { label: "Strong No Hire", color: "text-danger", bg: "bg-danger/10 border-danger/30" },
};

export const MONACO_LANGUAGE_MAP: Record<string, string> = {
  javascript: "javascript",
  python: "python",
  java: "java",
  cpp: "cpp",
  c: "c",
  go: "go",
  rust: "rust",
  typescript: "typescript",
  ruby: "ruby",
  swift: "swift",
  kotlin: "kotlin",
};

export const FREE_SESSION_LIMIT = 3;
export const SNAPSHOT_INTERVAL_MS = 30000;
export const MAX_INTERVIEW_MINUTES = 45;
