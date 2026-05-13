export type TaskScheduleType = "manual" | "daily" | "weekly" | "monthly";
export type TaskStatus = "active" | "paused" | "disabled";
export type TaskRunStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "cancelled";
export type TaskRunTriggerType = "manual" | "test" | "schedule";

export type ChatServerUuid = string & { readonly __brand: "ChatServerUuid" };
export type SkillBusinessId = string & { readonly __brand: "SkillBusinessId" };
export type TaskUuid = string & { readonly __brand: "TaskUuid" };
export type TaskRunUuid = string & { readonly __brand: "TaskRunUuid" };

export type TaskScheduleConfig = Record<string, unknown> | null;

export interface TaskChatServer {
  id: string;
  chatId: ChatServerUuid;
  name: string;
  host: string;
  port: number;
  status: string;
}

export interface TaskSkill {
  id: string;
  skillId: SkillBusinessId;
  name: string;
  status: string;
}

export interface Task {
  id: string;
  taskUuid: TaskUuid;
  name: string;
  description: string | null;
  chatServerId: ChatServerUuid;
  chatServer?: TaskChatServer;
  skillId: SkillBusinessId;
  skill?: TaskSkill;
  prompt: string;
  scheduleType: TaskScheduleType;
  scheduleConfig: TaskScheduleConfig;
  timeoutSeconds: number;
  status: TaskStatus;
  lastRunAt: string | null;
  nextRunAt: string | null;
  runCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFormValues {
  name: string;
  description?: string | null;
  chatServerId: ChatServerUuid;
  skillId: SkillBusinessId;
  prompt: string;
  scheduleType: TaskScheduleType;
  scheduleConfig?: TaskScheduleConfig;
  timeoutSeconds?: number;
}

export interface TaskRunTaskSnapshot {
  id: string;
  taskUuid: TaskUuid;
  name: string;
  chatServerId: ChatServerUuid;
  chatServer?: TaskChatServer;
  skillId: SkillBusinessId;
  skill?: TaskSkill;
}

export interface TaskRun {
  id: string;
  runUuid: TaskRunUuid;
  taskId: string | null;
  task: TaskRunTaskSnapshot | null;
  status: TaskRunStatus;
  triggerType: TaskRunTriggerType;
  input: Record<string, unknown>;
  output: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface TaskListFilters {
  search?: string;
  status?: TaskStatus;
  limit?: number;
  offset?: number;
}
