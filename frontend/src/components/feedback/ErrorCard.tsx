import { motion } from "framer-motion";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { ApiError } from "../../types";
import "./ErrorCard.css";

interface ErrorCardProps {
  error: Error;
  topic: string;
  onRetry: () => void;
  onReset: () => void;
}

const CODE_MESSAGES: Record<string, string> = {
  pipeline_failed: "The pipeline stopped before it finished.",
  pdf_generation_failed: "The report finished, but the PDF failed to render.",
  report_not_found: "That report doesn't exist — it may have expired or the link is wrong.",
};

export default function ErrorCard({ error, topic, onRetry, onReset }: ErrorCardProps) {
  const isApiError = error instanceof ApiError;
  const heading = isApiError ? CODE_MESSAGES[error.code] ?? "The request failed." : "The request failed.";

  return (
    <motion.section
      className="error-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      role="alert"
    >
      <div className="error-card__icon">
        <TriangleAlert size={20} strokeWidth={2} />
      </div>
      <h2 className="error-card__heading">{heading}</h2>
      <p className="error-card__detail mono">{error.message}</p>

      <div className="error-card__actions">
        {topic && (
          <button type="button" className="error-card__retry" onClick={onRetry}>
            <RefreshCw size={15} strokeWidth={2.25} />
            <span>Try “{topic}” again</span>
          </button>
        )}
        <button type="button" className="error-card__reset" onClick={onReset}>
          Start over
        </button>
      </div>
    </motion.section>
  );
}
