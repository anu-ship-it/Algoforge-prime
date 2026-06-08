"use client";
import { useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSessionStore } from "../../../store/sessionStore";
import { useAuthStore } from "../../../store/authStore";
import { useSocket } from "../../../hooks/useSocket";
import { useTimer } from "../../../hooks/useTimer";
import { useExecution } from "../../../hooks/useExecution";
import { CodeEditor } from "../../../components/interview/CodeEditor";
import { ChatPanel } from "../../../components/interview/ChatPanel";
import { ProblemPane } from "../../../components/interview/ProblemPane";
import { TestResults } from "../../../components/interview/TestResults";
import { Timer } from "../../../components/interview/Timer";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { Badge } from "../../../components/ui/Badge";
import { Message } from "../../../types";
import { SNAPSHOT_INTERVAL_MS } from "../../../lib/constants";
import api from "../../../lib/api";
import toast from "react-hot-toast";
import Link from "next/link";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const {
    session,
    messages,
    currentCode,
    isInterviewerTyping,
    executionResult,
    testResults,
    isRunning,
    isEnding,
    setSession,
    setMessages,
    addMessage,
    setCurrentCode,
    setInterviewerTyping,
    setExecutionResult,
    setTestResults,
    setIsEnding,
    reset,
  } = useSessionStore();

  const { loadUser } = useAuthStore();
  const { runCode, runTests } = useExecution();
  const timer = useTimer({ maxMinutes: 45 });

  // Load session on mount
  useEffect(() => {
    loadUser();
    loadSession();
    timer.start();
    return () => {
      reset();
      timer.stop();
    };
  }, [sessionId]);

  // Auto-snapshot every 30s
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      if (currentCode) {
        sendSnapshot(currentCode, session.language);
      }
    }, SNAPSHOT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [session, currentCode]);

  async function loadSession() {
    try {
      const res = await api.get(`/sessions/${sessionId}`);
      const { session: s, messages: msgs } = res.data;
      setSession(s);

      const mapped: Message[] = msgs.map((m: any) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));
      setMessages(mapped);

      // Set starter code
      const starter =
        s.final_code ||
        s.problem_starter_code?.[s.language] ||
        `// Write your ${s.language} solution here\n`;
      setCurrentCode(starter);
    } catch {
      toast.error("Failed to load session");
      router.push("/dashboard");
    }
  }

  // Socket handlers
  const handleInterviewerMessage = useCallback(
    (msg: Message) => {
      addMessage(msg);
      setInterviewerTyping(false);
    },
    [addMessage, setInterviewerTyping]
  );

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      setInterviewerTyping(isTyping);
    },
    [setInterviewerTyping]
  );

  const handleError = useCallback((error: { message: string }) => {
    toast.error(error.message);
    setInterviewerTyping(false);
  }, [setInterviewerTyping]);

  const handleSessionJoined = useCallback(() => {
    console.log("Session socket ready");
  }, []);

  const { sendMessage, sendSnapshot, requestHint } = useSocket({
    sessionId,
    onInterviewerMessage: handleInterviewerMessage,
    onTyping: handleTyping,
    onError: handleError,
    onSessionJoined: handleSessionJoined,
  });

  function handleSendMessage(message: string) {
    const userMsg: Message = {
      role: "candidate",
      content: message,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);
    sendMessage(message, currentCode);
  }

  function handleRequestHint() {
    requestHint(currentCode);
  }

  async function handleRun() {
    if (!session) return;
    setExecutionResult(null);
    setTestResults(null);
    await runCode(currentCode, session.language, sessionId);
  }

  async function handleRunTests() {
    if (!session) return;
    setExecutionResult(null);
    setTestResults(null);
    await runTests(currentCode, session.language, session.problem_id);
  }

  async function handleEndSession() {
    if (!confirm("End this interview session?")) return;
    setIsEnding(true);
    try {
      await api.post(`/sessions/${sessionId}/complete`, {
        finalCode: currentCode,
      });
      router.push(`/debrief/${sessionId}`);
    } catch {
      toast.error("Failed to end session");
      setIsEnding(false);
    }
  }

  if (!session) {
    return <FullPageSpinner message="Loading interview session..." />;
  }

  const difficulty = session.problem_difficulty as "easy" | "medium" | "hard";

  return (
    <div className="h-screen bg-bg flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-accent font-mono text-sm font-medium">
            {"</>"}
          </Link>
          <span className="text-sm font-medium text-gray-200">
            {session.problem_title}
          </span>
          {difficulty && <Badge variant={difficulty}>{difficulty}</Badge>}
          <Badge variant="default">{session.language}</Badge>
          <Badge variant="default">{session.interviewer_persona}</Badge>
        </div>

        <div className="flex items-center gap-4">
          <Timer
            elapsedSeconds={timer.elapsedSeconds}
            isWarning={timer.isWarning}
            isDanger={timer.isDanger}
          />
          <button
            onClick={handleEndSession}
            disabled={isEnding}
            className="text-xs bg-danger hover:opacity-80 disabled:opacity-50 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            {isEnding ? "Ending..." : "End Interview"}
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Editor + problem */}
        <div className="flex flex-col w-[55%] border-r border-border">
          {/* Problem description */}
          <ProblemPane session={session} />

          {/* Monaco editor */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              code={currentCode}
              language={session.language}
              onChange={setCurrentCode}
            />
          </div>

          {/* Execution controls */}
          <div className="border-t border-border bg-surface p-2 flex items-center gap-2 shrink-0">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="text-xs bg-success/20 text-success border border-success/30 hover:bg-success/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {isRunning ? "Running..." : "▶ Run"}
            </button>
            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className="text-xs bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              Run Tests
            </button>

            {/* Inline execution output */}
            {executionResult && (
              <div className="flex-1 font-mono text-xs truncate">
                {executionResult.stdout && (
                  <span className="text-success">
                    {executionResult.stdout.slice(0, 80)}
                  </span>
                )}
                {executionResult.stderr && (
                  <span className="text-danger">
                    {executionResult.stderr.slice(0, 80)}
                  </span>
                )}
                {executionResult.compile_output && (
                  <span className="text-warning">
                    {executionResult.compile_output.slice(0, 80)}
                  </span>
                )}
                <span className="text-muted ml-2">
                  {executionResult.status}
                  {executionResult.time ? ` · ${executionResult.time}s` : ""}
                </span>
              </div>
            )}
          </div>

          {/* Test results panel */}
          {testResults && <TestResults results={testResults} />}
        </div>

        {/* Right: Chat */}
        <div className="flex flex-col w-[45%]">
          <ChatPanel
            messages={messages}
            isTyping={isInterviewerTyping}
            onSendMessage={handleSendMessage}
            onRequestHint={handleRequestHint}
            disabled={session.status !== "active"}
          />
        </div>
      </div>
    </div>
  );
}
