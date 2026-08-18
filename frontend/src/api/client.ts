import { ApiError, type ApiErrorBody, type ResearchResponse } from "../types";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8000";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let body: ApiErrorBody;
    try {
      body = await res.json();
    } catch {
      body = { error: "unknown_error", detail: res.statusText };
    }
    throw new ApiError(res.status, body);
  }
  return res.json() as Promise<T>;
}

export async function createResearch(topic: string, signal?: AbortSignal): Promise<ResearchResponse> {
  const res = await fetch(`${BASE_URL}/api/research`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
    signal,
  });
  return handle<ResearchResponse>(res);
}

export async function getResearch(reportId: string, signal?: AbortSignal): Promise<ResearchResponse> {
  const res = await fetch(`${BASE_URL}/api/research/${encodeURIComponent(reportId)}`, { signal });
  return handle<ResearchResponse>(res);
}

export function downloadUrl(reportId: string): string {
  return `${BASE_URL}/api/research/${encodeURIComponent(reportId)}/download`;
}

export { BASE_URL as apiBaseUrl };
