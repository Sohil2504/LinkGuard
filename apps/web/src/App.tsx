const architecture = [
  "API Gateway HTTP API -> Lambda FastAPI",
  "EventBridge Scheduler -> Dispatcher",
  "SQS + DLQ -> Check workers",
  "DynamoDB -> monitors, incidents, history",
  "SES -> email alerting",
  "CloudWatch + X-Ray -> observability",
];

const decisions = [
  "Open incidents after 2 consecutive failures",
  "Resolve incidents after 2 consecutive successes",
  "Support 1, 5, 15, and 60 minute intervals in v1",
  "Skip browser automation until the core loop is stable",
];

export function App() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Flagship Project</p>
        <h1>LinkGuard</h1>
        <p className="lede">
          A reliability-focused service for monitoring revenue-critical links and opening
          incidents only when failure is persistent enough to matter.
        </p>
      </section>

      <section className="panel">
        <h2>System Shape</h2>
        <ul>
          {architecture.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Why This Looks Strong</h2>
        <ul>
          {decisions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
