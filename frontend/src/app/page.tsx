"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";

const FEATURES = [
  {
    icon: "🤖",
    title: "AI that stays in character",
    desc: "The interviewer asks follow-ups based on your actual code, not generic hints",
  },
  {
    icon: "⚡",
    title: "Real-time code execution",
    desc: "Run your code against test cases instantly — see exactly what breaks",
  },
  {
    icon: "📊",
    title: "Debrief after every session",
    desc: "Scores for communication, efficiency, correctness, and a hire/no-hire verdict",
  },
];

const COMPANIES = ["Google", "Amazon", "Meta", "Microsoft"];

export default function HomePage() {
  const { user, loadUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <div className="min-h-screen bg-bg text-gray-100">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-accent font-mono text-xl font-medium">{"</>"}</span>
          <span className="font-semibold text-lg">AlgoForge</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="bg-accent hover:bg-accent-dim px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Dashboard →
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-muted hover:text-gray-300 text-sm transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="bg-accent hover:bg-accent-dim px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Start free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-8 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-surface border border-border px-3 py-1 rounded-full text-xs text-muted mb-8">
          <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
          Powered by Llama 3 — runs 100% locally, completely free
        </div>

        <h1 className="text-5xl font-semibold leading-tight mb-6">
          Practice interviews with an AI
          <br />
          <span className="text-accent">that actually pushes back</span>
        </h1>

        <p className="text-muted text-lg max-w-2xl mx-auto mb-10">
          Not another problem bank. AlgoForge plays the role of a real senior
          engineer — asking follow-ups, challenging your complexity claims, and
          calling you out on edge cases you missed.
        </p>

        <div className="flex items-center justify-center gap-4 mb-16">
          <Link
            href="/register"
            className="bg-accent hover:bg-accent-dim px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Start for free — 3 sessions/month
          </Link>
          <Link
            href="/problems"
            className="border border-border hover:border-accent px-6 py-3 rounded-lg font-medium transition-colors text-muted hover:text-gray-200"
          >
            Browse problems
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-16">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-surface border border-border rounded-xl p-5 text-left"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="font-medium mb-2 text-sm">{f.title}</div>
              <div className="text-muted text-xs leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Company personas */}
        <div>
          <p className="text-muted text-sm mb-4">
            Interviewer personas for
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {COMPANIES.map((c) => (
              <span
                key={c}
                className="bg-surface border border-border px-3 py-1 rounded-full text-xs text-gray-300"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
