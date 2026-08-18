import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import "./TopicStage.css";

interface TopicStageProps {
  onSubmit: (topic: string) => void;
}

const EXAMPLES = [
  "The economics of vertical farming",
  "How mRNA vaccines are manufactured",
  "Why interest rates affect the housing market",
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

const rise = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function TopicStage({ onSubmit }: TopicStageProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(value);
  }

  return (
    <motion.section
      className="topic-stage"
      variants={container}
      initial="hidden"
      animate="show"
      aria-labelledby="topic-heading"
    >
      <motion.p className="eyebrow topic-stage__eyebrow" variants={rise}>
        Agentic research orchestrator
      </motion.p>

      <motion.h1 id="topic-heading" className="topic-stage__headline" variants={rise}>
        It researches. It writes.
        <br />
        <em>Then it checks its own work.</em>
      </motion.h1>

      <motion.p className="topic-stage__sub" variants={rise}>
        Give it a topic. A search agent, a reading agent, and a writer run in sequence, then a
        critic scores the draft and sends it back for revision until it clears the bar — so what
        reaches you has already been judged once.
      </motion.p>

      <motion.form className="topic-stage__form" variants={rise} onSubmit={handleSubmit}>
        <div className="topic-stage__input-wrap">
          <input
            type="text"
            className="topic-stage__input"
            placeholder="e.g. The economics of vertical farming"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={300}
            aria-label="Research topic"
            autoFocus
          />
          <button type="submit" className="topic-stage__submit" disabled={!value.trim()}>
            <span>Begin research</span>
            <ArrowRight size={16} strokeWidth={2.25} />
          </button>
        </div>
      </motion.form>

      <motion.div className="topic-stage__examples" variants={rise}>
        <span className="topic-stage__examples-label mono">Try</span>
        {EXAMPLES.map((ex) => (
          <button
            type="button"
            key={ex}
            className="topic-stage__chip"
            onClick={() => {
              setValue(ex);
              onSubmit(ex);
            }}
          >
            {ex}
          </button>
        ))}
      </motion.div>
    </motion.section>
  );
}
