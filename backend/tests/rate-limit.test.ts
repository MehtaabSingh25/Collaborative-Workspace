import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createRateLimiter } from "../src/middleware/rate-limit.middleware.js";

describe("createRateLimiter", () => {
  it("allows requests within the configured limit and rejects excess requests", async () => {
    const app = express();
    app.get("/limited", createRateLimiter({ windowMs: 60_000, max: 2 }), (_req, res) => {
      res.status(200).json({ success: true });
    });

    const first = await request(app).get("/limited");
    const second = await request(app).get("/limited");
    const third = await request(app).get("/limited");

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.headers["retry-after"]).toBeDefined();
    expect(third.body).toMatchObject({ success: false });
  });

  it("includes rate-limit metadata on allowed responses", async () => {
    const app = express();
    app.get("/limited", createRateLimiter({ windowMs: 60_000, max: 3 }), (_req, res) => {
      res.status(200).end();
    });

    const response = await request(app).get("/limited");

    expect(response.headers["ratelimit-limit"]).toBe("3");
    expect(response.headers["ratelimit-remaining"]).toBe("2");
  });
});
