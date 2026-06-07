import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlgoForge — AI Mock Interviewer",
  description: "Practice coding interviews with an AI that thinks like a real FAANG interviewer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#111118",
              color: "#e2e8f0",
              border: "1px solid #1e1e2e",
              fontSize: "14px",
            },
            success: {
              iconTheme: {
                primary: "#22c55e",
                secondary: "#111118",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#111118",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
