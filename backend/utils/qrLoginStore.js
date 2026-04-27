const { randomUUID } = require('crypto');

const DEFAULT_TTL_MS = 60 * 1000;
const CLEANUP_INTERVAL_MS = 30 * 1000;

const configuredTtl = Number(process.env.QR_LOGIN_TTL_MS || DEFAULT_TTL_MS);
const tokenTtlMs = Number.isFinite(configuredTtl) && configuredTtl > 0 ? configuredTtl : DEFAULT_TTL_MS;

const qrSessions = new Map();

const isExpired = (session) => Date.now() >= session.expiresAt;

const cleanupExpiredSessions = () => {
  const now = Date.now();
  for (const [token, session] of qrSessions.entries()) {
    if (now >= session.expiresAt) {
      qrSessions.delete(token);
    }
  }
};

const cleanupTimer = setInterval(cleanupExpiredSessions, CLEANUP_INTERVAL_MS);
cleanupTimer.unref();

const createQrSession = () => {
  const token = randomUUID();
  const createdAt = Date.now();
  const expiresAt = createdAt + tokenTtlMs;

  qrSessions.set(token, {
    token,
    status: 'pending',
    createdAt,
    expiresAt,
    approvedByUserId: null,
  });

  return {
    token,
    createdAt,
    expiresAt,
    ttlMs: tokenTtlMs,
  };
};

const getQrSession = (token) => {
  const session = qrSessions.get(token);
  if (!session) return null;

  if (isExpired(session)) {
    qrSessions.delete(token);
    return null;
  }

  return session;
};

const approveQrSession = (token, userId) => {
  const session = getQrSession(token);
  if (!session) {
    return { ok: false, reason: 'invalid_or_expired' };
  }

  if (session.status !== 'pending') {
    return { ok: false, reason: 'already_used' };
  }

  session.status = 'approved';
  session.approvedByUserId = String(userId);
  session.approvedAt = Date.now();

  return { ok: true, session };
};

const consumeApprovedQrSession = (token) => {
  const session = getQrSession(token);
  if (!session) {
    return { ok: false, reason: 'invalid_or_expired' };
  }

  if (session.status !== 'approved' || !session.approvedByUserId) {
    return { ok: false, reason: 'not_approved' };
  }

  qrSessions.delete(token);
  return { ok: true, session };
};

module.exports = {
  createQrSession,
  getQrSession,
  approveQrSession,
  consumeApprovedQrSession,
};