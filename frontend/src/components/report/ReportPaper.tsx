import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./ReportPaper.css";

interface ReportPaperProps {
  topic: string;
  report: string;
  generatedAt: string;
  reportId: string;
}

export default function ReportPaper({ topic, report, generatedAt, reportId }: ReportPaperProps) {
  const date = new Date(generatedAt);
  const dateLabel = Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  return (
    <article className="report-paper" aria-label={`Research report: ${topic}`}>
      <div className="report-paper__masthead mono">
        <span>Research Report</span>
        <span>{dateLabel ?? ""}</span>
      </div>
      <div className="report-paper__body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
      </div>
      <div className="report-paper__footer mono">
        <span>Report {reportId}</span>
        <span>Agentic Research Orchestrator</span>
      </div>
    </article>
  );
}
