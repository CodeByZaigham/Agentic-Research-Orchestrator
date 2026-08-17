export type StageId = "search" | "read" | "draft" | "evaluate" | "finalize";

export interface StageDef {
  id: StageId;
  label: string;
  verb: string;
  weightMs: number;
  lines: string[];
}

export const STAGES: StageDef[] = [
  {
    id: "search",
    label: "Search",
    verb: "Searching",
    weightMs: 13_000,
    lines: ["Querying the web for sources", "Ranking candidate sources"],
  },
  {
    id: "read",
    label: "Read",
    verb: "Reading",
    weightMs: 42_000,
    lines: ["Opening candidate pages", "Extracting facts and citations", "Discarding low-value pages"],
  },
  {
    id: "draft",
    label: "Draft",
    verb: "Drafting",
    weightMs: 28_000,
    lines: ["Structuring the report", "Writing the analysis", "Composing the conclusion"],
  },
  {
    id: "evaluate",
    label: "Evaluate",
    verb: "Evaluating",
    weightMs: 18_000,
    lines: ["Scoring research quality", "Checking claims against sources", "Weighing structure and clarity"],
  },
  {
    id: "finalize",
    label: "Finalize",
    verb: "Finalizing",
    weightMs: 7_000,
    lines: ["Typesetting the PDF", "Packaging the report"],
  },
];

export const TOTAL_WEIGHT_MS = STAGES.reduce((sum, s) => sum + s.weightMs, 0);

export interface TimelineEvent {
  t: number;
  stageId: StageId;
  stageIndex: number;
  text: string;
}

export const TIMELINE: TimelineEvent[] = (() => {
  const events: TimelineEvent[] = [];
  let cursor = 0;
  STAGES.forEach((stage, stageIndex) => {
    const slice = stage.weightMs / stage.lines.length;
    stage.lines.forEach((text, i) => {
      events.push({ t: cursor + slice * i, stageId: stage.id, stageIndex, text });
    });
    cursor += stage.weightMs;
  });
  return events;
})();

export interface StageProgress {
  currentStageIndex: number;
  currentStageId: StageId;
  stageProgress: number;
  completedStageIds: StageId[];
  isHolding: boolean;
  emittedLines: TimelineEvent[];
}

export function getStageProgress(elapsedMs: number): StageProgress {
  const clampedTotal = Math.min(elapsedMs, TOTAL_WEIGHT_MS);
  let cursor = 0;
  let currentStageIndex = STAGES.length - 1;
  let stageProgress = 1;

  for (let i = 0; i < STAGES.length; i++) {
    const stage = STAGES[i];
    if (elapsedMs < cursor + stage.weightMs || i === STAGES.length - 1) {
      currentStageIndex = i;
      stageProgress = Math.min((elapsedMs - cursor) / stage.weightMs, 1);
      break;
    }
    cursor += stage.weightMs;
  }

  const isHolding = elapsedMs >= TOTAL_WEIGHT_MS;
  if (isHolding) {
    stageProgress = 0.94;
  }

  const completedStageIds = STAGES.slice(0, currentStageIndex).map((s) => s.id);
  const emittedLines = TIMELINE.filter((e) => e.t <= clampedTotal);

  return {
    currentStageIndex,
    currentStageId: STAGES[currentStageIndex].id,
    stageProgress,
    completedStageIds,
    isHolding,
    emittedLines,
  };
}
