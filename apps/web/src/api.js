const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

function normalizeError(detail, fallbackMessage) {
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item.msg || item.message || JSON.stringify(item))
      .join("; ");
  }

  return fallbackMessage;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let payload = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw new Error(normalizeError(payload?.detail, `Request failed with ${response.status}`));
  }

  return response.json();
}

export async function createMonitor(draft) {
  return request("/monitors", {
    method: "POST",
    body: JSON.stringify({
      name: draft.name.trim(),
      target_url: draft.url.trim(),
      interval_minutes: Number(draft.cadence),
      timeout_seconds: 10,
      expected_status_code: Number(draft.statusCode),
      expected_substring: draft.bodyPhrase.trim() || null,
      alert_email: draft.alertEmail.trim() || null,
    }),
  });
}

export async function listMonitors() {
  return request("/monitors");
}

export async function listIncidents() {
  return request("/incidents");
}

export async function listMonitorResults(monitorId, limit = 5) {
  const query = new URLSearchParams({ limit: String(limit) });
  return request(`/monitors/${monitorId}/results?${query.toString()}`);
}
