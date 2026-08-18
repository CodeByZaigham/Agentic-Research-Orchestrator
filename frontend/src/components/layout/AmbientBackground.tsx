import { useEffect, useRef } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./AmbientBackground.css";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: "signal" | "amber" | "mist";
}

const COLORS: Record<Node["hue"], string> = {
  signal: "87, 194, 206",
  amber: "227, 162, 76",
  mist: "144, 150, 172",
};

/** A quiet field of drifting nodes, occasionally linking to a neighbour -
 * the dormant version of the pipeline diagram that appears once research
 * starts. Opacity stays low throughout; this is atmosphere, not content. */
export default function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let nodes: Node[] = [];
    let raf = 0;

    const NODE_COUNT_PER_PX = 1 / 26000;
    const LINK_DIST = 150;

    function resize() {
      const el = canvas!;
      width = el.clientWidth;
      height = el.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.width = width * dpr;
      el.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(width * height * NODE_COUNT_PER_PX);
      nodes = Array.from({ length: count }, () => {
        const hues: Node["hue"][] = ["mist", "mist", "mist", "signal", "amber"];
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          r: Math.random() * 1.3 + 0.6,
          hue: hues[Math.floor(Math.random() * hues.length)],
        };
      });
    }

    function frame() {
      ctx!.clearRect(0, 0, width, height);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = width + 20;
        if (n.x > width + 20) n.x = -20;
        if (n.y < -20) n.y = height + 20;
        if (n.y > height + 20) n.y = -20;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.06;
            ctx!.strokeStyle = `rgba(${COLORS.mist}, ${alpha})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      for (const n of nodes) {
        ctx!.fillStyle = `rgba(${COLORS[n.hue]}, ${n.hue === "mist" ? 0.35 : 0.5})`;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);

    if (reducedMotion) {
      frame();
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="ambient-bg" aria-hidden="true" />;
}
