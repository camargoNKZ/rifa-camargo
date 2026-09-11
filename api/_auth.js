import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'rifa_admin';
const MAX_AGE = 60 * 60 * 24 * 30;

function digest(value) {
  return createHash('sha256').update(String(value)).digest();
}

function safeEqual(left, right) {
  return timingSafeEqual(digest(left), digest(right));
}

function signature(expires) {
  return createHmac('sha256', process.env.SESSION_SECRET || '').update(String(expires)).digest('base64url');
}

export function passwordMatches(value) {
  return Boolean(process.env.ADMIN_PASSWORD && safeEqual(value, process.env.ADMIN_PASSWORD));
}

export function createSessionCookie() {
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE;
  return `${COOKIE_NAME}=${expires}.${signature(expires)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function isAuthenticated(request) {
  const cookies = request.headers.get('cookie') || '';
  const raw = cookies.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  if (!raw) return false;
  const [expiresText, providedSignature] = raw.split('.');
  const expires = Number(expiresText);
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000) || !providedSignature) return false;
  return safeEqual(providedSignature, signature(expires));
}

export function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}
