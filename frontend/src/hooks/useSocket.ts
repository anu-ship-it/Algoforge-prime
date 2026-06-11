import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Message } from "../types";

interface UseSocketOptions {
  sessionId: string | null;
  onInterviewerMessage: (msg: Message) => void;
  onTyping: (isTyping: boolean) => void;
  onError: (error: { message: string }) => void;
  onSessionJoined: () => void;
}

export function useSocket({
  sessionId,
  onInterviewerMessage,
  onTyping,
  onError,
  onSessionJoined,
}: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (!sessionId) return;

    const token = localStorage.getItem("accessToken");
    if (!token) {
      onError({ message: "Not authenticated" });
      return;
    }

    const socket = io(
      process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000",
      {
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      isConnectedRef.current = true;
      socket.emit("join_session", { sessionId });
    });

    socket.on("session_joined", () => {
      console.log("Joined session room");
      onSessionJoined();
    });

    socket.on("interviewer_message", (msg: Message) => {
      onInterviewerMessage(msg);
    });

    socket.on("interviewer_typing", (isTyping: boolean) => {
      onTyping(isTyping);
    });

    socket.on("error", (error: { message: string }) => {
      console.error("Socket error:", error.message);
      onError(error);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      isConnectedRef.current = false;
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      onError({ message: "Connection failed. Retrying..." });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      isConnectedRef.current = false;
    };
  }, [sessionId]);

  const sendMessage = useCallback((message: string, currentCode?: string) => {
    if (!socketRef.current?.connected) {
      onError({ message: "Not connected. Please wait..." });
      return;
    }
    socketRef.current.emit("candidate_message", { message, currentCode });
  }, []);

  const sendSnapshot = useCallback((code: string, language: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit("code_snapshot", { code, language });
  }, []);

  const requestHint = useCallback((currentCode?: string) => {
    if (!socketRef.current?.connected) {
      onError({ message: "Not connected. Please wait..." });
      return;
    }
    socketRef.current.emit("request_hint", { currentCode });
  }, []);

  const isConnected = useCallback(() => {
    return isConnectedRef.current;
  }, []);

  return { sendMessage, sendSnapshot, requestHint, isConnected };
}
