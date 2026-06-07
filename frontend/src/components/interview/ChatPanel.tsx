"use client";
import { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Message } from "../../types";
import clsx from "clsx";

interface ChatPanelProps {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (message: string) => void;
  onRequestHint: () => void;
  disabled?: boolean;
}

export function ChatPanel({
  messages,
  isTyping,
  onSendMessage,
  onRequestHint,
  disabled = false,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function handleSend() {
    if (!input.trim() || isTyping || disabled) return;
    onSendMessage(input.trim());
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={clsx(
              "flex",
              msg.role === "candidate" ? "justify-end" : "justify-start"
            )}
          >
            <div className="max-w-[85%]">
              <div
                className={clsx(
                  "text-xs mb-1",
                  msg.role === "interviewer"
                    ? "text-accent"
                    : "text-muted text-right"
                )}
              >
                {msg.role === "interviewer" ? "Interviewer" : "You"}
                {msg.isHint && (
                  <span className="ml-2 text-warning">· hint</span>
                )}
              </div>
              <div
                className={clsx(
                  "rounded-xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "interviewer"
                    ? "bg-surface border border-border text-gray-200"
                    : "bg-accent/20 border border-accent/30 text-gray-200"
                )}
              >
                <ReactMarkdown
                  components={{
                    code: ({ children }) => (
                      <code className="font-mono text-xs bg-bg px-1 py-0.5 rounded text-accent">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="font-mono text-xs bg-bg p-2 rounded mt-1 overflow-x-auto">
                        {children}
                      </pre>
                    ),
                    p: ({ children }) => (
                      <p className="mb-2 last:mb-0">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-white">
                        {children}
                      </strong>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-1 mb-2">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li className="text-gray-300">{children}</li>
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
              <div className="text-xs text-muted mt-1 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-surface border border-border rounded-xl px-4 py-3">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-accent rounded-full typing-dot" />
                <div className="w-2 h-2 bg-accent rounded-full typing-dot" />
                <div className="w-2 h-2 bg-accent rounded-full typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 bg-surface shrink-0">
        <div className="flex gap-2 mb-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Talk to your interviewer... (Enter to send, Shift+Enter for newline)"
            rows={2}
            disabled={disabled || isTyping}
            className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm text-gray-200 resize-none focus:outline-none focus:border-accent placeholder-muted disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping || disabled}
            className="bg-accent hover:bg-accent-dim disabled:opacity-40 px-4 rounded-lg text-sm font-medium transition-colors self-end pb-2 pt-2"
          >
            →
          </button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">
            Think out loud — explain your approach before and while you code.
          </p>
          <button
            onClick={onRequestHint}
            disabled={isTyping || disabled}
            className="text-xs text-muted hover:text-accent transition-colors disabled:opacity-50"
          >
            Request hint
          </button>
        </div>
      </div>
    </div>
  );
}
