import { AlertCircle, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useTaskRuns } from "../hooks/use-task-runs";
import type { Task, TaskRun, TaskRunStatus } from "../types";

type TaskRunDrawerProps = {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const runStatusMeta: Record<
  TaskRunStatus,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: { label: "等待中", icon: Clock },
  running: { label: "运行中", icon: Loader2 },
  success: { label: "成功", icon: CheckCircle2 },
  failed: { label: "失败", icon: XCircle },
  cancelled: { label: "已取消", icon: AlertCircle },
};

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPayload(value: unknown): string {
  if (value === null || typeof value === "undefined") {
    return "-";
  }

  if (typeof value === "string") {
    return value || "-";
  }

  return JSON.stringify(value, null, 2);
}

function RunCard({ run }: { run: TaskRun }) {
  const meta = runStatusMeta[run.status];
  const Icon = meta.icon;

  return (
    <article className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Icon
              className={
                run.status === "running"
                  ? "size-4 animate-spin text-muted-foreground"
                  : "size-4 text-muted-foreground"
              }
            />
            <span className="font-medium">{meta.label}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(run.startedAt ?? run.createdAt)} -{" "}
            {formatDate(run.finishedAt)}
          </p>
        </div>
        <Badge variant="outline">{run.triggerType}</Badge>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">输入</p>
          <pre className="max-h-40 overflow-auto rounded-lg bg-muted p-3 text-xs">
            {formatPayload(run.input)}
          </pre>
        </div>
        {run.output && (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              输出
            </p>
            <pre className="max-h-48 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">
              {run.output}
            </pre>
          </div>
        )}
        {run.errorMessage && (
          <div>
            <p className="mb-1 text-xs font-medium text-destructive">错误</p>
            <pre className="max-h-40 overflow-auto rounded-lg bg-destructive/10 p-3 text-xs whitespace-pre-wrap text-destructive">
              {run.errorMessage}
            </pre>
          </div>
        )}
      </div>
    </article>
  );
}

export function TaskRunDrawer({
  task,
  open,
  onOpenChange,
}: TaskRunDrawerProps) {
  const { data: runs = [], isLoading } = useTaskRuns(
    open ? task?.taskUuid : undefined,
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>运行记录</SheetTitle>
          <SheetDescription>
            {task ? `查看「${task.name}」的执行输入、输出和错误信息。` : ""}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-4 pb-4">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              正在加载运行记录
            </div>
          ) : runs.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              暂无运行记录
            </div>
          ) : (
            <div className="space-y-4">
              {runs.map((run) => (
                <RunCard key={run.runUuid} run={run} />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
