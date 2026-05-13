import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { createTask, getTaskRun, runTask } from "./tasks.api";
import { apiClient } from "@/lib/api-client";

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

describe("tasks api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates tasks through the unified apiClient and /tasks endpoint", async () => {
    const task = { taskUuid: "task-uuid", name: "Daily summary" };
    apiPostMock.mockResolvedValueOnce({ data: task });

    const payload = {
      name: "Daily summary",
      chatServerId: "chat-server-id",
      skillId: "skill-id",
      prompt: "Summarize today's work",
      scheduleType: "manual" as const,
    };

    await expect(createTask(payload)).resolves.toBe(task);

    expect(apiPostMock).toHaveBeenCalledWith("/tasks", payload);
  });

  it("gets a task run from the backend run detail route", async () => {
    const run = { runUuid: "run-uuid", status: "success" };
    apiGetMock.mockResolvedValueOnce({ data: run });

    await expect(getTaskRun("run-uuid")).resolves.toBe(run);

    expect(apiGetMock).toHaveBeenCalledWith("/tasks/runs/run-uuid");
  });

  it("runs a saved task through the task run route", async () => {
    const run = { runUuid: "run-uuid", status: "pending" };
    apiPostMock.mockResolvedValueOnce({ data: run });

    await expect(runTask("task-uuid")).resolves.toBe(run);

    expect(apiPostMock).toHaveBeenCalledWith("/tasks/task-uuid/run");
  });
});
