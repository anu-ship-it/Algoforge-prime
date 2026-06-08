"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DebriefReport } from "../../../types";
import { VerdictCard } from "../../../components/debrief/VerdictCard";
import { ScoreBar } from "../../../components/debrief/ScoreBar";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { Button } from "../../../components/ui/Button";
import api from "../../../lib/api";
import toast from "react-hot-toast";
import clsx from "clsx";

export default function DebriefPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [report, setReport] = useState<DebriefReport | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadDebrief();
  }, [sessionId]);

  async function loadDebrief() {
    try {
      // Try GET first — returns existing debrief if already generated
      const existing = await api.get(`/debrief/${sessionId}`).catch(() => null);
      if (existing?.data) {
        setReport(existing.data);
        return;
      }

      // Generate new debrief
      setGenerating(true);
      toast.loading("Analyzing your interview...", { id: "debrief" });
      const res = await api.post(`/debrief/${sessionId}`);
      setReport(res.data);
      toast.success("Debrief ready!", { id: "debrief" });
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error || "Failed to generate debrief",
        { id: "debrief" }
      );
    } finally {
      setGenerating(false);
    }
  }

  function copyReport() {
    if (!report) return;
    const text = [
      "AlgoForge Interview Debrief",
      "===========================",
      `Overall: ${report.overall_score}/100`,
      `Verdict: ${report.hire_recommendation.replace("_", " ")}`,
      "",
      `Communication: ${report.communication_score}/100`,
      `Correctness:   ${report.correctness_score}/100`,
      `Efficiency:    ${report.efficiency_score}/100`,
      "",
      "Strengths:",
      ...(report.strengths || []).map((s) => `  • ${s}`),
      "",
      "Areas to improve:",
      ...(report.weaknesses || []).map((w) => `  • ${w}`),
      "",
      "Missed edge cases:",
      ...(report.missed_edge_cases || []).map((e) => `  • ${e}`),
      "",
      `Optimal approach: ${report.optimal_solution}`,
      "",
      `Feedback: ${report.detailed_feedback}`,
    ].join("\n");

    navigator.clipboard.writeText(text);
    toast.success("Report copied to clipboard");
  }

  if (generating || !report) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <div className="text-muted text-sm">
            {generating
              ? "Analyzing your interview performance..."
              : "Loading report..."}
          </div>
          {generating && (
            <div className="text-xs text-muted mt-1">
              This takes 15–30 seconds. The AI is reviewing your full session.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-accent font-mono text-xl">{"</>"}</span>
          <span className="font-semibold">AlgoForge</span>
        </Link>
        <Link
          href="/dashboard"
          className="text-muted hover:text-gray-300 text-sm transition-colors"
        >
          ← Dashboard
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="text-xs text-muted mb-2">Post-session debrief</div>
        <h1 className="text-2xl font-semibold mb-8">Interview Report</h1>

        {/* Verdict + overall score */}
        <VerdictCard
          hireRecommendation={report.hire_recommendation}
          overallScore={report.overall_score}
        />

        {/* Score breakdown */}
        <div className="bg-surface border border-border rounded-xl p-6 mb-6">
          <h2 className="text-sm font-medium mb-5">Score breakdown</h2>
          <div className="space-y-4">
            <ScoreBar label="Communication" score={report.communication_score} />
            <ScoreBar label="Correctness" score={report.correctness_score} />
            <ScoreBar label="Efficiency / Complexity" score={report.efficiency_score} />
          </div>
        </div>

        {/* Detailed feedback */}
        <div className="bg-surface border border-border rounded-xl p-6 mb-6">
          <h2 className="text-sm font-medium mb-3">Detailed feedback</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            {report.detailed_feedback}
          </p>
        </div>

        {/* Strengths & weaknesses */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="text-sm font-medium mb-3 text-success">
              Strengths
            </h2>
            <ul className="space-y-2">
              {(report.strengths || []).map((s, i) => (
                <li key={i} className="text-sm text-gray-300 flex gap-2">
                  <span className="text-success mt-0.5 shrink-0">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="text-sm font-medium mb-3 text-danger">
              Areas to improve
            </h2>
            <ul className="space-y-2">
              {(report.weaknesses || []).map((w, i) => (
                <li key={i} className="text-sm text-gray-300 flex gap-2">
                  <span className="text-danger mt-0.5 shrink-0">✗</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Missed edge cases */}
        {(report.missed_edge_cases || []).length > 0 && (
          <div className="bg-surface border border-warning/30 rounded-xl p-5 mb-6">
            <h2 className="text-sm font-medium mb-3 text-warning">
              Missed edge cases
            </h2>
            <ul className="space-y-1">
              {report.missed_edge_cases.map((ec, i) => (
                <li key={i} className="text-sm text-gray-300 flex gap-2">
                  <span className="text-warning shrink-0">△</span>
                  <span>{ec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Optimal solution */}
        <div className="bg-surface border border-border rounded-xl p-5 mb-8">
          <h2 className="text-sm font-medium mb-2">Optimal approach</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            {report.optimal_solution}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link href="/dashboard" className="flex-1">
            <Button size="lg" className="w-full">
              Practice another problem
            </Button>
          </Link>
          <Button
            size="lg"
            variant="secondary"
            onClick={copyReport}
          >
            Copy report
          </Button>
        </div>
      </div>
    </div>
  );
}
