import { API_ENDPOINTS } from "@/config/api";
import { apiClient } from "@/lib/api-client";
import type { Task, TaskFormValues, TaskListFilters, TaskRun } from "../types";

export async function getTasks(params?: TaskListFilters): Promise<Task[]> {
  const response = await apiClient.get<Task[]>(API_ENDPOINTS.tasks.list, {
    params,
  });
  return response.data;
}

export async function createTask(data: TaskFormValues): Promise<Task> {
  const response = await apiClient.post<Task>(API_ENDPOINTS.tasks.create, data);
  return response.data;
}

export async function updateTask(
  taskUuid: string,
  data: Partial<TaskFormValues>,
): Promise<Task> {
  const response = await apiClient.patch<Task>(
    API_ENDPOINTS.tasks.update(taskUuid),
    data,
  );
  return response.data;
}

export async function deleteTask(taskUuid: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.tasks.delete(taskUuid));
}

export async function runTask(taskUuid: string): Promise<TaskRun> {
  const response = await apiClient.post<TaskRun>(
    API_ENDPOINTS.tasks.run(taskUuid),
  );
  return response.data;
}

export async function pauseTask(taskUuid: string): Promise<Task> {
  const response = await apiClient.post<Task>(
    API_ENDPOINTS.tasks.pause(taskUuid),
  );
  return response.data;
}

export async function resumeTask(taskUuid: string): Promise<Task> {
  const response = await apiClient.post<Task>(
    API_ENDPOINTS.tasks.resume(taskUuid),
  );
  return response.data;
}

export async function getTaskRuns(taskUuid: string): Promise<TaskRun[]> {
  const response = await apiClient.get<TaskRun[]>(
    API_ENDPOINTS.tasks.runs(taskUuid),
  );
  return response.data;
}

export async function getTaskRun(runUuid: string): Promise<TaskRun> {
  const response = await apiClient.get<TaskRun>(
    API_ENDPOINTS.tasks.runDetail(runUuid),
  );
  return response.data;
}

export async function testRun(data: TaskFormValues): Promise<TaskRun> {
  const response = await apiClient.post<TaskRun>(
    API_ENDPOINTS.tasks.testRun,
    data,
  );
  return response.data;
}
