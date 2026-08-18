import { AnimatePresence, motion } from "framer-motion";
import type { TimelineEvent } from "../../lib/stageScript";
import "./ActivityFeed.css";

interface ActivityFeedProps {
  lines: TimelineEvent[];
  finalNote?: string | null;
}

const VISIBLE = 5;

export default function ActivityFeed({ lines, finalNote }: ActivityFeedProps) {
  const visible = lines.slice(-VISIBLE);

  return (
    <div className="activity-feed mono" aria-live="polite">
      <AnimatePresence initial={false} mode="popLayout">
        {visible.map((line, i) => {
          const isLatest = i === visible.length - 1 && !finalNote;
          return (
            <motion.div
              key={`${line.stageId}-${line.text}`}
              layout
              className="activity-feed__line"
              data-current={isLatest}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: isLatest ? 1 : 0.4, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <span className="activity-feed__bullet" aria-hidden="true">
                {isLatest ? "›" : "·"}
              </span>
              {line.text}
            </motion.div>
          );
        })}
        {finalNote && (
          <motion.div
            key="final-note"
            layout
            className="activity-feed__line"
            data-current="true"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="activity-feed__bullet" aria-hidden="true">
              ›
            </span>
            {finalNote}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
