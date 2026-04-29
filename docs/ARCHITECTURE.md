# Mind_IA Architecture

## Layers

- Frontend console
- Express API
- Domain services
- AI runtime router
- In-memory storage for local development
- Integration bridges and conversion registry

## Security boundary

- Frontend never contains secrets
- Access tokens protect API calls
- Sensitive actions are gated by permissions
- Files are validated and quarantined before acceptance
