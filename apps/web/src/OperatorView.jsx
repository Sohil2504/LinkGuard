import { useState } from "react";

const sampleMonitors = [
  {
    id: "sample-coaching-booking",
    name: "Coaching booking page",
    cadence: "Every 1 min",
    status: "Needs review",
    latency: "Timeout",
    expectation: 'HTTP 200 + "Book now"',
    note: "Repeated timeout triggered an incident after the second failed check.",
    alertEmail: "ops@example.com",
    url: "https://coach.example.com/book",
    nextRun: "In 36 seconds",
    streak: "2 consecutive failures",
    detailTitle: "Timeouts crossed the incident threshold.",
    detailBody:
      "The first timeout was recorded as evidence only. The second consecutive timeout opened an incident so the operator sees a real issue, not a transient blip.",
    evidence: [
      "18:42:15 - timeout after 10 seconds",
      "18:47:18 - timeout after 10 seconds",
      "18:47:19 - incident opened and email queued",
    ],
  },
  {
    id: "sample-newsletter-waitlist",
    name: "Newsletter waitlist",
    cadence: "Every 15 min",
    status: "Healthy",
    latency: "231 ms",
    expectation: 'HTTP 200 + "Join"',
    note: "Steady response time over the last 24 hours.",
    alertEmail: "ops@example.com",
    url: "https://join.example.com/waitlist",
    nextRun: "In 9 minutes",
    streak: "24 healthy checks",
    detailTitle: "Stable and low attention.",
    detailBody:
      "This monitor is behaving exactly as expected, so the operator only needs lightweight confidence data instead of an incident workflow.",
    evidence: [
      "18:31:02 - healthy response in 231 ms",
      "18:16:03 - healthy response in 244 ms",
      "18:01:05 - healthy response in 228 ms",
    ],
  },
];

const focusChecklist = [
  "Are any monitors waiting on a first check after setup?",
  "Did any monitor cross the incident threshold?",
  "Is the evidence clear enough to act without guessing?",
];

function buildPrimaryMonitor(monitorDraft) {
  return {
    id: "draft-monitor",
    name: monitorDraft.name || "Untitled monitor",
    cadence: `Every ${monitorDraft.cadence || "5"} min`,
    status: "Starting",
    latency: "Waiting for first check",
    expectation: `HTTP ${monitorDraft.statusCode || "200"}${
      monitorDraft.bodyPhrase ? ` + "${monitorDraft.bodyPhrase}"` : ""
    }`,
    note: `LinkGuard will monitor ${monitorDraft.url || "this URL"} and notify ${monitorDraft.alertEmail || "your alert inbox"}.`,
    alertEmail: monitorDraft.alertEmail || "ops@example.com",
    url: monitorDraft.url || "https://example.com",
    nextRun: "First check queued after save",
    streak: "No completed checks yet",
    detailTitle: "Waiting for the first outside-in check.",
    detailBody:
      "New monitors should feel calm. The operator should immediately see what will be checked, who gets notified, and when the first result should land.",
    evidence: [
      "Monitor saved from the setup flow",
      "First check will run on the selected cadence",
      "Incident logic begins only after real failures occur",
    ],
  };
}

function getStatusClassName(status) {
  if (status === "Healthy") {
    return "status status-ok";
  }

  if (status === "Starting") {
    return "status status-starting";
  }

  return "status status-warn";
}

function getStatusSeverity(status) {
  if (status === "Needs review") {
    return 0;
  }

  if (status === "Starting") {
    return 1;
  }

  return 2;
}

export function OperatorView({ monitorDraft, onBack }) {
  const monitors = [buildPrimaryMonitor(monitorDraft), ...sampleMonitors].sort((left, right) => {
    const severityDifference =
      getStatusSeverity(left.status) - getStatusSeverity(right.status);

    if (severityDifference !== 0) {
      return severityDifference;
    }

    return left.name.localeCompare(right.name);
  });
  const healthyCount = monitors.filter((monitor) => monitor.status === "Healthy").length;
  const attentionCount = monitors.filter((monitor) => monitor.status === "Needs review").length;
  const [selectedMonitorId, setSelectedMonitorId] = useState(monitors[0].id);
  const selectedMonitor =
    monitors.find((monitor) => monitor.id === selectedMonitorId) ?? monitors[0];

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
          <strong>{monitors.length}</strong>
          <p>One newly created monitor plus existing revenue-critical links.</p>
        </article>
        <article className="operator-stat">
          <span className="metric-label">Healthy right now</span>
          <strong>{healthyCount}</strong>
          <p>Healthy monitors stay visible, but they do not crowd out the ones that need review.</p>
        </article>
        <article className="operator-stat">
          <span className="metric-label">Attention needed</span>
          <strong>{attentionCount}</strong>
          <p>The roster is sorted by severity so the operator sees the highest-risk item first.</p>
        </article>
      </section>

      <section className="operator-grid">
        <section className="operator-panel operator-panel--wide">
          <div className="panel-heading">
            <div>
              <p className="section-label">Monitor Roster</p>
              <h2>Everything you are actively protecting</h2>
            </div>
            <span className="pill">Sorted by severity</span>
          </div>

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
                {monitors.map((monitor) => (
                  <tr
                    key={monitor.id}
                    className={
                      monitor.id === selectedMonitor.id ? "operator-row-selected" : ""
                    }
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
                    <td data-label="Latest check">{monitor.latency}</td>
                    <td data-label="Status">
                      <span className={getStatusClassName(monitor.status)}>{monitor.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
              <h2>{selectedMonitor.name}</h2>
            </div>
          </div>

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
            <strong>{selectedMonitor.detailTitle}</strong>
            <p>{selectedMonitor.detailBody}</p>
          </div>

          <ul className="evidence-list operator-evidence-list">
            {selectedMonitor.evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
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
          </div>
        </section>
      </section>
    </main>
  );
}
