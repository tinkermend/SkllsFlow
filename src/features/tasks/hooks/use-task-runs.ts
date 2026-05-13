import { useQuery } from "@tanstack/react-query";
import { getTaskRuns } from "../api/tasks.api";

export const taskRunKeys = {
  all: ["task-runs"] as const,
  lists: () => [...taskRunKeys.all, "list"] as const,
  list: (taskUuid: string) => [...taskRunKeys.lists(), taskUuid] as const,
};

export function useTaskRuns(taskUuid: string) {
  return useQuery({
    queryKey: taskRunKeys.list(taskUuid),
    queryFn: () => getTaskRuns(taskUuid),
    enabled: !!taskUuid,
  });
}
