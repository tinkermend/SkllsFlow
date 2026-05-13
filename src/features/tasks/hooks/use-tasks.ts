import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTask,
  deleteTask,
  getTasks,
  pauseTask,
  resumeTask,
  runTask,
  updateTask,
} from "../api/tasks.api";
import type { TaskFormValues, TaskListFilters } from "../types";
import { taskRunKeys } from "./use-task-runs";

export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (filters?: TaskListFilters) => [...taskKeys.lists(), filters] as const,
};

export function useTasks(filters?: TaskListFilters) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => getTasks(filters),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaskFormValues) => createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskUuid,
      data,
    }: {
      taskUuid: string;
      data: Partial<TaskFormValues>;
    }) => updateTask(taskUuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskUuid: string) => deleteTask(taskUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useRunTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskUuid: string) => runTask(taskUuid),
    onSuccess: (_, taskUuid) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskRunKeys.list(taskUuid) });
    },
  });
}

export function usePauseTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskUuid: string) => pauseTask(taskUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useResumeTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskUuid: string) => resumeTask(taskUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
