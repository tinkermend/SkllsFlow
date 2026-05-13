import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import {
  createTask,
  deleteTask,
  getTaskRun,
  getTaskRuns,
  getTasks,
  pauseTask,
  resumeTask,
  runTask,
  testRun,
  updateTask,
} from "./tasks.api";
import { apiClient } from "@/lib/api-client";
import type {
  ChatServerUuid,
  SkillBusinessId,
  TaskRunUuid,
  TaskUuid,
} from "../types";

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const apiGetMock = apiClient.get as Mock;
const apiPostMock = apiClient.post as Mock;
const apiPatchMock = apiClient.patch as Mock;
const apiDeleteMock = apiClient.delete as Mock;

const chatServerId = "chat-server-id" as ChatServerUuid;
const skillId = "skill-id" as SkillBusinessId;
const taskUuid = "task-uuid" as TaskUuid;
const runUuid = "run-uuid" as TaskRunUuid;

describe("tasks api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates tasks through the unified apiClient and /tasks endpoint", async () => {
    const task = { taskUuid: "task-uuid", name: "Daily summary" };
    apiPostMock.mockResolvedValueOnce({ data: task });

    const payload = {
      name: "Daily summary",
      chatServerId,
      skillId,
      prompt: "Summarize today's work",
      scheduleType: "manual" as const,
    };

    await expect(createTask(payload)).resolves.toBe(task);

    expect(apiPostMock).toHaveBeenCalledWith("/tasks", payload);
  });

  it("gets tasks with filter params", async () => {
    const tasks = [{ taskUuid: "task-uuid", name: "Daily summary" }];
    const params = { search: "summary", status: "active" as const, limit: 20 };
    apiGetMock.mockResolvedValueOnce({ data: tasks });

    await expect(getTasks(params)).resolves.toBe(tasks);

    expect(apiGetMock).toHaveBeenCalledWith("/tasks", { params });
  });

  it("updates a saved task through the task detail endpoint", async () => {
    const task = { taskUuid: "task-uuid", name: "Updated summary" };
    const payload = { name: "Updated summary" };
    apiPatchMock.mockResolvedValueOnce({ data: task });

    await expect(updateTask(taskUuid, payload)).resolves.toBe(task);

    expect(apiPatchMock).toHaveBeenCalledWith("/tasks/task-uuid", payload);
  });

  it("deletes a saved task through the task detail endpoint", async () => {
    apiDeleteMock.mockResolvedValueOnce({ data: undefined });

    await expect(deleteTask(taskUuid)).resolves.toBeUndefined();

    expect(apiDeleteMock).toHaveBeenCalledWith("/tasks/task-uuid");
  });

  it("gets a task run from the backend run detail route", async () => {
    const run = { runUuid: "run-uuid", status: "success" };
    apiGetMock.mockResolvedValueOnce({ data: run });

    await expect(getTaskRun(runUuid)).resolves.toBe(run);

    expect(apiGetMock).toHaveBeenCalledWith("/tasks/runs/run-uuid");
  });

  it("gets runs for a saved task", async () => {
    const runs = [{ runUuid: "run-uuid", status: "success" }];
    apiGetMock.mockResolvedValueOnce({ data: runs });

    await expect(getTaskRuns(taskUuid)).resolves.toBe(runs);

    expect(apiGetMock).toHaveBeenCalledWith("/tasks/task-uuid/runs");
  });

  it("runs a saved task through the task run route", async () => {
    const run = { runUuid: "run-uuid", status: "pending" };
    apiPostMock.mockResolvedValueOnce({ data: run });

    await expect(runTask(taskUuid)).resolves.toBe(run);

    expect(apiPostMock).toHaveBeenCalledWith("/tasks/task-uuid/run");
  });

  it("pauses a saved task through the task pause route", async () => {
    const task = { taskUuid: "task-uuid", status: "paused" };
    apiPostMock.mockResolvedValueOnce({ data: task });

    await expect(pauseTask(taskUuid)).resolves.toBe(task);

    expect(apiPostMock).toHaveBeenCalledWith("/tasks/task-uuid/pause");
  });

  it("resumes a saved task through the task resume route", async () => {
    const task = { taskUuid: "task-uuid", status: "active" };
    apiPostMock.mockResolvedValueOnce({ data: task });

    await expect(resumeTask(taskUuid)).resolves.toBe(task);

    expect(apiPostMock).toHaveBeenCalledWith("/tasks/task-uuid/resume");
  });

  it("keeps the test-run API method wired to the backend route", async () => {
    const run = { runUuid: "run-uuid", status: "pending" };
    const payload = {
      name: "Ad hoc summary",
      chatServerId,
      skillId,
      prompt: "Summarize now",
      scheduleType: "manual" as const,
    };
    apiPostMock.mockResolvedValueOnce({ data: run });

    await expect(testRun(payload)).resolves.toBe(run);

    expect(apiPostMock).toHaveBeenCalledWith("/tasks/test-run", payload);
  });
});
