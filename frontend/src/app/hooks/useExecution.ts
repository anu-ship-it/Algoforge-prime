import { useCallback } from "react";
import api from "../lib/api";
import { ExecutionResult, TestResult } from "../types";
import { useSessionStore } from "../store/sessionStore";
import toast from "react-hot-toast";

export function useExecution() {
  const {
    setExecutionResult,
    setTestResults,
    setIsRunning,
    currentCode,
    session,
  } = useSessionStore();

  const runCode = useCallback(
    async (code: string, language: string, sessionId?: string) => {
      setIsRunning(true);
      setExecutionResult(null);

      try {
        const res = await api.post("/execute", {
          code,
          language,
          session_id: sessionId || null,
        });

        const result: ExecutionResult = res.data;
        setExecutionResult(result);

        if (result.stderr && !result.stdout) {
          toast.error("Runtime error — check output panel");
        } else if (result.compile_output) {
          toast.error("Compilation error — check output panel");
        }

        return result;
      } catch (err: any) {
        const msg =
          err?.response?.data?.error || "Execution failed";
        toast.error(msg);
        return null;
      } finally {
        setIsRunning(false);
      }
    },
    [setExecutionResult, setIsRunning]
  );

  const runTests = useCallback(
    async (code: string, language: string, problemId: string) => {
      setIsRunning(true);
      setTestResults(null);

      try {
        const res = await api.post("/execute/run-tests", {
          code,
          language,
          problem_id: problemId,
        });

        const { results, passedCount, totalCount, allPassed } = res.data;
        setTestResults(results);

        if (allPassed) {
          toast.success(`All ${totalCount} tests passed!`);
        } else {
          toast.error(`${passedCount}/${totalCount} tests passed`);
        }

        return results as TestResult[];
      } catch (err: any) {
        const msg =
          err?.response?.data?.error || "Test execution failed";
        toast.error(msg);
        return null;
      } finally {
        setIsRunning(false);
      }
    },
    [setTestResults, setIsRunning]
  );

  return { runCode, runTests };
}
