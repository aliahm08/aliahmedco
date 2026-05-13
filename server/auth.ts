import crypto from 'node:crypto';

const HASH_PREFIX = 'scrypt';

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${HASH_PREFIX}:${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, encodedHash: string) {
  const [algorithm, salt, storedKey] = encodedHash.split(':');

  if (algorithm !== HASH_PREFIX || !salt || !storedKey) {
    return false;
  }

  const candidateKey = crypto.scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(storedKey, 'hex');

  if (storedBuffer.length !== candidateKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, candidateKey);
}

export function signSessionToken(sessionId: string, secret: string) {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(sessionId)
    .digest('hex');

  return `${sessionId}.${signature}`;
}

export function verifySessionToken(token: string, secret: string) {
  const separatorIndex = token.lastIndexOf('.');

  if (separatorIndex === -1) {
    return null;
  }

  const sessionId = token.slice(0, separatorIndex);
  const providedSignature = token.slice(separatorIndex + 1);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(sessionId)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const providedBuffer = Buffer.from(providedSignature, 'hex');

  if (expectedBuffer.length !== providedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
    return null;
  }

  return sessionId;
}

export function parseCookies(headerValue?: string) {
  const cookieHeader = headerValue ?? '';

  return cookieHeader.split(';').reduce<Record<string, string>>((cookies, part) => {
    const [rawKey, ...rawValue] = part.trim().split('=');

    if (!rawKey || rawValue.length === 0) {
      return cookies;
    }

    cookies[rawKey] = decodeURIComponent(rawValue.join('='));
    return cookies;
  }, {});
}

export function createSessionCookie(token: string, maxAgeMs: number) {
  const maxAgeSeconds = Math.floor(maxAgeMs / 1000);
  return `aa_portal_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie() {
  return 'aa_portal_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}

export function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
}
