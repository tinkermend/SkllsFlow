/* @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Tasks } from ".";

vi.mock("@/components/layout/header", () => ({
  Header: ({ children }: { children: React.ReactNode }) => (
    <header>{children}</header>
  ),
}));

vi.mock("@/components/layout/main", () => ({
  Main: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

vi.mock("@/components/search", () => ({
  Search: () => <div>Search</div>,
}));

vi.mock("@/components/theme-switch", () => ({
  ThemeSwitch: () => <div>ThemeSwitch</div>,
}));

vi.mock("@/components/config-drawer", () => ({
  ConfigDrawer: () => <div>ConfigDrawer</div>,
}));

vi.mock("@/components/profile-dropdown", () => ({
  ProfileDropdown: () => <div>ProfileDropdown</div>,
}));

vi.mock("./hooks/use-tasks", () => ({
  useTasks: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
    error: new Error("任务列表加载失败"),
    refetch: vi.fn(),
  }),
  useCreateTask: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateTask: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteTask: () => ({ mutateAsync: vi.fn() }),
  useRunTask: () => ({ mutateAsync: vi.fn() }),
  usePauseTask: () => ({ mutateAsync: vi.fn() }),
  useResumeTask: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("./components/task-form-sheet", () => ({
  TaskFormSheet: () => null,
}));

vi.mock("./components/task-run-drawer", () => ({
  TaskRunDrawer: () => null,
}));

describe("Tasks", () => {
  it("shows task list query errors instead of empty stats", () => {
    render(<Tasks />);

    expect(screen.getAllByText("任务列表加载失败")).toHaveLength(2);
    expect(screen.queryByText("暂无任务，创建一个自动化任务开始使用。")).toBeNull();
  });
});
