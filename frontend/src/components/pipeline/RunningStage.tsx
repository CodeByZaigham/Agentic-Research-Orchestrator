import { motion } from "framer-motion";
import PipelineDiagram from "./PipelineDiagram";
import ActivityFeed from "./ActivityFeed";
import { getStageProgress } from "../../lib/stageScript";
import "./RunningStage.css";

interface RunningStageProps {
  topic: string;
  elapsedMs: number;
  /** Set briefly once the real result lands, to play the "victory lap"
   * before the parent swaps in the results view. */
  completedIterations?: number | null;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function RunningStage({ topic, elapsedMs, completedIterations }: RunningStageProps) {
  const progress = getStageProgress(elapsedMs);
  const isDone = completedIterations != null;

  return (
    <motion.section
      className="running-stage"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Research in progress"
    >
      <div className="running-stage__header">
        <p className="eyebrow">Researching</p>
        <h1 className="running-stage__topic">{topic}</h1>
      </div>

      <div className="running-stage__panel">
        <PipelineDiagram elapsedMs={elapsedMs} completedIterations={completedIterations} />

        <div className="running-stage__footer">
          <ActivityFeed
            lines={progress.emittedLines}
            finalNote={isDone ? "Done — bringing the report up now" : null}
          />
          <div className="running-stage__timer mono">
            <span className="running-stage__timer-dot" data-holding={progress.isHolding && !isDone} />
            {formatElapsed(elapsedMs)}
          </div>
        </div>
      </div>

      <p className="running-stage__note">
        Reading and revision take the longest — most topics finish in 2–4 minutes.
      </p>
    </motion.section>
  );
}
