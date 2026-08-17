const raw = Number(import.meta.env.VITE_QUALITY_THRESHOLD);
export const QUALITY_THRESHOLD = Number.isFinite(raw) && raw > 0 && raw <= 100 ? raw : 75;
