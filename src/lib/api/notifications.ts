import { apiClient } from "@/lib/api-client";
import type { Notification } from "@/types";

export const notificationsApi = {
  async liste(): Promise<{ notifications: Notification[] }> {
    const { data } = await apiClient.get<{ notifications: Notification[] }>(
      "/notifications"
    );
    return data;
  },

  async marquerLue(id: number): Promise<{ message: string }> {
    const { data } = await apiClient.put<{ message: string }>(
      `/notifications/${id}/lu`
    );
    return data;
  },

  async marquerToutesLues(): Promise<{ message: string }> {
    const { data } = await apiClient.put<{ message: string }>(
      "/notifications/lu-tout"
    );
    return data;
  },

  async nbNonLues(): Promise<{ nb: number }> {
    const { data } = await apiClient.get<{ nb: number }>("/notifications/nb-non-lues");
    return data;
  },
};
