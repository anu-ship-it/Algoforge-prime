export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  is_premium: boolean;
  sessions_used_this_month: number;
  created_at: string;
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  company_tags: string[];
  starter_code: Record<string, string>;
  test_cases: TestCase[];
  constraints?: string;
  hints?: string[];
}

export interface TestCase {
  input: Record<string, unknown>;
  expected: unknown;
}

export interface Session {
  id: string;
  user_id: string;
  problem_id: string;
  problem_title?: string;
  problem_description?: string;
  problem_difficulty?: string;
  problem_topic?: string;
  problem_constraints?: string;
  problem_starter_code?: Record<string, string>;
  problem_hints?: string[];
  interviewer_persona: string;
  target_company?: string;
  language: string;
  status: "active" | "completed" | "abandoned";
  final_code?: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  created_at: string;
}

export interface Message {
  id?: string;
  role: "interviewer" | "candidate";
  content: string;
  timestamp: string;
  isHint?: boolean;
  code_snapshot?: string;
}

export interface DebriefReport {
  id: string;
  session_id: string;
  user_id: string;
  overall_score: number;
  communication_score: number;
  correctness_score: number;
  efficiency_score: number;
  hire_recommendation: "strong_hire" | "hire" | "no_hire" | "strong_no_hire";
  strengths: string[];
  weaknesses: string[];
  missed_edge_cases: string[];
  optimal_solution: string;
  detailed_feedback: string;
  created_at: string;
}

export interface UserSkill {
  topic: string;
  attempts: number;
  successes: number;
  avg_score: number;
  last_practiced?: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  compile_output: string;
  status: string;
  status_id: number;
  time?: string;
  memory?: number;
}

export interface TestResult {
  input: Record<string, unknown>;
  expected: unknown;
  got: string | null;
  passed: boolean;
  status: string;
  time?: string;
  stderr?: string;
}

export interface SessionListItem {
  id: string;
  status: string;
  language: string;
  interviewer_persona: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  created_at: string;
  problem_title?: string;
  problem_difficulty?: string;
  problem_topic?: string;
  overall_score?: number;
  hire_recommendation?: string;
}
