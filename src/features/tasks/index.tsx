import { useDeferredValue, useState } from "react";
import {
  ClipboardList,
  Loader2,
  PauseCircle,
  PlayCircle,
  Plus,
  SearchIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateTask,
  useDeleteTask,
  usePauseTask,
  useResumeTask,
  useRunTask,
  useTasks,
  useUpdateTask,
} from "./hooks/use-tasks";
import { TaskFormSheet } from "./components/task-form-sheet";
import { TaskRunDrawer } from "./components/task-run-drawer";
import { TaskTable } from "./components/task-table";
import type { Task, TaskFormValues, TaskStatus } from "./types";

const allStatuses = "all";

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: unknown } } }).response
      ?.data?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data
      .message;
  }

  return error instanceof Error ? error.message : "操作失败";
}

export function Tasks() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | typeof allStatuses>(
    allStatuses,
  );
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [runsTask, setRunsTask] = useState<Task | null>(null);
  const [runsOpen, setRunsOpen] = useState(false);

  const deferredSearch = useDeferredValue(search.trim());
  const filters = {
    ...(deferredSearch ? { search: deferredSearch } : {}),
    ...(status !== allStatuses ? { status } : {}),
  };
  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTasks(filters);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const runTask = useRunTask();
  const pauseTask = usePauseTask();
  const resumeTask = useResumeTask();

  const activeCount = tasks.filter((task) => task.status === "active").length;
  const pausedCount = tasks.filter((task) => task.status === "paused").length;
  const scheduledCount = tasks.filter(
    (task) => task.scheduleType !== "manual",
  ).length;

  const handleSubmit = async (values: TaskFormValues) => {
    try {
      if (editingTask) {
        await updateTask.mutateAsync({
          taskUuid: editingTask.taskUuid,
          data: values,
        });
        toast.success("任务已更新");
      } else {
        await createTask.mutateAsync(values);
        toast.success("任务已创建");
      }

      setFormOpen(false);
      setEditingTask(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleRun = async (task: Task) => {
    try {
      await runTask.mutateAsync(task.taskUuid);
      toast.success("任务已提交运行");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handlePause = async (task: Task) => {
    try {
      await pauseTask.mutateAsync(task.taskUuid);
      toast.success("任务已暂停");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleResume = async (task: Task) => {
    try {
      await resumeTask.mutateAsync(task.taskUuid);
      toast.success("任务已恢复");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async (task: Task) => {
    if (!window.confirm(`确认删除任务「${task.name}」？`)) {
      return;
    }

    try {
      await deleteTask.mutateAsync(task.taskUuid);
      toast.success("任务已删除");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const openCreate = () => {
    setEditingTask(null);
    setFormOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const openRuns = (task: Task) => {
    setRunsTask(task);
    setRunsOpen(true);
  };

  return (
    <>
      <Header>
        <Search />
        <div className="ms-auto flex items-center gap-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ClipboardList className="size-4" />
              任务中心
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              自动化任务编排
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              将智能服务、Skill 和提示词组合成可手动运行或定时触发的任务。
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            新建任务
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                当前任务
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {isLoading ? <Loader2 className="size-5 animate-spin" /> : tasks.length}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                启用中
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-2xl font-semibold">
              <PlayCircle className="size-5 text-muted-foreground" />
              {activeCount}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                已暂停
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-2xl font-semibold">
              <PauseCircle className="size-5 text-muted-foreground" />
              {pausedCount}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                定时任务
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {scheduledCount}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative md:w-80">
            <SearchIcon className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索任务名称或描述"
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as TaskStatus | typeof allStatuses)
            }
          >
            <SelectTrigger className="w-full md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={allStatuses}>全部状态</SelectItem>
              <SelectItem value="active">启用</SelectItem>
              <SelectItem value="paused">暂停</SelectItem>
              <SelectItem value="disabled">禁用</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6">
            <div className="font-medium text-destructive">任务列表加载失败</div>
            <p className="mt-2 text-sm text-muted-foreground">
              {getErrorMessage(error)}
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => void refetch()}
            >
              重新加载
            </Button>
          </div>
        ) : (
          <TaskTable
            tasks={tasks}
            isLoading={isLoading}
            onEdit={openEdit}
            onRun={handleRun}
            onPause={handlePause}
            onResume={handleResume}
            onDelete={handleDelete}
            onViewRuns={openRuns}
          />
        )}
      </Main>

      <TaskFormSheet
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditingTask(null);
          }
        }}
        task={editingTask}
        onSubmit={handleSubmit}
        isSubmitting={createTask.isPending || updateTask.isPending}
      />
      <TaskRunDrawer
        task={runsTask}
        open={runsOpen}
        onOpenChange={(open) => {
          setRunsOpen(open);
          if (!open) {
            setRunsTask(null);
          }
        }}
      />
    </>
  );
}
