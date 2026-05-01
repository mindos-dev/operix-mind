# Mind_IA Security

## Architecture

1. Client
2. API gateway / backend
3. Internal services
4. AI runtime
5. Storage
6. External integrations

## Controls

- HTTPS and secure headers via `helmet`
- Rate limiting on the API and stricter throttling on auth
- JWT access tokens with short TTL
- Rotating refresh tokens
- RBAC for route and action checks
- OAuth2/SSO provider controls with admin override, restore and diagnostics export
- Prompt sanitization and abuse limits
- Upload validation, quarantine storage and basic scan
- Log masking to avoid sensitive data exposure

## Operating Principles

- Security by design
- Privacy by design
- Least privilege
- Zero trust
- Defense in depth
