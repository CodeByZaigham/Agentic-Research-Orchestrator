import { lazy, Suspense, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AppShell from "./components/layout/AppShell";
import TopicStage from "./components/input/TopicStage";
import RunningStage from "./components/pipeline/RunningStage";
import ErrorCard from "./components/feedback/ErrorCard";
import { useResearchPipeline } from "./hooks/useResearchPipeline";
import { QUALITY_THRESHOLD } from "./lib/config";
import "./App.css";

const ResultLayout = lazy(() => import("./components/report/ResultLayout"));

type Phase = "idle" | "running" | "completing" | "loading-existing" | "success" | "error";

export default function App() {
  const { status, topic, result, error, elapsedMs, startResearch, reset } = useResearchPipeline();
  const [completing, setCompleting] = useState(false);
  const prevStatusRef = useRef(status);

  useLayoutEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    if (status === "success" && prev === "running") {
      setCompleting(true);
      const t = window.setTimeout(() => setCompleting(false), 900);
      return () => window.clearTimeout(t);
    }
    setCompleting(false);
  }, [status]);

  const phase: Phase = status === "success" && completing ? "completing" : status;

  return (
    <AppShell onReset={reset} showReset={phase !== "idle"}>
      <AnimatePresence mode="wait">
        {phase === "idle" && <TopicStage key="idle" onSubmit={startResearch} />}

        {(phase === "running" || phase === "completing") && (
          <RunningStage
            key="running"
            topic={topic}
            elapsedMs={elapsedMs}
            completedIterations={phase === "completing" ? (result?.iterations ?? 1) : null}
          />
        )}

        {phase === "loading-existing" && (
          <motion.div
            key="loading-existing"
            className="app-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="app-loading__spinner" aria-hidden="true" />
            <p className="mono">Opening report…</p>
          </motion.div>
        )}

        {phase === "success" && result && (
          <Suspense fallback={null}>
            <ResultLayout key="result" result={result} threshold={QUALITY_THRESHOLD} />
          </Suspense>
        )}

        {phase === "error" && error && (
          <ErrorCard
            key="error"
            error={error}
            topic={topic}
            onRetry={() => startResearch(topic)}
            onReset={reset}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}
