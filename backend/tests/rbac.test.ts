import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/app.js";

const register = async (name: string, email: string) => {
  await request(app)
    .post("/api/auth/register")
    .send({ name, email, password: "password123" })
    .expect(201);
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "password123" })
    .expect(200);
  return res.body.data.accessToken as string;
};

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

const setup = async () => {
  const owner = await register("Owner One", "owner@test.com");
  const invitee = await register("Invitee One", "invitee@test.com");
  const outsider = await register("Outsider One", "outsider@test.com");

  const ws = await request(app)
    .post("/api/workspaces")
    .set(auth(owner))
    .send({ name: "Team Space" })
    .expect(201);
  const workspaceId = ws.body.data._id as string;

  return { owner, invitee, outsider, workspaceId };
};

describe("auth", () => {
  it("rejects unauthenticated access", async () => {
    await request(app).get("/api/workspaces").expect(401);
  });

  it("returns 400 (not 500) on validation errors", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "bad" })
      .expect(400);
    expect(res.body.errors).toBeInstanceOf(Array);
  });

  it("never exposes the password hash", async () => {
    const token = await register("Some User", "u@test.com");
    const res = await request(app)
      .get("/api/auth/me")
      .set(auth(token))
      .expect(200);
    expect(JSON.stringify(res.body)).not.toContain("password");
  });
});

describe("workspace membership", () => {
  it("hides workspace from non-members (404)", async () => {
    const { outsider, workspaceId } = await setup();
    await request(app)
      .get(`/api/workspaces/${workspaceId}`)
      .set(auth(outsider))
      .expect(404);
  });

  it("hides workspace from PENDING invitees until they accept", async () => {
    const { owner, invitee, workspaceId } = await setup();

    await request(app)
      .post(`/api/workspaces/${workspaceId}/invite`)
      .set(auth(owner))
      .send({ email: "invitee@test.com", role: "EDITOR" })
      .expect(201);

    await request(app)
      .get(`/api/workspaces/${workspaceId}`)
      .set(auth(invitee))
      .expect(404);

    const list = await request(app)
      .get("/api/workspaces")
      .set(auth(invitee))
      .expect(200);
    expect(list.body.data).toHaveLength(0);

    await request(app)
      .post(`/api/workspaces/${workspaceId}/accept`)
      .set(auth(invitee))
      .expect(200);

    await request(app)
      .get(`/api/workspaces/${workspaceId}`)
      .set(auth(invitee))
      .expect(200);
  });

  it("only the owner can invite", async () => {
    const { owner, invitee, workspaceId } = await setup();
    await request(app)
      .post(`/api/workspaces/${workspaceId}/invite`)
      .set(auth(owner))
      .send({ email: "invitee@test.com", role: "EDITOR" });
    await request(app)
      .post(`/api/workspaces/${workspaceId}/accept`)
      .set(auth(invitee));

    await request(app)
      .post(`/api/workspaces/${workspaceId}/invite`)
      .set(auth(invitee))
      .send({ email: "outsider@test.com" })
      .expect(403);
  });
});

describe("document RBAC", () => {
  it("VIEWER can read but not create or edit documents", async () => {
    const { owner, invitee, workspaceId } = await setup();
    await request(app)
      .post(`/api/workspaces/${workspaceId}/invite`)
      .set(auth(owner))
      .send({ email: "invitee@test.com", role: "VIEWER" });
    await request(app)
      .post(`/api/workspaces/${workspaceId}/accept`)
      .set(auth(invitee));

    const doc = await request(app)
      .post(`/api/workspaces/${workspaceId}/documents`)
      .set(auth(owner))
      .send({ title: "Spec" })
      .expect(201);
    const docId = doc.body.data._id;

    await request(app)
      .get(`/api/workspaces/${workspaceId}/documents/${docId}`)
      .set(auth(invitee))
      .expect(200);

    await request(app)
      .post(`/api/workspaces/${workspaceId}/documents`)
      .set(auth(invitee))
      .send({ title: "Nope" })
      .expect(403);

    await request(app)
      .patch(`/api/workspaces/${workspaceId}/documents/${docId}`)
      .set(auth(invitee))
      .send({ title: "Hacked" })
      .expect(403);
  });

  it("outsider cannot read documents", async () => {
    const { owner, outsider, workspaceId } = await setup();
    const doc = await request(app)
      .post(`/api/workspaces/${workspaceId}/documents`)
      .set(auth(owner))
      .send({ title: "Secret" })
      .expect(201);

    await request(app)
      .get(`/api/workspaces/${workspaceId}/documents/${doc.body.data._id}`)
      .set(auth(outsider))
      .expect(404);
  });
});

describe("document content limits", () => {
  it("rejects oversized content on create and update", async () => {
    const { owner, workspaceId } = await setup();
    const oversizedContent = "x".repeat(500_001);

    await request(app)
      .post(`/api/workspaces/${workspaceId}/documents`)
      .set(auth(owner))
      .send({ title: "Too Large", content: oversizedContent })
      .expect(400);

    const doc = await request(app)
      .post(`/api/workspaces/${workspaceId}/documents`)
      .set(auth(owner))
      .send({ title: "Within Limit", content: "original" })
      .expect(201);

    await request(app)
      .patch(`/api/workspaces/${workspaceId}/documents/${doc.body.data._id}`)
      .set(auth(owner))
      .send({ content: oversizedContent, expectedVersion: 0 })
      .expect(400);

    const unchanged = await request(app)
      .get(`/api/workspaces/${workspaceId}/documents/${doc.body.data._id}`)
      .set(auth(owner))
      .expect(200);

    expect(unchanged.body.data.content).toBe("original");
    expect(unchanged.body.data.version).toBe(0);
  });
});

