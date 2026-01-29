import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { roleListSchema } from "../data/schema";

export function useRolesQuery() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await apiClient.get("/roles");
      return roleListSchema.parse(response.data);
    },
  });
}
