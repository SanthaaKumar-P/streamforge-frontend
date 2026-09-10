import { apiRequest } from "@/lib/api";

/* =========================================================
   NOTIFICATION TYPES
========================================================= */

export type NotificationType =
  | "INFO"
  | "SUCCESS"
  | "WARNING"
  | "ERROR";

/* =========================================================
   NOTIFICATION RESPONSE
========================================================= */

export interface NotificationResponse {
  notificationId: number;
  title: string;
  message: string;
  notificationType: NotificationType;
  isRead: boolean;
}

/* =========================================================
   GET USER NOTIFICATIONS
========================================================= */

export async function getUserNotifications(
  userId: number
): Promise<NotificationResponse[]> {

  const data =
    await apiRequest<NotificationResponse[]>(
      `/api/notifications/user/${userId}`
    );

  return Array.isArray(data)
    ? data
    : [];
}

/* =========================================================
   MARK AS READ
========================================================= */

export async function markNotificationAsRead(
  notificationId: number
): Promise<NotificationResponse> {

  return apiRequest<NotificationResponse>(
    `/api/notifications/${notificationId}/read`,
    {
      method: "PUT",
    }
  );
}

/* =========================================================
   DELETE NOTIFICATION
========================================================= */

export async function deleteNotification(
  notificationId: number
): Promise<void> {

  await apiRequest(
    `/api/notifications/${notificationId}`,
    {
      method: "DELETE",
    }
  );
}