describe("document version history", () => {
  it("requires expectedVersion for REST updates to prevent lost updates", async () => {
    const { owner, workspaceId } = await setup();
    const doc = await request(app)
      .post(`/api/workspaces/${workspaceId}/documents`)
      .set(auth(owner))
      .send({ title: "Concurrency Spec", content: "original" })
      .expect(201);

    const docId = doc.body.data._id as string;

    const missingVersion = await request(app)
      .patch(`/api/workspaces/${workspaceId}/documents/${docId}`)
      .set(auth(owner))
      .send({ content: "unsafe update without version" })
      .expect(400);

    expect(missingVersion.body.errors).toBeInstanceOf(Array);

    const unchanged = await request(app)
      .get(`/api/workspaces/${workspaceId}/documents/${docId}`)
      .set(auth(owner))
      .expect(200);

    expect(unchanged.body.data.content).toBe("original");
    expect(unchanged.body.data.version).toBe(0);
  });

  it("records revisions and restores an earlier version", async () => {
    const { owner, invitee, workspaceId } = await setup();
    await request(app)
      .post(`/api/workspaces/${workspaceId}/invite`)
      .set(auth(owner))
      .send({ email: "invitee@test.com", role: "VIEWER" })
      .expect(201);

    await request(app)
      .post(`/api/workspaces/${workspaceId}/accept`)
      .set(auth(invitee))
      .expect(200);

    const doc = await request(app)
      .post(`/api/workspaces/${workspaceId}/documents`)
      .set(auth(owner))
      .send({ title: "History Spec", content: "v0" })
      .expect(201);

    const docId = doc.body.data._id as string;

    await request(app)
      .patch(`/api/workspaces/${workspaceId}/documents/${docId}`)
      .set(auth(owner))
      .send({ content: "v1", expectedVersion: 0 })
      .expect(200);

    await request(app)
      .patch(`/api/workspaces/${workspaceId}/documents/${docId}`)
      .set(auth(owner))
      .send({ content: "v2", expectedVersion: 1 })
      .expect(200);

    const history = await request(app)
      .get(`/api/workspaces/${workspaceId}/documents/${docId}/history`)
      .set(auth(owner))
      .expect(200);

    expect(
      history.body.data.map(
        (revision: { version: number }) => revision.version,
      ),
    ).toEqual([2, 1]);

    expect(history.body.data[0].content).toBe("v2");

    const restored = await request(app)
      .post(`/api/workspaces/${workspaceId}/documents/${docId}/restore`)
      .set(auth(owner))
      .send({ version: 1, expectedVersion: 2 })
      .expect(200);

    expect(restored.body.data.content).toBe("v1");
    expect(restored.body.data.version).toBe(3);

    const persisted = await request(app)
      .get(`/api/workspaces/${workspaceId}/documents/${docId}`)
      .set(auth(invitee))
      .expect(200);

    expect(persisted.body.data.content).toBe("v1");
    expect(persisted.body.data.version).toBe(3);

    const afterRestoreHistory = await request(app)
      .get(`/api/workspaces/${workspaceId}/documents/${docId}/history`)
      .set(auth(owner))
      .expect(200);

    expect(
      afterRestoreHistory.body.data.map(
        (revision: { version: number }) => revision.version,
      ),
    ).toEqual([3, 2, 1]);
  });

  it("rejects stale restores and viewer restores", async () => {
    const { owner, invitee, workspaceId } = await setup();

    await request(app)
      .post(`/api/workspaces/${workspaceId}/invite`)
      .set(auth(owner))
      .send({ email: "invitee@test.com", role: "VIEWER" })
      .expect(201);

    await request(app)
      .post(`/api/workspaces/${workspaceId}/accept`)
      .set(auth(invitee))
      .expect(200);

    const doc = await request(app)
      .post(`/api/workspaces/${workspaceId}/documents`)
      .set(auth(owner))
      .send({ title: "Restore Spec", content: "v0" })
      .expect(201);

    const docId = doc.body.data._id as string;

    await request(app)
      .patch(`/api/workspaces/${workspaceId}/documents/${docId}`)
      .set(auth(owner))
      .send({ content: "v1", expectedVersion: 0 })
      .expect(200);

    const viewerHistory = await request(app)
      .get(`/api/workspaces/${workspaceId}/documents/${docId}/history`)
      .set(auth(invitee))
      .expect(200);

    expect(viewerHistory.body.data).toHaveLength(1);

    await request(app)
      .post(`/api/workspaces/${workspaceId}/documents/${docId}/restore`)
      .set(auth(owner))
      .send({ version: 1, expectedVersion: 0 })
      .expect(409);

    await request(app)
      .post(`/api/workspaces/${workspaceId}/documents/${docId}/restore`)
      .set(auth(invitee))
      .send({ version: 1, expectedVersion: 1 })
      .expect(403);
  });
});
