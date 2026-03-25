import { useEffect, useMemo, useState } from "react";

import { listIncidents, listMonitorResults, listMonitors } from "./api";

const focusChecklist = [
  "Are any monitors still waiting on their first real check?",
  "Did any monitor cross the incident threshold and open a real issue?",
  "Is the selected monitor giving enough evidence to act without guessing?",
];

function formatCadence(intervalMinutes) {
  return `Every ${intervalMinutes} min`;
}

function formatExpectation(monitor) {
  const substring = monitor.expected_substring ? ` + "${monitor.expected_substring}"` : "";
  return `HTTP ${monitor.expected_status_code}${substring}`;
}

function formatNextRun(value) {
  if (!value) {
    return "Not scheduled";
  }

  const nextRun = new Date(value);

  if (Number.isNaN(nextRun.getTime())) {
    return "Not scheduled";
  }

  return nextRun.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCheckedAt(value) {
  if (!value) {
    return "Waiting for first check";
  }

  const checkedAt = new Date(value);

  if (Number.isNaN(checkedAt.getTime())) {
    return "Waiting for first check";
  }

  return checkedAt.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildEvidence(result) {
  if (!result) {
    return [];
  }

  const outcome = result.status === "healthy" ? "healthy" : result.failure_type ?? "unhealthy";
  const latency = typeof result.latency_ms === "number" ? `${result.latency_ms} ms` : "n/a";
  const statusCode = result.http_status ? `, HTTP ${result.http_status}` : "";
  const reason = result.reason ? `, ${result.reason}` : "";

  return `${formatCheckedAt(result.checked_at)} - ${outcome}, ${latency}${statusCode}${reason}`;
}

function getStatusPresentation(monitor, latestResult, openIncident) {
  if (openIncident) {
    return {
      label: "Needs review",
      className: "status status-warn",
      severity: 0,
    };
  }

  if (latestResult?.status === "unhealthy") {
    return {
      label: "Needs review",
      className: "status status-warn",
      severity: 0,
    };
  }

  if (monitor.status === "paused") {
    return {
      label: "Paused",
      className: "status status-paused",
      severity: 3,
    };
  }

  if (latestResult?.status === "healthy") {
    return {
      label: "Healthy",
      className: "status status-ok",
      severity: 2,
    };
  }

  return {
    label: "Starting",
    className: "status status-starting",
    severity: 1,
  };
}

function buildMonitorViewModel(monitor, latestResult, openIncident) {
  const status = getStatusPresentation(monitor, latestResult, openIncident);
  const latestCheck = latestResult
    ? latestResult.status === "healthy"
      ? `${latestResult.latency_ms} ms`
      : latestResult.reason || latestResult.failure_type || "Unhealthy"
    : "Waiting for first check";

  return {
    id: monitor.monitor_id,
    name: monitor.name,
    url: monitor.target_url,
    alertEmail: monitor.alert_email || "No alert email",
    cadence: formatCadence(monitor.interval_minutes),
    expectation: formatExpectation(monitor),
    nextRun: formatNextRun(monitor.next_check_at),
    latestCheck,
    latestResult,
    openIncident,
    status,
    streak: `${monitor.consecutive_failures} failure / ${monitor.consecutive_successes} success`,
    note: openIncident
      ? "Incident is open because repeated failures crossed the configured threshold."
      : latestResult
        ? "Latest evidence came from the live FastAPI monitor history."
        : "Monitor is saved and waiting for its first outside-in result.",
  };
}

function buildDetailTitle(viewModel) {
  if (viewModel.openIncident) {
    return "Repeated failures crossed the incident threshold.";
  }

  if (viewModel.latestResult?.status === "healthy") {
    return "This monitor is behaving as expected.";
  }

  if (viewModel.status.label === "Paused") {
    return "This monitor is paused by the operator.";
  }

  return "This monitor is waiting for its first real check.";
}

function buildDetailBody(viewModel) {
  if (viewModel.openIncident) {
    return viewModel.openIncident.last_reason || viewModel.note;
  }

  if (viewModel.latestResult?.status === "healthy") {
    return "The latest check matched the expected status rule, so the operator only needs lightweight confirmation here.";
  }

  if (viewModel.status.label === "Paused") {
    return "Paused monitors stay visible in the roster, but they no longer schedule new checks until the operator resumes them.";
  }

  return "New monitors should show exactly what will be checked, which alert inbox will be used, and when the first result should appear.";
}

function buildEvidenceList(viewModel, recentResults) {
  const evidence = recentResults.map(buildEvidence).filter(Boolean);

  if (viewModel.openIncident) {
    evidence.unshift(`Incident opened - ${viewModel.openIncident.opening_reason}`);
  }

  if (evidence.length > 0) {
    return evidence;
  }

  return [
    "Monitor saved through the setup form",
    "First real check will populate evidence here",
    "Incident logic stays quiet until repeated failure occurs",
  ];
}

export function OperatorView({ initialMonitorId, onBack }) {
  const [monitors, setMonitors] = useState([]);
  const [resultsByMonitor, setResultsByMonitor] = useState({});
  const [incidentsByMonitor, setIncidentsByMonitor] = useState({});
  const [selectedMonitorId, setSelectedMonitorId] = useState(initialMonitorId);
  const [dashboardState, setDashboardState] = useState({
    status: "loading",
    message: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setDashboardState({ status: "loading", message: "" });

      try {
        const [monitorsResponse, incidentsResponse] = await Promise.all([
          listMonitors(),
          listIncidents(),
        ]);

        if (cancelled) {
          return;
        }

        const resultEntries = await Promise.all(
          monitorsResponse.map(async (monitor) => {
            const results = await listMonitorResults(monitor.monitor_id, 5);
            return [monitor.monitor_id, results];
          }),
        );

        if (cancelled) {
          return;
        }

        const openIncidentEntries = incidentsResponse
          .filter((incident) => incident.state === "open")
          .map((incident) => [incident.monitor_id, incident]);

        setMonitors(monitorsResponse);
        setResultsByMonitor(Object.fromEntries(resultEntries));
        setIncidentsByMonitor(Object.fromEntries(openIncidentEntries));
        setSelectedMonitorId((current) => current ?? monitorsResponse[0]?.monitor_id ?? null);
        setDashboardState({ status: "ready", message: "" });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setDashboardState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "The operator view could not read from the LinkGuard API.",
        });
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const monitorViewModels = useMemo(() => {
    return [...monitors]
      .map((monitor) =>
        buildMonitorViewModel(
          monitor,
          resultsByMonitor[monitor.monitor_id]?.[0],
          incidentsByMonitor[monitor.monitor_id],
        ),
      )
      .sort((left, right) => {
        const severityDifference = left.status.severity - right.status.severity;

        if (severityDifference !== 0) {
          return severityDifference;
        }

        return left.name.localeCompare(right.name);
      });
  }, [incidentsByMonitor, monitors, resultsByMonitor]);

  const selectedMonitor =
    monitorViewModels.find((monitor) => monitor.id === selectedMonitorId) ??
    monitorViewModels[0] ??
    null;
  const selectedResults = selectedMonitor ? resultsByMonitor[selectedMonitor.id] ?? [] : [];
  const openIncidentCount = monitorViewModels.filter(
    (monitor) => monitor.status.label === "Needs review",
  ).length;
  const healthyCount = monitorViewModels.filter(
    (monitor) => monitor.status.label === "Healthy",
  ).length;

  return (
    <main className="operator-shell">
      <header className="operator-topbar">
        <div>
          <p className="eyebrow">Operator View</p>
          <h1>Quiet confidence for critical links.</h1>
        </div>
        <button className="button button-secondary" type="button" onClick={onBack}>
          Back To Home
        </button>
      </header>

      <section className="operator-overview">
        <article className="operator-stat">
          <span className="metric-label">Monitors under watch</span>
          <strong>{monitorViewModels.length}</strong>
          <p>Saved monitors are read back from the FastAPI control plane, not mocked in the browser.</p>
        </article>
        <article className="operator-stat">
          <span className="metric-label">Healthy right now</span>
          <strong>{healthyCount}</strong>
          <p>Once checks run, healthy links stay visible without crowding the items that need attention.</p>
        </article>
        <article className="operator-stat">
          <span className="metric-label">Attention needed</span>
          <strong>{openIncidentCount}</strong>
          <p>The roster stays sorted by severity so real incidents rise to the top first.</p>
        </article>
      </section>

      <section className="operator-grid">
        <section className="operator-panel operator-panel--wide">
          <div className="panel-heading">
            <div>
              <p className="section-label">Monitor Roster</p>
              <h2>Everything you are actively protecting</h2>
            </div>
            <span className="pill">Live API read</span>
          </div>

          {dashboardState.status === "loading" ? (
            <div className="table-state">
              <p>Loading monitors from FastAPI...</p>
            </div>
          ) : null}

          {dashboardState.status === "error" ? (
            <div className="callout callout-error">
              <strong>Operator view could not load</strong>
              <p>{dashboardState.message}</p>
            </div>
          ) : null}

          {dashboardState.status === "ready" && monitorViewModels.length === 0 ? (
            <div className="table-state">
              <p>No monitors exist yet. Create the first one from the home page to populate this roster.</p>
            </div>
          ) : null}

          {monitorViewModels.length > 0 ? (
            <div className="operator-roster">
              <table className="operator-table">
                <thead>
                  <tr>
                    <th>Monitor</th>
                    <th>Expectation</th>
                    <th>Cadence</th>
                    <th>Latest check</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {monitorViewModels.map((monitor) => (
                    <tr
                      key={monitor.id}
                      className={monitor.id === selectedMonitor?.id ? "operator-row-selected" : ""}
                      onClick={() => setSelectedMonitorId(monitor.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedMonitorId(monitor.id);
                        }
                      }}
                      tabIndex={0}
                    >
                      <td data-label="Monitor">
                        <div className="operator-table__primary">
                          <strong>{monitor.name}</strong>
                          <span>{monitor.note}</span>
                        </div>
                      </td>
                      <td data-label="Expectation">{monitor.expectation}</td>
                      <td data-label="Cadence">{monitor.cadence}</td>
                      <td data-label="Latest check">{monitor.latestCheck}</td>
                      <td data-label="Status">
                        <span className={monitor.status.className}>{monitor.status.label}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <aside className="operator-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Calm Review</p>
              <h2>What the operator checks first</h2>
            </div>
          </div>

          <ul className="operator-checklist">
            {focusChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="callout">
            <strong>Dashboard principle</strong>
            <p>
              This view should reassure users when things are healthy and become specific
              only when action is actually needed.
            </p>
          </div>
        </aside>
      </section>

      <section className="operator-grid">
        <section className="operator-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Selected Monitor</p>
              <h2>{selectedMonitor?.name ?? "Choose a monitor"}</h2>
            </div>
          </div>

          {selectedMonitor ? (
            <>
              <div className="policy-stack operator-detail-grid">
                <div>
                  <span className="preview-label">Target URL</span>
                  <strong>{selectedMonitor.url}</strong>
                </div>
                <div>
                  <span className="preview-label">Alert email</span>
                  <strong>{selectedMonitor.alertEmail}</strong>
                </div>
                <div>
                  <span className="preview-label">Next run</span>
                  <strong>{selectedMonitor.nextRun}</strong>
                </div>
                <div>
                  <span className="preview-label">Current streak</span>
                  <strong>{selectedMonitor.streak}</strong>
                </div>
              </div>

              <div className="callout">
                <strong>{buildDetailTitle(selectedMonitor)}</strong>
                <p>{buildDetailBody(selectedMonitor)}</p>
              </div>

              <ul className="evidence-list operator-evidence-list">
                {buildEvidenceList(selectedMonitor, selectedResults).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : (
            <div className="table-state table-state-tight">
              <p>Select a monitor to inspect its health, cadence, and evidence.</p>
            </div>
          )}
        </section>

        <section className="operator-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Policy Snapshot</p>
              <h2>Why this stays low-noise</h2>
            </div>
          </div>

          <div className="policy-stack">
            <div>
              <span className="preview-label">Incident rule</span>
              <strong>Open after 2 failures</strong>
            </div>
            <div>
              <span className="preview-label">Recovery rule</span>
              <strong>Resolve after 2 successes</strong>
            </div>
            <div>
              <span className="preview-label">First alert channel</span>
              <strong>One email per monitor</strong>
            </div>
            <div>
              <span className="preview-label">Current data path</span>
              <strong>{"React -> FastAPI -> in-memory store"}</strong>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
