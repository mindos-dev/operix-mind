# Mind_IA Incident Response

## Triage

1. Identify the system impacted
2. Contain the incident
3. Rotate credentials if needed
4. Preserve audit evidence

## Common cases

- Brute force: block source and tighten limits
- Token leak: revoke sessions and rotate secrets
- File abuse: quarantine and purge affected uploads
- Prompt injection: sanitize input and review logs

## Recovery

- Restore service from clean configuration
- Verify logs and access history
- Document the root cause and controls added
