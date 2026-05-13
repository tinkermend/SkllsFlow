export type TaskScheduleType = "manual" | "daily" | "weekly" | "monthly";
export type TaskStatus = "active" | "paused" | "disabled";
export type TaskRunStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "cancelled";
export type TaskRunTriggerType = "manual" | "test" | "schedule";

export type TaskScheduleConfig = Record<string, unknown> | null;

export interface TaskChatServer {
  id: string;
  chatId: string;
  name: string;
  host: string;
  port: number;
  status: string;
}

export interface TaskSkill {
  id: string;
  skillId: string;
  name: string;
  status: string;
}

export interface Task {
  id: string;
  taskUuid: string;
  name: string;
  description: string | null;
  chatServerId: string;
  chatServer?: TaskChatServer;
  skillId: string;
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
  chatServerId: string;
  skillId: string;
  prompt: string;
  scheduleType: TaskScheduleType;
  scheduleConfig?: TaskScheduleConfig;
  timeoutSeconds?: number;
}

export interface TaskRunTaskSnapshot {
  id: string;
  taskUuid: string;
  name: string;
  chatServerId: string;
  chatServer?: TaskChatServer;
  skillId: string;
  skill?: TaskSkill;
}

export interface TaskRun {
  id: string;
  runUuid: string;
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
