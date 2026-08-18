import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./EvaluationPanel.css";

interface EvaluationPanelProps {
  evaluation: string;
}

export default function EvaluationPanel({ evaluation }: EvaluationPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="evaluation-panel">
      <button
        type="button"
        className="evaluation-panel__toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>Full critique from the evaluator</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={16} strokeWidth={2} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="evaluation-panel__content-wrap"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="evaluation-panel__content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{evaluation}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
