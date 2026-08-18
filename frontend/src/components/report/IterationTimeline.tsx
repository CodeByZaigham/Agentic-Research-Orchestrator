import type { IterationLog } from "../../types";
import "./IterationTimeline.css";

interface IterationTimelineProps {
  history: IterationLog[];
  threshold: number;
}

export default function IterationTimeline({ history, threshold }: IterationTimelineProps) {
  if (history.length <= 1) return null;

  return (
    <div className="iteration-timeline">
      <p className="iteration-timeline__title mono">Revision history</p>
      <ol className="iteration-timeline__list">
        {history.map((entry, i) => {
          const passed = entry.score != null && entry.score >= threshold;
          const isLast = i === history.length - 1;
          return (
            <li className="iteration-timeline__item" key={entry.iteration}>
              <div className="iteration-timeline__rail">
                <span className="iteration-timeline__dot" data-pass={passed} />
                {!isLast && <span className="iteration-timeline__line" />}
              </div>
              <div className="iteration-timeline__body">
                <span className="iteration-timeline__label">
                  {i === 0 ? "First draft" : `Revision ${i}`}
                </span>
                <span className="iteration-timeline__score mono">
                  {entry.score != null ? `${entry.score}/100` : "—"}
                  {entry.quality_level ? ` · ${entry.quality_level}` : ""}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
