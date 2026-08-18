import type { ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import AmbientBackground from "./AmbientBackground";
import "./AppShell.css";

interface AppShellProps {
  children: ReactNode;
  onReset?: () => void;
  showReset?: boolean;
}

function Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="var(--ink-800)" />
      <circle cx="7" cy="16" r="2.4" fill="var(--signal-500)" />
      <circle cx="16" cy="8" r="2.4" fill="var(--amber-500)" />
      <circle cx="16" cy="24" r="2.4" fill="var(--amber-500)" />
      <circle cx="25" cy="16" r="2.4" fill="var(--signal-500)" />
      <path
        d="M9 15 L14 9.5 M9 17 L14 22.5 M18 9.5 L23 15 M18 22.5 L23 17"
        stroke="var(--mist-300)"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AppShell({ children, onReset, showReset }: AppShellProps) {
  return (
    <div className="app-shell">
      <AmbientBackground />
      <header className="app-shell__header">
        <div className="app-shell__brand">
          <Mark />
          <span className="app-shell__wordmark mono">Orchestrator</span>
        </div>
        {showReset && (
          <button type="button" className="app-shell__reset mono" onClick={onReset}>
            <RotateCcw size={14} strokeWidth={2} />
            <span>New research</span>
          </button>
        )}
      </header>
      <main className="app-shell__main">{children}</main>
    </div>
  );
}
