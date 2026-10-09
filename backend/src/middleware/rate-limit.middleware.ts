import type { NextFunction, Request, Response } from "express";

type WindowEntry = { count: number; resetAt: number };
type RateLimiter = ((req: Request, res: Response, next: NextFunction) => void) & { reset: () => void };

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message?: string;
};

/**
 * Small dependency-free fixed-window limiter for single-process deployments.
 * For multi-instance production deployments, replace the in-memory store with
 * a shared store (for example Redis) so limits apply across instances.
 */
export const createRateLimiter = ({
  windowMs,
  max,
  message = "Too many requests. Please try again later.",
}: RateLimitOptions) => {
  const windows = new Map<string, WindowEntry>();
  let lastPruneAt = 0;

  const limiter: RateLimiter = (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();

    // Opportunistically prune expired entries without creating a timer that
    // would keep test processes or short-lived workers alive.
    if (now - lastPruneAt > windowMs) {
      for (const [key, entry] of windows) {
        if (entry.resetAt <= now) windows.delete(key);
      }
      lastPruneAt = now;
    }

    const key = req.ip || req.socket.remoteAddress || "unknown";
    let entry = windows.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      windows.set(key, entry);
    }

    entry.count += 1;
    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    res.setHeader("RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
      res.status(429).json({ success: false, message });
      return;
    }

    next();
  };

  // Exposed for deterministic test isolation; production behavior is unchanged.
  limiter.reset = () => {
    windows.clear();
    lastPruneAt = 0;
  };

  return limiter;
};

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts. Please try again in 15 minutes.",
});

/** Reset the shared auth limiter between integration tests. */
export const resetAuthRateLimiter = () => authRateLimiter.reset();
