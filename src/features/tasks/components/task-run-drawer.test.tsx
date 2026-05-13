/* @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskRunDrawer } from "./task-run-drawer";
import type { Task } from "../types";

const useTaskRunsMock = vi.fn();

vi.mock("../hooks/use-task-runs", () => ({
  useTaskRuns: (taskUuid: string | undefined) => useTaskRunsMock(taskUuid),
}));

const task = {
  id: "1",
  taskUuid: "task-uuid",
  name: "每日巡检",
  description: null,
  chatServerId: "chat-server-uuid",
  skillId: "skill-business-id",
  prompt: "执行巡检",
  scheduleType: "manual",
  scheduleConfig: null,
  timeoutSeconds: 300,
  status: "active",
  lastRunAt: null,
  nextRunAt: null,
  runCount: 0,
  createdBy: "user-uuid",
  createdAt: "2026-05-13T00:00:00.000Z",
  updatedAt: "2026-05-13T00:00:00.000Z",
} as Task;

describe("TaskRunDrawer", () => {
  it("shows query errors instead of rendering failed loads as empty history", () => {
    useTaskRunsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("加载失败"),
      refetch: vi.fn(),
    });

    render(
      <TaskRunDrawer task={task} open onOpenChange={() => undefined} />,
    );

    expect(screen.getByText("运行记录加载失败")).not.toBeNull();
    expect(screen.getByText("加载失败")).not.toBeNull();
  });
});
