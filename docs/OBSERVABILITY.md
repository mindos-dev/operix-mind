# Mind_IA Observability

## Signals

- Structured request logs with `pino`
- In-memory request counters
- AI request counters
- Upload counters
- Basic runtime metrics

## Endpoints

- `GET /health`
- `GET /api/observability/status`
- `GET /api/observability/metrics`

## Security

- Sensitive fields are redacted before logging
- Security metrics are only exposed to authorized roles
- Logs should be forwarded to external storage in production
