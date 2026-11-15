const defaultApiBaseUrl = "https://flarefuzz-api.onrender.com";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl).replace(/\/+$/, "");

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

function parseErrorMessage(response, fallback) {
  const statusText = response?.statusText ? `${response.status} ${response.statusText}`.trim() : fallback;
  return statusText;
}

async function fetchJson(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    let detail = "";

    if (contentType.includes("application/json")) {
      try {
        const payload = await response.json();
        detail = payload?.detail || payload?.message || payload?.error || JSON.stringify(payload);
      } catch {
        detail = "";
      }
    }

    if (!detail) {
      try {
        detail = await response.text();
      } catch {
        detail = "";
      }
    }

    throw new Error(detail ? `API request failed: ${detail}` : parseErrorMessage(response, "Request failed"));
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return response.text();
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeInvestigation(item = {}) {
  const id = item.id ?? item.investigation_id ?? item.code ?? "INV-000";
  const title = item.title ?? item.name ?? "Untitled investigation";
  const domain = item.domain ?? item.category ?? item.subject ?? "General";
  const platform = item.platform ?? item.location ?? item.mission ?? "NASA PSI";
  const relevance = Number(item.relevance ?? item.score ?? 0);
  const readiness = item.readiness ?? (Number.isFinite(relevance) && relevance >= 80 ? "Model-ready" : "Normalized");
  const summary = item.summary ?? item.description ?? item.abstract ?? "No summary provided.";
  const signals = asArray(item.signals ?? item.keywords ?? item.tags).filter(Boolean);

  return {
    id: String(id),
    title,
    domain,
    platform,
    relevance: Number.isFinite(relevance) ? relevance : 0,
    readiness,
    summary,
    signals,
    ...item,
  };
}

function buildDashboardFromInvestigations(rawInvestigations = []) {
  const investigations = asArray(rawInvestigations).map(normalizeInvestigation);

  return {
    metrics: {
      investigations: investigations.length,
      parsedDocuments: 0,
      highRelevance: investigations.filter((item) => Number(item.relevance) >= 80).length,
      modeledSignals: investigations.filter((item) => asArray(item.signals).length > 0).length,
    },
    investigations,
    pipeline: {
      lastRun: "Live API",
      runId: "api-live",
      stages: [
        { name: "Discover", detail: "PSI investigation records", state: "Complete", count: `${investigations.length} records`, tone: "cyan" },
        { name: "Parse", detail: "Reports & metadata", state: "Complete", count: "API selected", tone: "gold" },
        { name: "Normalize", detail: "Units, terms & conditions", state: "Complete", count: `${investigations.length} records`, tone: "green" },
        { name: "Interpret", detail: "Safety relevance signals", state: "Complete", count: `${investigations.filter((item) => Number(item.relevance) >= 80).length} signals`, tone: "green" },
      ],
      normalizations: [
        { label: "NASA PSI source records", value: `${investigations.length} investigations` },
        { label: "Investigation ranking", value: "Relevance weighted" },
        { label: "Model compatibility", value: "Scientific series ready" },
      ],
      documents: [],
    },
    batches: investigations.slice(0, 3).map((item, index) => ({
      id: `BATCH-${index + 1}`,
      name: `${item.title} synthesis`,
      status: index === 0 ? "Evidence mapped" : "Review ready",
      updated: "Live",
      documents: 1 + index,
      result: item.summary,
      targets: [item.domain, item.platform],
      color: index % 2 === 0 ? "teal" : "yellow",
    })),
    earthApplications: [],
    experiments: investigations.map((item) => ({
      id: item.id,
      title: item.title,
      dataType: "measured",
      sourceName: item.platform,
      provenance: item.platform,
      modelLimitations: "Model limits are reported by the connected API when available.",
      fuel: "Unknown",
      oxidizer: "Unknown",
      pressureKPa: null,
      measurements: {
        timeS: [],
        dropletDiameterM: [],
        flameDiameterM: [],
        radianceAU: [],
      },
      predictions: {
        timeS: [],
        flameDiameterM: [],
      },
      dataQualityWarnings: [],
      ...item,
    })),
  };
}

export async function fetchDashboard() {
  if (!apiBaseUrl) {
    return { data: emptyDashboard, source: "unconfigured" };
  }

  try {
    const investigationsResponse = await fetchJson(`${apiBaseUrl}/api/investigations`);
    const rawInvestigations = asArray(
      Array.isArray(investigationsResponse)
        ? investigationsResponse
        : investigationsResponse?.investigations ?? investigationsResponse?.items ?? []
    );

    if (!rawInvestigations.length) {
      throw new Error("No investigations were returned by the API.");
    }

    return { data: buildDashboardFromInvestigations(rawInvestigations), source: "api" };
  } catch (error) {
    const legacyResponse = await fetchJson(`${apiBaseUrl}/api/dashboard`).catch(() => null);

    if (!legacyResponse || !Array.isArray(legacyResponse.investigations) || !legacyResponse.pipeline || !Array.isArray(legacyResponse.batches)) {
      throw new Error(error instanceof Error ? error.message : "Dashboard API returned a malformed payload.");
    }

    return { data: legacyResponse, source: "api" };
  }
}

export async function fetchInvestigations() {
  return fetchJson(`${apiBaseUrl}/api/investigations`);
}

export async function fetchInvestigationById(investigationId) {
  if (!investigationId) {
    throw new Error("An investigation ID is required.");
  }

  return fetchJson(`${apiBaseUrl}/api/investigations/${encodeURIComponent(investigationId)}`);
}

export async function ingestDataset(payloadOrFormData) {
  const isFormData = typeof FormData !== "undefined" && payloadOrFormData instanceof FormData;
  const isJsonBody = payloadOrFormData && typeof payloadOrFormData === "object" && !isFormData;

  return fetchJson(`${apiBaseUrl}/api/datasets/ingest`, {
    method: "POST",
    ...(isFormData
      ? { body: payloadOrFormData }
      : {
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(isJsonBody ? payloadOrFormData : {}),
        }),
  });
}

export async function fetchDatasetQuality(datasetId) {
  if (!datasetId) {
    throw new Error("A dataset ID is required.");
  }

  return fetchJson(`${apiBaseUrl}/api/datasets/${encodeURIComponent(datasetId)}/quality`);
}

export async function fetchDatasetSeries(datasetId) {
  if (!datasetId) {
    throw new Error("A dataset ID is required.");
  }

  return fetchJson(`${apiBaseUrl}/api/datasets/${encodeURIComponent(datasetId)}/series`);
}

export async function fitModel(payload) {
  return fetchJson(`${apiBaseUrl}/api/models/fit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload || {}),
  });
}

export async function fetchModelRun(runId) {
  if (!runId) {
    throw new Error("A model run ID is required.");
  }

  return fetchJson(`${apiBaseUrl}/api/models/runs/${encodeURIComponent(runId)}`);
}

export async function askScientificQuestion(payload) {
  return fetchJson(`${apiBaseUrl}/api/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload || {}),
  });
}

export { apiBaseUrl };

export { defaultApiBaseUrl };

export default {
  apiBaseUrl,
  emptyDashboard,
  fetchDashboard,
  fetchInvestigations,
  fetchInvestigationById,
  ingestDataset,
  fetchDatasetQuality,
  fetchDatasetSeries,
  fitModel,
  fetchModelRun,
  askScientificQuestion,
};
