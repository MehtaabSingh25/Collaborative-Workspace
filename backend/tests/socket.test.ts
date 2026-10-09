import http from "http";
import type { AddressInfo } from "net";
import request from "supertest";
import { io as connect, type Socket as ClientSocket } from "socket.io-client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "../src/app.js";
import { getIO, initializeSocket } from "../src/socket/index.js";
import { resetAuthRateLimiter } from "../src/middleware/rate-limit.middleware.js";
import { workspaceRoom } from "../src/socket/workspace.handlers.js";

let server: http.Server;
let url: string;
const clients: ClientSocket[] = [];

beforeAll(async () => {
  server = http.createServer(app);
  initializeSocket(server);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  url = `http://localhost:${(server.address() as AddressInfo).port}`;
});

afterEach(() => {
  clients.splice(0).forEach((c) => c.disconnect());
});

beforeEach(() => {
  resetAuthRateLimiter();
});

afterAll(async () => {
  await getIO().close();
});

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

const connectClient = (token?: string) =>
  new Promise<ClientSocket>((resolve, reject) => {
    const client = connect(url, {
      auth: token === undefined ? {} : { token },
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(client);
    client.on("connect", () => resolve(client));
    client.on("connect_error", (err) => reject(err));
  });

const emitAck = <T>(client: ClientSocket, event: string, payload: unknown) =>
  new Promise<T>((resolve) => client.emit(event, payload, resolve));

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

  await request(app)
    .post(`/api/workspaces/${workspaceId}/invite`)
    .set(auth(owner))
    .send({ email: "invitee@test.com", role: "VIEWER" })
    .expect(201);

  return { owner, invitee, outsider, workspaceId };
};

describe("socket authentication", () => {
  it("rejects connections without a token", async () => {
    await expect(connectClient()).rejects.toThrow("Unauthorized");
  });

  it("rejects connections with an invalid token", async () => {
    await expect(connectClient("not-a-jwt")).rejects.toThrow("Unauthorized");
  });

  it("accepts a valid access token", async () => {
    const token = await register("Valid User", "valid@test.com");
    const client = await connectClient(token);
    expect(client.connected).toBe(true);
  });
});

describe("workspace rooms", () => {
  it("lets an ACTIVE member join and leave", async () => {
    const { owner, workspaceId } = await setup();
    const client = await connectClient(owner);

    const joined = await emitAck<{ ok: boolean }>(client, "workspace:join", {
      workspaceId,
    });
    expect(joined.ok).toBe(true);
    expect(
      await getIO().in(workspaceRoom(workspaceId)).fetchSockets(),
    ).toHaveLength(1);

    const left = await emitAck<{ ok: boolean }>(client, "workspace:leave", {
      workspaceId,
    });
    expect(left.ok).toBe(true);
    expect(
      await getIO().in(workspaceRoom(workspaceId)).fetchSockets(),
    ).toHaveLength(0);
  });

  it("rejects PENDING invitees, then allows them after accepting", async () => {
    const { invitee, workspaceId } = await setup();
    const client = await connectClient(invitee);

    const denied = await emitAck<{ ok: boolean }>(client, "workspace:join", {
      workspaceId,
    });
    expect(denied.ok).toBe(false);
    expect(
      await getIO().in(workspaceRoom(workspaceId)).fetchSockets(),
    ).toHaveLength(0);

    await request(app)
      .post(`/api/workspaces/${workspaceId}/accept`)
      .set(auth(invitee))
      .expect(200);

    const allowed = await emitAck<{ ok: boolean }>(client, "workspace:join", {
      workspaceId,
    });
    expect(allowed.ok).toBe(true);
  });

  it("rejects outsiders and invalid payloads", async () => {
    const { outsider, workspaceId } = await setup();
    const client = await connectClient(outsider);

    const denied = await emitAck<{ ok: boolean }>(client, "workspace:join", {
      workspaceId,
    });
    expect(denied.ok).toBe(false);

    const invalid = await emitAck<{ ok: boolean; message: string }>(
      client,
      "workspace:join",
      { workspaceId: "nope" },
    );
    expect(invalid).toEqual({ ok: false, message: "Invalid payload" });
    expect(
      await getIO().in(workspaceRoom(workspaceId)).fetchSockets(),
    ).toHaveLength(0);
  });
});

describe("document rooms and presence", () => {
  it("lets an ACTIVE member join a document and broadcasts presence", async () => {
    const { owner, invitee, workspaceId } = await setup();

    const doc = await request(app)
      .post(`/api/workspaces/${workspaceId}/documents`)
      .set(auth(owner))
      .send({ title: "Shared Spec" })
      .expect(201);

    const documentId = doc.body.data._id as string;
    expect(doc.body.data.version).toBe(0);
    const ownerClient = await connectClient(owner);
    const inviteeClient = await connectClient(invitee);

    await request(app)
      .post(`/api/workspaces/${workspaceId}/accept`)
      .set(auth(invitee))
      .expect(200);

    const ownerPresence = new Promise<{
      workspaceId: string;
      documentId: string;
      users: { id: string }[];
    }>((resolve) => ownerClient.once("document:presence", resolve));

    const joined = await emitAck<{ ok: boolean }>(
      ownerClient,
      "document:join",
      { workspaceId, documentId },
    );

    expect(joined.ok).toBe(true);

    const firstPresence = await ownerPresence;
    expect(firstPresence.workspaceId).toBe(workspaceId);
    expect(firstPresence.documentId).toBe(documentId);
    expect(firstPresence.users.map((user) => user.id)).toEqual([
      expect.any(String),
    ]);

    const inviteePresence = new Promise<{
      users: { id: string }[];
    }>((resolve) => inviteeClient.once("document:presence", resolve));

    const inviteeJoined = await emitAck<{ ok: boolean }>(
      inviteeClient,
      "document:join",
      { workspaceId, documentId },
    );

    expect(inviteeJoined.ok).toBe(true);

    const presence = await inviteePresence;
    expect(presence.users).toHaveLength(2);

    const leftPresence = new Promise<{
      users: { id: string }[];
    }>((resolve) => inviteeClient.once("document:presence", resolve));

    const left = await emitAck<{ ok: boolean }>(ownerClient, "document:leave", {
      workspaceId,
      documentId,
    });

    expect(left.ok).toBe(true);
    expect((await leftPresence).users).toHaveLength(1);
  });

  it("persists editor updates, broadcasts them, and rejects viewers", async () => {
    const { owner, invitee, workspaceId } = await setup();

    const doc = await request(app)
      .post(`/api/workspaces/${workspaceId}/documents`)
      .set(auth(owner))
      .send({ title: "Realtime Spec", content: "Initial" })
      .expect(201);

    expect(doc.body.data.version).toBe(0);

    const documentId = doc.body.data._id as string;
    const ownerClient = await connectClient(owner);
    const inviteeClient = await connectClient(invitee);

    await request(app)
      .post(`/api/workspaces/${workspaceId}/accept`)
      .set(auth(invitee))
      .expect(200);

    await emitAck<{ ok: boolean }>(ownerClient, "document:join", {
      workspaceId,
      documentId,
    });
    await emitAck<{ ok: boolean }>(inviteeClient, "document:join", {
      workspaceId,
      documentId,
    });

    const updateEvent = new Promise<{
      workspaceId: string;
      documentId: string;
      content: string;
      lastEditedBy: string;
      updatedAt: string;
      version: number;
    }>((resolve) => inviteeClient.once("document:updated", resolve));

    const updated = await emitAck<{
      ok: boolean;
      content?: string;
      lastEditedBy?: string;
      updatedAt?: string;
      version?: number;
      message?: string;
    }>(ownerClient, "document:update", {
      workspaceId,
      documentId,
      content: "Updated by owner",
      version: 0,
    });

    expect(updated.ok).toBe(true);
    expect(updated.content).toBe("Updated by owner");
    expect(updated.lastEditedBy).toEqual(expect.any(String));
    expect(updated.updatedAt).toEqual(expect.any(String));
    expect(updated.version).toBe(1);

    const broadcast = await updateEvent;
    expect(broadcast.workspaceId).toBe(workspaceId);
    expect(broadcast.documentId).toBe(documentId);
    expect(broadcast.content).toBe("Updated by owner");
    expect(broadcast.lastEditedBy).toBe(updated.lastEditedBy);
    expect(broadcast.version).toBe(1);

    const persisted = await request(app)
      .get(`/api/workspaces/${workspaceId}/documents/${documentId}`)
      .set(auth(invitee))
      .expect(200);

    expect(persisted.body.data.content).toBe("Updated by owner");
    expect(persisted.body.data.version).toBe(1);

    const stale = await emitAck<{ ok: boolean; message?: string }>(
      ownerClient,
      "document:update",
      { workspaceId, documentId, content: "Stale owner edit", version: 0 },
    );

    expect(stale).toEqual({
      ok: false,
      message: "Document version conflict",
    });

    const denied = await emitAck<{ ok: boolean; message?: string }>(
      inviteeClient,
      "document:update",
      { workspaceId, documentId, content: "Viewer edit", version: 1 },
    );

    expect(denied).toEqual({ ok: false, message: "Forbidden" });
  });

  it("rejects outsiders and cross-workspace document access", async () => {
    const { owner, outsider, workspaceId } = await setup();

    const doc = await request(app)
      .post(`/api/workspaces/${workspaceId}/documents`)
      .set(auth(owner))
      .send({ title: "Private Spec" })
      .expect(201);

    const documentId = doc.body.data._id as string;

    const otherWorkspace = await request(app)
      .post("/api/workspaces")
      .set(auth(owner))
      .send({ name: "Other Space" })
      .expect(201);
    const otherWorkspaceId = otherWorkspace.body.data._id as string;

    const ownerClient = await connectClient(owner);

    const crossWorkspace = await emitAck<{ ok: boolean; message: string }>(
      ownerClient,
      "document:join",
      { workspaceId: otherWorkspaceId, documentId },
    );

    expect(crossWorkspace).toEqual({
      ok: false,
      message: "Document not found",
    });

    const outsiderClient = await connectClient(outsider);

    const denied = await emitAck<{ ok: boolean; message: string }>(
      outsiderClient,
      "document:join",
      { workspaceId, documentId },
    );

    expect(denied).toEqual({ ok: false, message: "Workspace not found" });
    expect(
      await getIO().in(`document:${workspaceId}:${documentId}`).fetchSockets(),
    ).toHaveLength(0);

    const invalid = await emitAck<{ ok: boolean; message: string }>(
      outsiderClient,
      "document:join",
      { workspaceId, documentId: "nope" },
    );

    expect(invalid).toEqual({ ok: false, message: "Invalid payload" });
  });

  it("restores a document version and broadcasts the new version", async () => {
    const { owner, invitee, workspaceId } = await setup();

    const doc = await request(app)
      .post(`/api/workspaces/${workspaceId}/documents`)
      .set(auth(owner))
      .send({ title: "Restore Spec", content: "v0" })
      .expect(201);

    const documentId = doc.body.data._id as string;
    const ownerClient = await connectClient(owner);
    const inviteeClient = await connectClient(invitee);

    await request(app)
      .post(`/api/workspaces/${workspaceId}/accept`)
      .set(auth(invitee))
      .expect(200);

    await emitAck<{ ok: boolean }>(ownerClient, "document:join", {
      workspaceId,
      documentId,
    });
    await emitAck<{ ok: boolean }>(inviteeClient, "document:join", {
      workspaceId,
      documentId,
    });

    await emitAck(ownerClient, "document:update", {
      workspaceId,
      documentId,
      content: "v1",
      version: 0,
    });
    await emitAck(ownerClient, "document:update", {
      workspaceId,
      documentId,
      content: "v2",
      version: 1,
    });

    const updateEvent = new Promise<{
      content: string;
      version: number;
    }>((resolve) => inviteeClient.once("document:updated", resolve));

    const restored = await emitAck<{
      ok: boolean;
      content?: string;
      version?: number;
    }>(ownerClient, "document:restore", {
      workspaceId,
      documentId,
      version: 1,
      expectedVersion: 2,
    });

    expect(restored.ok).toBe(true);
    expect(restored.content).toBe("v1");
    expect(restored.version).toBe(3);

    const broadcast = await updateEvent;
    expect(broadcast.content).toBe("v1");
    expect(broadcast.version).toBe(3);

    const persisted = await request(app)
      .get(`/api/workspaces/${workspaceId}/documents/${documentId}`)
      .set(auth(owner))
      .expect(200);

    expect(persisted.body.data.content).toBe("v1");
    expect(persisted.body.data.version).toBe(3);
  });
});
