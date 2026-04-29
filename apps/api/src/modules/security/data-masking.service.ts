const SENSITIVE_KEYS = [
  'senha',
  'password',
  'token',
  'refreshToken',
  'accessToken',
  'authorization',
  'secret',
  'jwt',
  'cookie',
  'mimetype',
  'caminho'
];

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain || local.length < 2) return '[email]';
  return `${local.slice(0, 2)}***@${domain}`;
}

export function sanitizeSensitiveData(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (depth > 5) return '[redacted]';

  if (typeof value === 'string') {
    if (value.includes('@') && value.length < 128) return maskEmail(value);
    if (/^Bearer\s+/i.test(value)) return 'Bearer [redacted]';
    if (value.length > 80) return `${value.slice(0, 20)}...[redacted]`;
    return value;
  }

  if (typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeSensitiveData(item, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
      if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))) {
        return [key, '[redacted]'];
      }

      return [key, sanitizeSensitiveData(entry, depth + 1)];
    })
  );
}
