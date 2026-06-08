"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Problem } from "../../types";
import { Badge } from "../../components/ui/Badge";
import { FullPageSpinner } from "../../components/ui/Spinner";
import api from "../../lib/api";
import { DIFFICULTY_COLORS } from "../../lib/constants";
import clsx from "clsx";
import toast from "react-hot-toast";

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [topics, setTopics] = useState<{ topic: string; count: string }[]>([]);
  const [difficulty, setDifficulty] = useState("");
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    fetchProblems();
  }, [difficulty, topic]);

  async function fetchTopics() {
    try {
      const res = await api.get("/problems/meta/topics");
      setTopics(res.data);
    } catch {}
  }

  async function fetchProblems() {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (difficulty) params.difficulty = difficulty;
      if (topic) params.topic = topic;
      const res = await api.get("/problems", { params });
      setProblems(res.data.problems);
    } catch {
      toast.error("Failed to load problems");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-accent font-mono text-xl">{"</>"}</span>
          <span className="font-semibold">AlgoForge</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-muted hover:text-gray-300 text-sm transition-colors"
          >
            Dashboard →
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <h1 className="text-xl font-semibold mb-6">Problem Bank</h1>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-accent"
          >
            <option value="">All difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-accent"
          >
            <option value="">All topics</option>
            {topics.map((t) => (
              <option key={t.topic} value={t.topic}>
                {t.topic} ({t.count})
              </option>
            ))}
          </select>
        </div>

        {/* Problem list */}
        {isLoading ? (
          <FullPageSpinner message="Loading problems..." />
        ) : (
          <div className="space-y-2">
            {problems.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl hover:border-accent/40 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span
                    className={clsx(
                      "text-xs font-medium w-14 shrink-0",
                      DIFFICULTY_COLORS[p.difficulty]
                    )}
                  >
                    {p.difficulty}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-200 truncate">
                      {p.title}
                    </div>
                    <div className="text-xs text-muted">{p.topic}</div>
                  </div>
                  <div className="hidden md:flex gap-1">
                    {(p.company_tags || []).slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="default">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="text-xs text-accent hover:text-white border border-accent hover:bg-accent px-3 py-1.5 rounded-lg transition-colors shrink-0 ml-4"
                >
                  Start →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
