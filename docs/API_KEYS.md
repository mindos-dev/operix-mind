# API Keys

API keys are stored hashed only.

## Endpoints

- `GET /api/api-keys`
- `POST /api/api-keys`
- `POST /api/api-keys/:id/rotate`
- `DELETE /api/api-keys/:id`

## Formats

- `opx_live_...`
- `opx_test_...`

Use either:

- `Authorization: Bearer <api_key>`
- `X-API-Key: <api_key>`
