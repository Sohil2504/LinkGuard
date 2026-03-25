import { useState } from "react";
import { OperatorView } from "./OperatorView";

const steps = [
  {
    id: "01",
    title: "Pick the page that makes you money",
    body: "Start with one URL that matters: checkout, booking, application, waitlist, or promo landing page.",
  },
  {
    id: "02",
    title: "Define what healthy looks like",
    body: "Choose status code, timeout, and an optional body phrase so the check is meaningful, not superficial.",
  },
  {
    id: "03",
    title: "Let incidents, not blips, drive alerts",
    body: "LinkGuard keeps evidence from each run and only opens an incident after repeated failure.",
  },
];

const architecture = [
  "API Gateway -> FastAPI Lambda",
  "Scheduler -> dispatcher -> SQS",
  "Worker Lambda -> result + incident update",
  "DynamoDB -> monitor, result, incident state",
];

export function App() {
  const [activeScreen, setActiveScreen] = useState("landing");
  const [monitorDraft, setMonitorDraft] = useState({
    name: "Spring checkout",
    url: "https://example.com/checkout",
    cadence: "5",
    statusCode: "200",
    bodyPhrase: "Checkout",
    alertEmail: "ops@example.com",
  });

  function updateDraft(field, value) {
    setMonitorDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function isDraftValid(draft) {
    const expectedStatusCode = Number(draft.statusCode);

    return (
      draft.name.trim().length >= 3 &&
      draft.url.trim().length > 0 &&
      Number.isInteger(expectedStatusCode) &&
      expectedStatusCode >= 100 &&
      expectedStatusCode <= 599 &&
      draft.alertEmail.trim().length > 0
    );
  }

  function handleMonitorCreate(event) {
    event.preventDefault();

    if (!isDraftValid(monitorDraft)) {
      return;
    }

    setActiveScreen("operator");
  }

  if (activeScreen === "operator") {
    return (
      <OperatorView monitorDraft={monitorDraft} onBack={() => setActiveScreen("landing")} />
    );
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Revenue Link Monitoring</p>
          <h1>Protect the links that make you money.</h1>
          <p className="lede">
            LinkGuard starts simple: paste a critical URL, define what healthy looks like,
            and let the system watch it from our infrastructure. No required integrations in
            v1, just outside-in checks that turn repeated failure into a real incident.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#first-monitor">
              Design The First Monitor
            </a>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => setActiveScreen("operator")}
            >
              Open Sample Dashboard
            </button>
          </div>
          <div className="signal-strip">
            <span>Paste URL, no integration required</span>
            <span>Outside-in checks</span>
            <span>Incident-based alerts</span>
            <span>AWS-native backend</span>
          </div>
        </div>

        <aside className="signal-board">
          <div className="signal-board__header">
            <span className="signal-board__label">Live signal board</span>
            <span className="signal-board__time">Updated 18:47 ET</span>
          </div>

          <div className="signal-board__metrics">
            <article>
              <span className="metric-label">Healthy monitors</span>
              <strong>14</strong>
            </article>
            <article>
              <span className="metric-label">Open incidents</span>
              <strong>1</strong>
            </article>
            <article>
              <span className="metric-label">Mean detection</span>
              <strong>2.6 min</strong>
            </article>
          </div>

          <div className="signal-board__incident">
            <p className="incident-kicker">Current operator focus</p>
            <h2>Coaching booking page</h2>
            <p>
              Repeated timeouts detected. Incident opened after the second consecutive failure
              to avoid a false alarm from a single transient blip.
            </p>
            <div className="incident-tags">
              <span className="tag tag-alert">Incident open</span>
              <span className="tag">Timeout</span>
              <span className="tag">Email queued</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="section-label">How People Use It</p>
          <h2>One clear operator loop</h2>
          <p>
            LinkGuard should feel calm to use. You configure one meaningful check, let the
            system watch it, and only pay attention when the failure crosses the incident line.
          </p>
        </div>

        <div className="steps-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.id}>
              <span className="step-id">{step.id}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section blueprint" id="first-monitor">
        <div className="section-heading">
          <p className="section-label">First Monitor</p>
          <h2>What the first setup flow actually asks for</h2>
          <p>
            V1 should be dead simple: one important URL, one definition of healthy, and one
            alert email. No required integrations. The user pastes the link here and
            LinkGuard monitors it from our infrastructure.
          </p>
        </div>

        <div className="builder">
          <form className="blueprint-card builder-form" onSubmit={handleMonitorCreate}>
            <div className="panel-heading">
              <div>
                <p className="section-label">Setup Form</p>
                <h3>Draft the first monitor</h3>
              </div>
              <span className="pill">1 alert email</span>
            </div>

            <div className="field-grid">
              <label className="field">
                <span>Monitor name</span>
                <input
                  required
                  minLength={3}
                  type="text"
                  value={monitorDraft.name}
                  onChange={(event) => updateDraft("name", event.target.value)}
                />
              </label>

              <label className="field field-full">
                <span>Target URL</span>
                <input
                  required
                  type="url"
                  value={monitorDraft.url}
                  onChange={(event) => updateDraft("url", event.target.value)}
                />
              </label>

              <label className="field">
                <span>Cadence</span>
                <select
                  value={monitorDraft.cadence}
                  onChange={(event) => updateDraft("cadence", event.target.value)}
                >
                  <option value="1">Every 1 minute</option>
                  <option value="5">Every 5 minutes</option>
                  <option value="15">Every 15 minutes</option>
                  <option value="60">Every 60 minutes</option>
                </select>
              </label>

              <label className="field">
                <span>Expected status</span>
                <input
                  required
                  min={100}
                  max={599}
                  type="number"
                  inputMode="numeric"
                  value={monitorDraft.statusCode}
                  onChange={(event) => updateDraft("statusCode", event.target.value)}
                />
              </label>

              <label className="field field-full">
                <span>Optional body phrase</span>
                <input
                  type="text"
                  value={monitorDraft.bodyPhrase}
                  onChange={(event) => updateDraft("bodyPhrase", event.target.value)}
                />
              </label>

              <label className="field field-full">
                <span>Alert email</span>
                <input
                  required
                  type="email"
                  value={monitorDraft.alertEmail}
                  onChange={(event) => updateDraft("alertEmail", event.target.value)}
                />
              </label>
            </div>

            <div className="builder-footer">
              <button
                className="button button-primary"
                type="submit"
                disabled={!isDraftValid(monitorDraft)}
              >
                Continue To Operator View
              </button>
              <p>
                Frontend-only for now. Submitting this prototype takes the user into the calm
                operator dashboard state.
              </p>
            </div>
          </form>

          <article className="blueprint-card builder-preview">
            <div className="panel-heading">
              <div>
                <p className="section-label">Monitor Preview</p>
                <h3>{monitorDraft.name || "Untitled monitor"}</h3>
              </div>
              <span className="status status-ok">Draft</span>
            </div>

            <div className="preview-spec">
              <div>
                <span className="preview-label">Target</span>
                <strong>{monitorDraft.url || "Add a URL"}</strong>
              </div>
              <div>
                <span className="preview-label">Cadence</span>
                <strong>Every {monitorDraft.cadence || "5"} minutes</strong>
              </div>
              <div>
                <span className="preview-label">Healthy means</span>
                <strong>
                  HTTP {monitorDraft.statusCode || "200"}
                  {monitorDraft.bodyPhrase ? ` + "${monitorDraft.bodyPhrase}"` : ""}
                </strong>
              </div>
              <div>
                <span className="preview-label">Alert channel</span>
                <strong>{monitorDraft.alertEmail || "No alert email yet"}</strong>
              </div>
            </div>

            <div className="callout">
              <strong>What LinkGuard will do</strong>
              <p>
                Run outside-in checks on this URL, keep evidence from each attempt, and open
                an incident only after repeated failure.
              </p>
            </div>
          </article>

          <article className="blueprint-card">
            <h3>Why this version is the right starting point</h3>
            <ul>
              <li>Users do not need to connect any external platform to get value.</li>
              <li>The setup flow matches the backend monitor model we already have.</li>
              <li>One alert email keeps the product simple while the incident loop matures.</li>
              {architecture.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
