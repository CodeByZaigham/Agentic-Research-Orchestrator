import { useState } from "react";
import { Check, Download, Link2 } from "lucide-react";
import "./ResultActions.css";

interface ResultActionsProps {
  downloadHref: string | null;
  reportId: string;
}

export default function ResultActions({ downloadHref, reportId }: ResultActionsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API can be unavailable (older browsers, insecure context) -
      // fail quietly rather than showing a broken "Copied" state.
    }
  }

  return (
    <div className="result-actions">
      {downloadHref ? (
        <a className="result-actions__primary" href={downloadHref} download={`${reportId}.pdf`}>
          <Download size={16} strokeWidth={2.25} />
          <span>Download PDF</span>
        </a>
      ) : (
        <button type="button" className="result-actions__primary" disabled>
          <Download size={16} strokeWidth={2.25} />
          <span>PDF unavailable</span>
        </button>
      )}
      <button type="button" className="result-actions__secondary" onClick={handleCopy}>
        {copied ? <Check size={15} strokeWidth={2.25} /> : <Link2 size={15} strokeWidth={2.25} />}
        <span>{copied ? "Link copied" : "Copy link"}</span>
      </button>
    </div>
  );
}
