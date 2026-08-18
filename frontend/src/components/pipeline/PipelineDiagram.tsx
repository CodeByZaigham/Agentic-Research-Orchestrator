import { Fragment, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, Check, FileCheck2, Gauge, PenLine, Search } from "lucide-react";
import { STAGES, getStageProgress, type StageId } from "../../lib/stageScript";
import "./PipelineDiagram.css";

interface PipelineDiagramProps {
  elapsedMs: number;
  /** Once the real result is known, force every node to "complete" and
   * reveal how many drafting passes it actually took - the payoff for the
   * ambiguity we kept during the run. */
  completedIterations?: number | null;
}

const ICONS: Record<StageId, typeof Search> = {
  search: Search,
  read: BookOpen,
  draft: PenLine,
  evaluate: Gauge,
  finalize: FileCheck2,
};

const RETRIEVAL: StageId[] = ["search", "read"];

function accentFor(stageId: StageId): "signal" | "amber" {
  return RETRIEVAL.includes(stageId) ? "signal" : "amber";
}

type NodeState = "pending" | "active" | "complete";

const CIRCUMFERENCE = 2 * Math.PI * 25;

export default function PipelineDiagram({ elapsedMs, completedIterations }: PipelineDiagramProps) {
  const isDone = completedIterations != null;
  const progress = useMemo(() => getStageProgress(elapsedMs), [elapsedMs]);

  function stateFor(index: number): NodeState {
    if (isDone) return "complete";
    if (progress.completedStageIds.includes(STAGES[index].id)) return "complete";
    if (index === progress.currentStageIndex) return "active";
    return "pending";
  }

  return (
    <div className="pipeline-diagram" role="list" aria-label="Pipeline progress">
      <div className="pipeline-diagram__row">
        {STAGES.map((stage, i) => {
          const accent = accentFor(stage.id);
          const state = stateFor(i);
          const Icon = ICONS[stage.id];
          const ringProgress = state === "active" ? progress.stageProgress : state === "complete" ? 1 : 0;
          const showIterationBadge = isDone && stage.id === "evaluate" && (completedIterations ?? 0) > 1;
          // The connector leading into a node mirrors that node's own state:
          // solid once data has fully arrived, flowing while it's arriving,
          // dim while it hasn't started yet.
          const connectorState: NodeState = state;

          return (
            <Fragment key={stage.id}>
              {i > 0 && (
                <div className="pipeline-diagram__connector" data-state={connectorState} data-accent={accent} aria-hidden="true">
                  {connectorState === "active" && <span className="pipeline-diagram__connector-flow" />}
                </div>
              )}

              <div
                className={`pipeline-diagram__item pipeline-diagram__item--${accent}`}
                role="listitem"
                aria-label={`${stage.label}: ${state}`}
              >
                <div className="pipeline-diagram__node-wrap">
                  <svg className="pipeline-diagram__ring" viewBox="0 0 60 60" aria-hidden="true">
                    <circle className="pipeline-diagram__ring-track" cx="30" cy="30" r="25" />
                    <motion.circle
                      className="pipeline-diagram__ring-fill"
                      cx="30"
                      cy="30"
                      r="25"
                      strokeDasharray={CIRCUMFERENCE}
                      initial={false}
                      animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - ringProgress) }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    />
                  </svg>

                  <motion.div
                    className="pipeline-diagram__node"
                    data-state={state}
                    animate={state === "active" ? { scale: [1, 1.045, 1] } : { scale: 1 }}
                    transition={
                      state === "active"
                        ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                        : { duration: 0.3 }
                    }
                  >
                    {state === "complete" ? <Check size={18} strokeWidth={2.5} /> : <Icon size={18} strokeWidth={2} />}
                  </motion.div>
                </div>

                <span className="pipeline-diagram__label mono" data-state={state}>
                  {stage.label}
                </span>
                {showIterationBadge && (
                  <motion.span
                    className="pipeline-diagram__badge mono"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    revised ×{(completedIterations ?? 1) - 1}
                  </motion.span>
                )}
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
