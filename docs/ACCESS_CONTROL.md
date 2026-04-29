# Mind_IA Access Control

## Roles

- admin
- user
- dev
- enterprise

## Permission model

- `ai:execute`
- `ai:premium`
- `files:read`
- `files:write`
- `projects:read`
- `projects:write`
- `logs:read`
- `privacy:export`
- `privacy:delete`
- `security:read`
- `integrations:connect`
- `runtime:decide`

## Enforcement

- JWT auth for protected routes
- Middleware checks for permissions and roles
- Premium AI is blocked unless the role and plan permit it
