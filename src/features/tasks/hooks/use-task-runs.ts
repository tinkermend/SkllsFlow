import { useQuery } from "@tanstack/react-query";
import { getTaskRuns } from "../api/tasks.api";
import type { TaskUuid } from "../types";

export const taskRunKeys = {
  all: ["task-runs"] as const,
  lists: () => [...taskRunKeys.all, "list"] as const,
  list: (taskUuid: TaskUuid) => [...taskRunKeys.lists(), taskUuid] as const,
};

export function useTaskRuns(taskUuid: TaskUuid | undefined) {
  return useQuery({
    queryKey: taskRunKeys.list(taskUuid ?? ("" as TaskUuid)),
    queryFn: () => getTaskRuns(taskUuid as TaskUuid),
    enabled: !!taskUuid,
  });
}
