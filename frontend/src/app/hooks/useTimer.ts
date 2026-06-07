import { useState, useEffect, useRef, useCallback } from "react";

interface UseTimerOptions {
  maxMinutes?: number;
  onTimeUp?: () => void;
}

export function useTimer({ maxMinutes = 45, onTimeUp }: UseTimerOptions = {}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const maxSeconds = maxMinutes * 60;

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= maxSeconds && onTimeUp) {
            onTimeUp();
          }
          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, maxSeconds]);

  const start = useCallback(() => setIsRunning(true), []);
  const stop = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsedSeconds(0);
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, []);

  const remainingSeconds = maxSeconds - elapsedSeconds;
  const isWarning = remainingSeconds <= 10 * 60; // last 10 min
  const isDanger = remainingSeconds <= 5 * 60;   // last 5 min

  return {
    elapsedSeconds,
    remainingSeconds,
    formattedElapsed: formatTime(elapsedSeconds),
    formattedRemaining: formatTime(remainingSeconds),
    isRunning,
    isWarning,
    isDanger,
    start,
    stop,
    reset,
  };
}
