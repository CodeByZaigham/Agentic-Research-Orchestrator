import { useEffect, useRef, useState } from "react";
import { animate, motion } from "framer-motion";
import "./ScoreGauge.css";

interface ScoreGaugeProps {
  score: number | null;
  qualityLevel: string | null;
  meetsThreshold: boolean;
  threshold: number;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ScoreGauge({ score, qualityLevel, meetsThreshold, threshold }: ScoreGaugeProps) {
  const [display, setDisplay] = useState(0);
  const mountedAt = useRef(false);

  useEffect(() => {
    if (score == null) return;
    const controls = animate(0, score, {
      duration: 1.1,
      delay: mountedAt.current ? 0 : 0.3,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    mountedAt.current = true;
    return () => controls.stop();
  }, [score]);

  const fraction = score != null ? score / 100 : 0;

  return (
    <div className="score-gauge">
      <div className="score-gauge__ring-wrap">
        <svg viewBox="0 0 130 130" className="score-gauge__svg">
          <circle className="score-gauge__track" cx="65" cy="65" r={RADIUS} />
          <motion.circle
            className="score-gauge__fill"
            data-pass={meetsThreshold}
            cx="65"
            cy="65"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - fraction) }}
            transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
          {/* Threshold tick - marks the quality bar on the ring itself */}
          <line
            className="score-gauge__tick"
            x1="65"
            y1="6"
            x2="65"
            y2="16"
            transform={`rotate(${(threshold / 100) * 360} 65 65)`}
          />
        </svg>
        <div className="score-gauge__center">
          <span className="score-gauge__number mono">{score != null ? display : "—"}</span>
          <span className="score-gauge__denominator mono">/100</span>
        </div>
      </div>

      <div className="score-gauge__meta">
        {qualityLevel && <span className="score-gauge__level">{qualityLevel}</span>}
        <span className="score-gauge__pill" data-pass={meetsThreshold}>
          {meetsThreshold ? "Cleared the bar" : "Below the bar"}
        </span>
      </div>
    </div>
  );
}
