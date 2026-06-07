import { create } from "zustand";
import { Session, Message, ExecutionResult, TestResult } from "../types";

interface SessionState {
  // Current session
  session: Session | null;
  messages: Message[];
  currentCode: string;
  language: string;

  // UI state
  isInterviewerTyping: boolean;
  executionResult: ExecutionResult | null;
  testResults: TestResult[] | null;
  isRunning: boolean;
  isEnding: boolean;

  // Actions
  setSession: (session: Session) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setCurrentCode: (code: string) => void;
  setLanguage: (language: string) => void;
  setInterviewerTyping: (typing: boolean) => void;
  setExecutionResult: (result: ExecutionResult | null) => void;
  setTestResults: (results: TestResult[] | null) => void;
  setIsRunning: (running: boolean) => void;
  setIsEnding: (ending: boolean) => void;
  reset: () => void;
}

const initialState = {
  session: null,
  messages: [],
  currentCode: "",
  language: "javascript",
  isInterviewerTyping: false,
  executionResult: null,
  testResults: null,
  isRunning: false,
  isEnding: false,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,

  setSession: (session) => set({ session }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setCurrentCode: (code) => set({ currentCode: code }),

  setLanguage: (language) => set({ language }),

  setInterviewerTyping: (typing) => set({ isInterviewerTyping: typing }),

  setExecutionResult: (result) => set({ executionResult: result }),

  setTestResults: (results) => set({ testResults: results }),

  setIsRunning: (running) => set({ isRunning: running }),

  setIsEnding: (ending) => set({ isEnding: ending }),

  reset: () => set(initialState),
}));
