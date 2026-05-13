import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useChatServers } from "@/features/ai-chat/hooks/use-chat-servers";
import { useMySkills } from "@/features/skills/hooks/use-skills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type {
  ChatServerUuid,
  SkillBusinessId,
  Task,
  TaskFormValues,
  TaskScheduleConfig,
  TaskScheduleType,
} from "../types";

type TaskFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSubmit: (values: TaskFormValues) => void | Promise<void>;
  isSubmitting: boolean;
};

type FormState = {
  name: string;
  description: string;
  chatServerId: string;
  skillId: string;
  prompt: string;
  scheduleType: TaskScheduleType;
  time: string;
  dayOfWeek: string;
  dayOfMonth: string;
  timeoutSeconds: string;
};

const defaultState: FormState = {
  name: "",
  description: "",
  chatServerId: "",
  skillId: "",
  prompt: "",
  scheduleType: "manual",
  time: "09:00",
  dayOfWeek: "1",
  dayOfMonth: "1",
  timeoutSeconds: "300",
};

function getInitialState(task?: Task | null): FormState {
  if (!task) {
    return defaultState;
  }

  return {
    name: task.name,
    description: task.description ?? "",
    chatServerId: task.chatServerId,
    skillId: task.skillId,
    prompt: task.prompt,
    scheduleType: task.scheduleType,
    time: readConfigValue(task.scheduleConfig, "time") || "09:00",
    dayOfWeek: readConfigValue(task.scheduleConfig, "dayOfWeek") || "1",
    dayOfMonth: readConfigValue(task.scheduleConfig, "dayOfMonth") || "1",
    timeoutSeconds: String(task.timeoutSeconds),
  };
}

function readConfigValue(config: TaskScheduleConfig, key: string): string {
  if (!config || typeof config[key] === "undefined") {
    return "";
  }

  return String(config[key]);
}

function buildScheduleConfig(state: FormState): TaskScheduleConfig {
  if (state.scheduleType === "manual") {
    return null;
  }

  const config: Record<string, unknown> = { time: state.time || "09:00" };
  if (state.scheduleType === "weekly") {
    config.dayOfWeek = Number(state.dayOfWeek || 1);
  }
  if (state.scheduleType === "monthly") {
    config.dayOfMonth = Number(state.dayOfMonth || 1);
  }

  return config;
}

export function TaskFormSheet({
  open,
  onOpenChange,
  task,
  onSubmit,
  isSubmitting,
}: TaskFormSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <TaskFormSheetContent
      task={task}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
    />
  );
}

function TaskFormSheetContent({
  onOpenChange,
  task,
  onSubmit,
  isSubmitting,
}: Omit<TaskFormSheetProps, "open">) {
  const { chatServers, isLoading: isChatServersLoading } = useChatServers();
  const { data: skills = [], isLoading: isSkillsLoading } = useMySkills();
  const [form, setForm] = useState<FormState>(() => getInitialState(task));

  const updateForm = (patch: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    void onSubmit({
      name: form.name.trim(),
      description: form.description.trim() || null,
      chatServerId: form.chatServerId as ChatServerUuid,
      skillId: form.skillId as SkillBusinessId,
      prompt: form.prompt.trim(),
      scheduleType: form.scheduleType,
      scheduleConfig: buildScheduleConfig(form),
      timeoutSeconds: Number(form.timeoutSeconds || 300),
    });
  };

  const isInvalid =
    !form.name.trim() ||
    !form.chatServerId ||
    !form.skillId ||
    !form.prompt.trim();

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{task ? "编辑任务" : "新建任务"}</SheetTitle>
          <SheetDescription>
            配置智能服务、Skill、执行提示词和定时策略。
          </SheetDescription>
        </SheetHeader>

        <form className="space-y-5 px-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="task-name">任务名称</Label>
            <Input
              id="task-name"
              value={form.name}
              onChange={(event) => updateForm({ name: event.target.value })}
              placeholder="例如：每日项目摘要"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">任务描述</Label>
            <Textarea
              id="task-description"
              value={form.description}
              onChange={(event) =>
                updateForm({ description: event.target.value })
              }
              placeholder="补充说明任务目标、输出格式或使用场景"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>智能服务</Label>
              <Select
                value={form.chatServerId}
                onValueChange={(value) => updateForm({ chatServerId: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      isChatServersLoading ? "加载中..." : "选择智能服务"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {chatServers.map((server) => (
                    <SelectItem key={server.chatId} value={server.chatId}>
                      {server.name} · {server.host}:{server.port}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Skill</Label>
              <Select
                value={form.skillId}
                onValueChange={(value) => updateForm({ skillId: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={isSkillsLoading ? "加载中..." : "选择 Skill"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {skills.map((skill) => (
                    <SelectItem key={skill.skillId} value={skill.skillId}>
                      {skill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>保存时会校验该 Skill 是否已装载到所选智能服务。</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-prompt">执行提示词</Label>
            <Textarea
              id="task-prompt"
              className="min-h-32"
              value={form.prompt}
              onChange={(event) => updateForm({ prompt: event.target.value })}
              placeholder="描述任务执行目标，例如：读取当前仓库状态并输出今日进展摘要"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>调度类型</Label>
              <Select
                value={form.scheduleType}
                onValueChange={(value) =>
                  updateForm({ scheduleType: value as TaskScheduleType })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">手动</SelectItem>
                  <SelectItem value="daily">每天</SelectItem>
                  <SelectItem value="weekly">每周</SelectItem>
                  <SelectItem value="monthly">每月</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-timeout">超时时间（秒）</Label>
              <Input
                id="task-timeout"
                min={30}
                max={3600}
                type="number"
                value={form.timeoutSeconds}
                onChange={(event) =>
                  updateForm({ timeoutSeconds: event.target.value })
                }
              />
            </div>
          </div>

          {form.scheduleType !== "manual" && (
            <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="task-time">执行时间</Label>
                <Input
                  id="task-time"
                  type="time"
                  value={form.time}
                  onChange={(event) => updateForm({ time: event.target.value })}
                />
              </div>
              {form.scheduleType === "weekly" && (
                <div className="space-y-2">
                  <Label>星期</Label>
                  <Select
                    value={form.dayOfWeek}
                    onValueChange={(value) => updateForm({ dayOfWeek: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">周一</SelectItem>
                      <SelectItem value="2">周二</SelectItem>
                      <SelectItem value="3">周三</SelectItem>
                      <SelectItem value="4">周四</SelectItem>
                      <SelectItem value="5">周五</SelectItem>
                      <SelectItem value="6">周六</SelectItem>
                      <SelectItem value="0">周日</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {form.scheduleType === "monthly" && (
                <div className="space-y-2">
                  <Label htmlFor="task-day-of-month">日期</Label>
                  <Input
                    id="task-day-of-month"
                    min={1}
                    max={28}
                    type="number"
                    value={form.dayOfMonth}
                    onChange={(event) =>
                      updateForm({ dayOfMonth: event.target.value })
                    }
                  />
                </div>
              )}
            </div>
          )}

          <SheetFooter className="px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={isInvalid || isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {task ? "保存变更" : "创建任务"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
