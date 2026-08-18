import { motion } from "framer-motion";
import type { ResearchResponse } from "../../types";
import { downloadUrl } from "../../api/client";
import ReportPaper from "./ReportPaper";
import ScoreGauge from "./ScoreGauge";
import IterationTimeline from "./IterationTimeline";
import EvaluationPanel from "./EvaluationPanel";
import ResultActions from "./ResultActions";
import "./ResultLayout.css";

interface ResultLayoutProps {
  result: ResearchResponse;
  threshold: number;
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function ResultLayout({ result, threshold }: ResultLayoutProps) {
  return (
    <motion.section
      className="result-layout"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
      aria-label="Research result"
    >
      <motion.aside className="result-layout__sidebar" variants={fadeUp}>
        <div className="result-layout__sidebar-panel">
          <ScoreGauge
            score={result.score}
            qualityLevel={result.quality_level}
            meetsThreshold={result.meets_quality_threshold}
            threshold={threshold}
          />
        </div>

        <ResultActions
          downloadHref={result.pdf_available ? downloadUrl(result.report_id) : null}
          reportId={result.report_id}
        />

        {result.iteration_history.length > 1 && (
          <div className="result-layout__sidebar-panel">
            <IterationTimeline history={result.iteration_history} threshold={threshold} />
          </div>
        )}

        <EvaluationPanel evaluation={result.evaluation} />
      </motion.aside>

      <motion.div className="result-layout__main" variants={fadeUp}>
        <ReportPaper
          topic={result.topic}
          report={result.report}
          generatedAt={result.generated_at}
          reportId={result.report_id}
        />
      </motion.div>
    </motion.section>
  );
}
