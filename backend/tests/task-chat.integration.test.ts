import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../src/app.js";
import { resetAuthRateLimiter } from "../src/middleware/rate-limit.middleware.js";

const register = async (name: string, email: string) => {
  await request(app).post("/api/auth/register").send({ name, email, password: "password123" }).expect(201);
  const response = await request(app).post("/api/auth/login").send({ email, password: "password123" }).expect(200);
  return response.body.data.accessToken as string;
};
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

async function createWorkspace(owner: string) {
  const response = await request(app).post("/api/workspaces").set(auth(owner)).send({ name: "Integration Team" }).expect(201);
  return response.body.data._id as string;
}

async function inviteAndAccept(owner: string, invitee: string, workspaceId: string, email: string, role: "EDITOR" | "VIEWER") {
  await request(app).post(`/api/workspaces/${workspaceId}/invite`).set(auth(owner)).send({ email, role }).expect(201);
  await request(app).post(`/api/workspaces/${workspaceId}/accept`).set(auth(invitee)).expect(200);
}

beforeEach(() => resetAuthRateLimiter());

describe("task management integration", () => {
  it("creates, updates, and persists a task for an active workspace member", async () => {
    const owner = await register("Task Owner", "task-owner@test.com");
    const workspaceId = await createWorkspace(owner);
    const created = await request(app)
      .post(`/api/workspaces/${workspaceId}/tasks`)
      .set(auth(owner))
      .send({ title: "Ship integration tests", description: "Cover task lifecycle", priority: "HIGH", status: "TODO", dueDate: "2027-01-15" })
      .expect(201);

    expect(created.body.data.title).toBe("Ship integration tests");
    expect(created.body.data.priority).toBe("HIGH");
    const taskId = created.body.data._id as string;

    await request(app)
      .patch(`/api/workspaces/${workspaceId}/tasks/${taskId}`)
      .set(auth(owner))
      .send({ status: "IN_PROGRESS" })
      .expect(200);

    const list = await request(app).get(`/api/workspaces/${workspaceId}/tasks`).set(auth(owner)).expect(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].status).toBe("IN_PROGRESS");
  });

  it("allows viewers to read tasks but rejects task mutations", async () => {
    const owner = await register("Task Owner Two", "task-owner-two@test.com");
    const viewer = await register("Task Viewer", "task-viewer@test.com");
    const workspaceId = await createWorkspace(owner);
    await inviteAndAccept(owner, viewer, workspaceId, "task-viewer@test.com", "VIEWER");

    const created = await request(app).post(`/api/workspaces/${workspaceId}/tasks`).set(auth(owner)).send({ title: "Read-only task" }).expect(201);
    const taskId = created.body.data._id as string;

    const list = await request(app).get(`/api/workspaces/${workspaceId}/tasks`).set(auth(viewer)).expect(200);
    expect(list.body.data).toHaveLength(1);
    await request(app).patch(`/api/workspaces/${workspaceId}/tasks/${taskId}`).set(auth(viewer)).send({ status: "DONE" }).expect(403);
    await request(app).delete(`/api/workspaces/${workspaceId}/tasks/${taskId}`).set(auth(viewer)).expect(403);
  });

  it("rejects task access by non-members and invalid task payloads", async () => {
    const owner = await register("Task Owner Three", "task-owner-three@test.com");
    const outsider = await register("Task Outsider", "task-outsider@test.com");
    const workspaceId = await createWorkspace(owner);

    await request(app).get(`/api/workspaces/${workspaceId}/tasks`).set(auth(outsider)).expect(404);
    await request(app).post(`/api/workspaces/${workspaceId}/tasks`).set(auth(owner)).send({ title: "   " }).expect(400);
  });
});

describe("chat history integration", () => {
  it("allows active members to read history and hides it from outsiders", async () => {
    const owner = await register("Chat Owner", "chat-owner@test.com");
    const outsider = await register("Chat Outsider", "chat-outsider@test.com");
    const workspaceId = await createWorkspace(owner);

    const history = await request(app).get(`/api/workspaces/${workspaceId}/chat/messages`).set(auth(owner)).expect(200);
    expect(history.body.data).toEqual([]);
    await request(app).get(`/api/workspaces/${workspaceId}/chat/messages`).set(auth(outsider)).expect(404);
  });
});
