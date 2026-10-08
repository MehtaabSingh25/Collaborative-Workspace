import http from "http";
import type { AddressInfo } from "net";
import request from "supertest";
import { io as connect, type Socket as ClientSocket } from "socket.io-client";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import app from "../src/app.js";
import { getIO, initializeSocket } from "../src/socket/index.js";
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
    expect(await getIO().in(workspaceRoom(workspaceId)).fetchSockets()).toHaveLength(1);

    const left = await emitAck<{ ok: boolean }>(client, "workspace:leave", {
      workspaceId,
    });
    expect(left.ok).toBe(true);
    expect(await getIO().in(workspaceRoom(workspaceId)).fetchSockets()).toHaveLength(0);
  });

  it("rejects PENDING invitees, then allows them after accepting", async () => {
    const { invitee, workspaceId } = await setup();
    const client = await connectClient(invitee);

    const denied = await emitAck<{ ok: boolean }>(client, "workspace:join", {
      workspaceId,
    });
    expect(denied.ok).toBe(false);
    expect(await getIO().in(workspaceRoom(workspaceId)).fetchSockets()).toHaveLength(0);

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
    expect(await getIO().in(workspaceRoom(workspaceId)).fetchSockets()).toHaveLength(0);
  });
});
