const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  ip: string,
  limit: number = 30,
  windowMs: number = 60 * 1000
): { isLimited: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    const newRecord = { count: 1, resetTime: now + windowMs };
    rateLimitStore.set(ip, newRecord);
    return { isLimited: false, remaining: limit - 1, reset: newRecord.resetTime };
  }

  record.count += 1;
  const isLimited = record.count > limit;
  const remaining = Math.max(0, limit - record.count);

  return { isLimited, remaining, reset: record.resetTime };
}
