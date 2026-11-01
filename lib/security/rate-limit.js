const buckets = new Map();
const MAX_BUCKETS = 10_000;
const PRUNE_EVERY = 100;
let operationsSincePrune = 0;

export function getClientKey(request, prefix = 'api') {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  return `${prefix}:${ip}`;
}

function pruneExpired(now) {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

function retryAfterForEarliestBucket() {
  let earliestResetAt = Infinity;
  for (const bucket of buckets.values()) {
    if (bucket.resetAt < earliestResetAt) earliestResetAt = bucket.resetAt;
  }
  return Number.isFinite(earliestResetAt)
    ? Math.max(1, Math.ceil((earliestResetAt - Date.now()) / 1000))
    : 1;
}

export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  operationsSincePrune += 1;
  if (operationsSincePrune >= PRUNE_EVERY) {
    pruneExpired(now);
    operationsSincePrune = 0;
  }

  const current = buckets.get(key);
  if (!current || now >= current.resetAt) {
    // Keep this process-local fallback bounded. If the map is full after
    // expired entries are removed, fail closed rather than growing forever.
    if (buckets.size >= MAX_BUCKETS) {
      pruneExpired(now);
      if (buckets.size >= MAX_BUCKETS) {
        return { allowed: false, remaining: 0, retryAfter: retryAfterForEarliestBucket() };
      }
    }

    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: Math.max(0, limit - 1), retryAfter: 0 };
  }

  current.count += 1;
  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}
