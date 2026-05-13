import {
  MoreHorizontal,
  PauseCircle,
  Pencil,
  PlayCircle,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Task, TaskScheduleType, TaskStatus } from "../types";

type TaskTableProps = {
  tasks: Task[];
  isLoading: boolean;
  onEdit: (task: Task) => void;
  onRun: (task: Task) => void;
  onPause: (task: Task) => void;
  onResume: (task: Task) => void;
  onDelete: (task: Task) => void;
  onViewRuns: (task: Task) => void;
};

const statusMeta: Record<TaskStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "启用", variant: "default" },
  paused: { label: "暂停", variant: "secondary" },
  disabled: { label: "禁用", variant: "outline" },
};

const scheduleLabels: Record<TaskScheduleType, string> = {
  manual: "手动",
  daily: "每天",
  weekly: "每周",
  monthly: "每月",
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

export function TaskTable({
  tasks,
  isLoading,
  onEdit,
  onRun,
  onPause,
  onResume,
  onDelete,
  onViewRuns,
}: TaskTableProps) {
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>任务</TableHead>
            <TableHead>绑定</TableHead>
            <TableHead>调度</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>运行</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-32 text-center text-muted-foreground"
              >
                正在加载任务
              </TableCell>
            </TableRow>
          ) : tasks.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-32 text-center text-muted-foreground"
              >
                暂无任务，创建一个自动化任务开始使用。
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => {
              const status = statusMeta[task.status];
              return (
                <TableRow key={task.taskUuid}>
                  <TableCell className="max-w-72">
                    <div className="font-medium">{task.name}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {task.description || task.prompt}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {task.chatServer?.name ?? task.chatServerId}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {task.skill?.name ?? task.skillId}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {scheduleLabels[task.scheduleType]}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      下次：{formatDate(task.nextRunAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="text-start text-sm hover:underline"
                      onClick={() => onViewRuns(task)}
                    >
                      {task.runCount} 次
                    </button>
                    <div className="text-xs text-muted-foreground">
                      最近：{formatDate(task.lastRunAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">打开任务操作</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onRun(task)}>
                          <PlayCircle className="size-4" />
                          立即运行
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewRuns(task)}>
                          <RotateCcw className="size-4" />
                          运行记录
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(task)}>
                          <Pencil className="size-4" />
                          编辑
                        </DropdownMenuItem>
                        {task.status === "paused" ? (
                          <DropdownMenuItem onClick={() => onResume(task)}>
                            <PlayCircle className="size-4" />
                            恢复
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => onPause(task)}>
                            <PauseCircle className="size-4" />
                            暂停
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDelete(task)}
                        >
                          <Trash2 className="size-4" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
