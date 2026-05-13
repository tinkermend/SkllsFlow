/* @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskFormSheet } from "./task-form-sheet";

vi.mock("@/features/ai-chat/hooks/use-chat-servers", () => ({
  useChatServers: () => ({
    chatServers: [],
    isLoading: false,
  }),
}));

vi.mock("@/features/skills/hooks/use-skills", () => ({
  useMySkills: () => ({
    data: [],
    isLoading: false,
  }),
}));

describe("TaskFormSheet", () => {
  it("explains skill binding is validated on save instead of claiming client-side filtering", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TaskFormSheet
          open
          onOpenChange={() => undefined}
          onSubmit={() => undefined}
          isSubmitting={false}
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText("保存时会校验该 Skill 是否已装载到所选智能服务。"),
    ).not.toBeNull();
  });

  it("rejects timeout values outside the supported range before submit", () => {
    const onSubmit = vi.fn();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TaskFormSheet
          open
          onOpenChange={() => undefined}
          onSubmit={onSubmit}
          isSubmitting={false}
        />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText("任务名称"), {
      target: { value: "每日巡检" },
    });
    fireEvent.change(screen.getByLabelText("执行提示词"), {
      target: { value: "执行巡检" },
    });
    fireEvent.change(screen.getByLabelText("超时时间（秒）"), {
      target: { value: "0" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "创建任务" }));

    expect(
      screen.getByText("任务超时时间必须在 30 到 3600 秒之间"),
    ).not.toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
