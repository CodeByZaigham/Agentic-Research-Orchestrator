"""convert the Markdown produced by the writer/checker chains into styled
HTML, then render that HTML to a PDF with xhtml2pdf. xhtml2pdf is pure
Python (backed by reportlab), so this works without any system-level
dependencies (no wkhtmltopdf / Pango / Cairo installs required), which keeps
deployment simple.
"""
from __future__ import annotations

import html
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import markdown as md
from xhtml2pdf import pisa

from config import get_settings
from exceptions import PDFGenerationError

logger = logging.getLogger(__name__)

_MD_EXTENSIONS = ["tables", "fenced_code", "sane_lists", "nl2br"]

_CSS = """
@page {
    size: A4;
    margin: 2.4cm 2.1cm 2.6cm 2.1cm;
    @frame footer_frame {
        -pdf-frame-content: footer_content;
        bottom: 1cm;
        margin-left: 2.1cm;
        margin-right: 2.1cm;
        height: 1.2cm;
    }
}
body {
    font-family: Helvetica, Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.5;
    color: #22252b;
}
.cover {
    text-align: center;
    margin-top: 6cm;
}
.cover .eyebrow {
    font-size: 10pt;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #6b7280;
}
.cover h1 {
    font-size: 24pt;
    margin: 0.6cm 0;
    color: #111827;
}
.cover .meta {
    font-size: 10pt;
    color: #6b7280;
    margin-top: 0.4cm;
}
.cover .score-badge {
    display: inline-block;
    margin-top: 1cm;
    padding: 6px 18px;
    border: 1.4pt solid #111827;
    font-size: 12pt;
    color: #111827;
}
h1 {
    font-size: 17pt;
    color: #111827;
    margin-top: 22px;
    border-bottom: 1pt solid #d1d5db;
    padding-bottom: 4px;
}
h2 { font-size: 14pt; color: #1f2937; margin-top: 18px; }
h3 { font-size: 12pt; color: #1f2937; margin-top: 14px; }
p { margin: 6px 0; text-align: justify; }
ul, ol { margin: 6px 0 6px 18px; }
li { margin: 3px 0; }
table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9.5pt; }
th { background-color: #f3f4f6; border: 0.75pt solid #d1d5db; padding: 5px 7px; text-align: left; }
td { border: 0.75pt solid #d1d5db; padding: 5px 7px; }
blockquote { border-left: 2pt solid #d1d5db; margin: 8px 0; padding: 4px 12px; color: #4b5563; }
code { font-family: Courier, monospace; background-color: #f3f4f6; padding: 1px 3px; font-size: 9pt; }
pre { background-color: #f3f4f6; padding: 8px; font-size: 9pt; }
a { color: #1d4ed8; }
.section-break { page-break-before: always; }
#footer_content { font-size: 8pt; color: #9ca3af; text-align: center; }
"""


def _render_html(
    *,
    topic: str,
    report_md: str,
    evaluation_md: Optional[str],
    score: Optional[int],
    quality_level: Optional[str],
    report_id: str,
    generated_at: datetime,
) -> str:
    report_html = md.markdown(report_md, extensions=_MD_EXTENSIONS)
    safe_topic = html.escape(topic)
    safe_report_id = html.escape(report_id)

    score_html = ""
    if score is not None:
        label = f"{score}/100"
        if quality_level:
            label += f" &middot; {html.escape(quality_level)}"
        score_html = f'<div class="score-badge">Quality Score: {label}</div>'

    cover = f"""
    <div class="cover">
        <div class="eyebrow">Research Report</div>
        <h1>{safe_topic}</h1>
        <div class="meta">Generated {generated_at.strftime('%B %d, %Y at %H:%M UTC')}</div>
        <div class="meta">Report ID: {safe_report_id}</div>
        {score_html}
    </div>
    """

    body = cover + '<div class="section-break"></div>' + report_html

    if evaluation_md:
        evaluation_html = md.markdown(evaluation_md, extensions=_MD_EXTENSIONS)
        body += '<div class="section-break"></div>' + evaluation_html

    footer = (
        '<div id="footer_content">'
        f"Agentic Research Orchestrator &middot; Report {safe_report_id} &middot; "
        "Page <pdf:pagenumber /> of <pdf:pagecount />"
        "</div>"
    )

    return f"<html><head><meta charset='utf-8' /><style>{_CSS}</style></head><body>{footer}{body}</body></html>"


def generate_report_pdf(
    *,
    report_id: str,
    topic: str,
    report_md: str,
    evaluation_md: Optional[str] = None,
    score: Optional[int] = None,
    quality_level: Optional[str] = None,
) -> Path:
    settings = get_settings()
    settings.reports_dir.mkdir(parents=True, exist_ok=True)
    output_path = settings.reports_dir / f"{report_id}.pdf"

    html_doc = _render_html(
        topic=topic,
        report_md=report_md,
        evaluation_md=evaluation_md,
        score=score,
        quality_level=quality_level,
        report_id=report_id,
        generated_at=datetime.now(timezone.utc),
    )

    try:
        with output_path.open("wb") as f:
            result = pisa.CreatePDF(html_doc, dest=f)
    except Exception as exc:  # noqa: BLE001
        logger.exception("PDF generation crashed for report_id=%s", report_id)
        raise PDFGenerationError(str(exc)) from exc

    if result.err:
        logger.error("xhtml2pdf reported %s error(s) for report_id=%s", result.err, report_id)
        raise PDFGenerationError(f"xhtml2pdf reported {result.err} error(s) while rendering the PDF.")

    logger.info("Generated PDF for report_id=%s at %s", report_id, output_path)
    return output_path
