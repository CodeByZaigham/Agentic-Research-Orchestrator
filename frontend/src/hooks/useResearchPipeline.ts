import { useCallback, useEffect, useRef, useState } from "react";
import { createResearch, getResearch } from "../api/client";
import { ApiError, type ResearchResponse } from "../types";

export type PipelineStatus = "idle" | "running" | "loading-existing" | "success" | "error";

interface State {
  status: PipelineStatus;
  topic: string;
  result: ResearchResponse | null;
  error: ApiError | Error | null;
  elapsedMs: number;
}

const REPORT_PARAM = "report";

function readReportIdFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get(REPORT_PARAM);
}

function writeReportIdToUrl(reportId: string | null) {
  const url = new URL(window.location.href);
  if (reportId) {
    url.searchParams.set(REPORT_PARAM, reportId);
  } else {
    url.searchParams.delete(REPORT_PARAM);
  }
  window.history.replaceState({}, "", url.toString());
}

export function useResearchPipeline() {
  const [state, setState] = useState<State>({
    status: "idle",
    topic: "",
    result: null,
    error: null,
    elapsedMs: 0,
  });

  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);
  const hydratedRef = useRef(false);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    startedAtRef.current = Date.now();
    setState((s) => ({ ...s, elapsedMs: 0 }));
    timerRef.current = window.setInterval(() => {
      setState((s) => ({ ...s, elapsedMs: Date.now() - startedAtRef.current }));
    }, 250);
  }, [stopTimer]);

  const startResearch = useCallback(
    (topic: string) => {
      const trimmed = topic.trim();
      if (!trimmed) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      writeReportIdToUrl(null);
      setState({ status: "running", topic: trimmed, result: null, error: null, elapsedMs: 0 });
      startTimer();

      createResearch(trimmed, controller.signal)
        .then((result) => {
          stopTimer();
          writeReportIdToUrl(result.report_id);
          setState((s) => ({ ...s, status: "success", result, error: null }));
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          stopTimer();
          setState((s) => ({
            ...s,
            status: "error",
            error: err instanceof Error ? err : new Error("Something went wrong."),
          }));
        });
    },
    [startTimer, stopTimer],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    stopTimer();
    writeReportIdToUrl(null);
    setState({ status: "idle", topic: "", result: null, error: null, elapsedMs: 0 });
  }, [stopTimer]);

  // On first mount, if the URL points at a previously generated report,
  // fetch it directly instead of showing the pipeline animation - this is
  // what makes a report link shareable and refresh-safe.
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const existingId = readReportIdFromUrl();
    if (!existingId) return;

    const controller = new AbortController();
    setState((s) => ({ ...s, status: "loading-existing" }));

    getResearch(existingId, controller.signal)
      .then((result) => {
        setState((s) => ({ ...s, status: "success", result, topic: result.topic }));
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        writeReportIdToUrl(null);
        setState((s) => ({
          ...s,
          status: "error",
          error: err instanceof ApiError ? err : new Error("Couldn't find that report."),
        }));
      });

    return () => controller.abort();
  }, []);

  useEffect(() => stopTimer, [stopTimer]);

  return { ...state, startResearch, reset };
}
