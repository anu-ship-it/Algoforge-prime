"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../store/authStore";
import { ProblemCard } from "../../components/dashboard/ProblemCard";
import { SessionHistory } from "../../components/dashboard/SessionHistory";
import { SkillGraph } from "../../components/dashboard/SkillGraph";
import { FullPageSpinner } from "../../components/ui/Spinner";
import api from "../../lib/api";
import { Problem, SessionListItem, UserSkill } from "../../types";
import { LANGUAGES, PERSONAS, FREE_SESSION_LIMIT } from "../../lib/constants";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { user, loadUser, logout } = useAuthStore();
  const router = useRouter();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [recommended, setRecommended] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [language, setLanguage] = useState("javascript");
  const [persona, setPersona] = useState("generic");

  useEffect(() => {
    loadUser().then(() => {
      const u = useAuthStore.getState().user;
      if (!u) router.push("/login");
    });
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [problemsRes, sessionsRes, skillsRes, recRes] = await Promise.all([
        api.get("/problems"),
        api.get("/sessions"),
        api.get("/users/skills"),
        api.get("/problems/meta/recommended"),
      ]);
      setProblems(problemsRes.data.problems);
      setSessions(sessionsRes.data);
      setSkills(skillsRes.data);
      setRecommended(recRes.data);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }

  async function startSession(problemId: string) {
    setStartingId(problemId);
    try {
      const res = await api.post("/sessions", {
        problem_id: problemId,
        language,
        interviewer_persona: persona,
      });
      router.push(`/interview/${res.data.session.id}`);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to start session"
      );
    } finally {
      setStartingId(null);
    }
  }

  if (isLoading) return <FullPageSpinner message="Loading your dashboard..." />;

  const freeSessionsLeft = user
    ? Math.max(0, FREE_SESSION_LIMIT - (user.sessions_used_this_month || 0))
    : 0;

  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-accent font-mono text-xl">{"</>"}</span>
          <span className="font-semibold">AlgoForge</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-muted text-sm">{user?.username}</span>
          {!user?.is_premium && (
            <span className="text-xs bg-surface border border-border px-2 py-1 rounded-full text-muted">
              {freeSessionsLeft} sessions left
            </span>
          )}
          <button
            onClick={() => logout().then(() => router.push("/"))}
            className="text-muted hover:text-gray-300 text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Session settings */}
        <div className="flex items-center gap-6 mb-8 p-4 bg-surface border border-border rounded-xl">
          <span className="text-sm text-muted shrink-0">Session settings:</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-bg border border-border rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-accent"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted">Interviewer</label>
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="bg-bg border border-border rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-accent"
            >
              {PERSONAS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Problems — takes 2 columns */}
          <div className="col-span-2 space-y-4">
            {/* Recommended */}
            {recommended && (
              <div>
                <h2 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  Recommended for you
                </h2>
                <ProblemCard
                  problem={recommended}
                  onStart={startSession}
                  isStarting={startingId === recommended.id}
                  isRecommended
                />
              </div>
            )}

            {/* All problems */}
            <div>
              <h2 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                All problems
              </h2>
              <div className="space-y-2">
                {problems.map((p) => (
                  <ProblemCard
                    key={p.id}
                    problem={p}
                    onStart={startSession}
                    isStarting={startingId === p.id}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Skill graph */}
            <SkillGraph skills={skills} />

            {/* Session history */}
            <div>
              <h2 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                Session history
              </h2>
              <SessionHistory sessions={sessions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
