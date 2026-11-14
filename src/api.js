import { demoDashboard } from "./data.js";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");

export const emptyDashboard = {
  metrics: {
    investigations: 0,
    parsedDocuments: 0,
    highRelevance: 0,
    modeledSignals: 0,
  },
  investigations: [],
  pipeline: {
    lastRun: "No live runs yet",
    runId: "",
    stages: [
      { name: "Discover", detail: "PSI investigation records", state: "Awaiting API", count: "0 records", tone: "cyan" },
      { name: "Parse", detail: "Reports & metadata", state: "Awaiting API", count: "0 documents", tone: "gold" },
      { name: "Normalize", detail: "Units, terms & conditions", state: "Awaiting API", count: "0 records", tone: "green" },
      { name: "Interpret", detail: "Safety relevance signals", state: "Awaiting API", count: "0 signals", tone: "green" },
    ],
    normalizations: [],
    documents: [],
  },
  batches: [],
  earthApplications: [],
};

export async function fetchDashboard() {
  if (!apiBaseUrl) {
    return { data: emptyDashboard, source: "unconfigured" };
  }

  const response = await fetch(`${apiBaseUrl}/api/dashboard`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Dashboard API returned ${response.status} ${response.statusText}`.trim());
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.investigations) || !data.pipeline || !Array.isArray(data.batches)) {
    throw new Error("Dashboard API response is missing investigations, pipeline, or batches.");
  }
  if (data.experiments !== undefined && !Array.isArray(data.experiments)) {
    throw new Error("Dashboard API field 'experiments' must be an array when provided.");
  }
  return { data, source: "api" };
}
