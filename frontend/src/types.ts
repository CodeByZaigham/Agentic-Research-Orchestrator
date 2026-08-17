// Mirrors backend/schema.py exactly. Keep in sync if the API changes.

export interface IterationLog {
  iteration: number;
  score: number | null;
  quality_level: string | null;
}

export interface ResearchResponse {
  report_id: string;
  topic: string;
  report: string;
  evaluation: string;
  score: number | null;
  quality_level: string | null;
  meets_quality_threshold: boolean;
  iterations: number;
  iteration_history: IterationLog[];
  pdf_available: boolean;
  pdf_download_url: string | null;
  generated_at: string;
}

export interface ApiErrorBody {
  error: string;
  detail?: string;
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, body: ApiErrorBody) {
    super(body.detail || body.error || "The request failed.");
    this.name = "ApiError";
    this.status = status;
    this.code = body.error;
  }
}
