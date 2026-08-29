import { createFileRoute } from "@tanstack/react-router";
import {
  DashboardLayout,
  PageHeader,
} from "@/components/layout/DashboardLayout";

import {
  Card,
  Chip,
} from "@/components/ui-kit";

import {
  Bell,
  Check,
  CheckCheck,
  RefreshCw,
  Trash2,
  Info,
  CircleCheck,
  TriangleAlert,
  CircleX,
  Loader2,
  Inbox,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiRequest } from "@/lib/api";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      {
        title: "Notifications — Netflix Show Manager",
      },
      {
        name: "description",
        content:
          "View and manage your StreamForge notifications.",
      },
      {
        property: "og:title",
        content:
          "Notifications — Netflix Show Manager",
      },
      {
        property: "og:description",
        content:
          "View and manage your StreamForge notifications.",
      },
    ],
  }),
  component: NotificationsPage,
});

// ============================================================
// TYPES
// ============================================================

type NotificationType =
  | "INFO"
  | "SUCCESS"
  | "WARNING"
  | "ERROR";

interface NotificationResponse {
  notificationId: number;
  title: string;
  message: string;
  notificationType: NotificationType;
  isRead: boolean;
}

// ============================================================
// LOCAL USER
// ============================================================

interface StoredUser {
  userId?: number;
  id?: number;
  username?: string;
  role?: string;
  name?: string;
  fullName?: string;
  email?: string;
}

// ============================================================
// GET LOGGED-IN USER
// ============================================================

function getLoggedInUser(): StoredUser | null {
  try {
    const raw =
      localStorage.getItem(
        "streamforge_user"
      );

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

// ============================================================
// GET USER ID
// ============================================================

function getUserId(
  user: StoredUser | null
): number | null {

  if (!user) {
    return null;
  }

  const id =
    user.userId ??
    user.id;

  if (
    id === undefined ||
    id === null ||
    Number.isNaN(Number(id))
  ) {
    return null;
  }

  return Number(id);
}

// ============================================================
// PAGE
// ============================================================

function NotificationsPage() {

  const [notifications, setNotifications] =
    useState<NotificationResponse[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [actionId, setActionId] =
    useState<number | null>(null);

  const [user, setUser] =
    useState<StoredUser | null>(null);

  const [activeFilter, setActiveFilter] =
    useState<
      "ALL" | "UNREAD" | "READ"
    >("ALL");

  // ==========================================================
  // LOAD NOTIFICATIONS
  // ==========================================================

  const loadNotifications =
    useCallback(
      async (
        showRefreshLoader = false
      ) => {

        const loggedUser =
          getLoggedInUser();

        setUser(loggedUser);

        const userId =
          getUserId(loggedUser);

        if (!userId) {

          setNotifications([]);

          setLoading(false);

          setRefreshing(false);

          setError(
            "Unable to determine the logged-in user's ID."
          );

          return;
        }

        try {

          setError(null);

          if (showRefreshLoader) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          const data =
            await apiRequest<
              NotificationResponse[]
            >(
              `/api/notifications/user/${userId}`
            );

          setNotifications(
            Array.isArray(data)
              ? data
              : []
          );

        } catch (err) {

          const message =
            err instanceof Error
              ? err.message
              : "Failed to load notifications.";

          setError(message);

          setNotifications([]);

        } finally {

          setLoading(false);

          setRefreshing(false);
        }
      },
      []
    );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    loadNotifications();

  }, [loadNotifications]);

  // ==========================================================
  // MARK AS READ
  // ==========================================================

  const markAsRead =
    async (
      notificationId: number
    ) => {

      try {

        setActionId(notificationId);

        const updated =
          await apiRequest<
            NotificationResponse
          >(
            `/api/notifications/${notificationId}/read`,
            {
              method: "PUT",
            }
          );

        setNotifications(
          (current) =>
            current.map(
              (notification) =>
                notification.notificationId ===
                notificationId
                  ? {
                      ...notification,
                      ...updated,
                      isRead: true,
                    }
                  : notification
            )
        );

      } catch (err) {

        const message =
          err instanceof Error
            ? err.message
            : "Failed to mark notification as read.";

        setError(message);

      } finally {

        setActionId(null);
      }
    };

  // ==========================================================
  // MARK ALL AS READ
  // ==========================================================

  const markAllAsRead =
    async () => {

      const unread =
        notifications.filter(
          (notification) =>
            !notification.isRead
        );

      if (unread.length === 0) {
        return;
      }

      try {

        setRefreshing(true);

        await Promise.all(
          unread.map(
            (notification) =>
              apiRequest<NotificationResponse>(
                `/api/notifications/${notification.notificationId}/read`,
                {
                  method: "PUT",
                }
              )
          )
        );

        setNotifications(
          (current) =>
            current.map(
              (notification) => ({
                ...notification,
                isRead: true,
              })
            )
        );

      } catch (err) {

        const message =
          err instanceof Error
            ? err.message
            : "Failed to mark all notifications as read.";

        setError(message);

      } finally {

        setRefreshing(false);
      }
    };

  // ==========================================================
  // DELETE NOTIFICATION
  // ==========================================================

  const deleteNotification =
    async (
      notificationId: number
    ) => {

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this notification?"
        );

      if (!confirmed) {
        return;
      }

      try {

        setActionId(notificationId);

        await apiRequest<void>(
          `/api/notifications/${notificationId}`,
          {
            method: "DELETE",
          }
        );

        setNotifications(
          (current) =>
            current.filter(
              (notification) =>
                notification.notificationId !==
                notificationId
            )
        );

      } catch (err) {

        const message =
          err instanceof Error
            ? err.message
            : "Failed to delete notification.";

        setError(message);

      } finally {

        setActionId(null);
      }
    };

  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredNotifications =
    useMemo(() => {

      if (activeFilter === "UNREAD") {

        return notifications.filter(
          (notification) =>
            !notification.isRead
        );
      }

      if (activeFilter === "READ") {

        return notifications.filter(
          (notification) =>
            notification.isRead
        );
      }

      return notifications;

    }, [
      notifications,
      activeFilter,
    ]);

  // ==========================================================
  // COUNTS
  // ==========================================================

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.isRead
    ).length;

  const readCount =
    notifications.filter(
      (notification) =>
        notification.isRead
    ).length;

  const displayName =
    user?.name ||
    user?.fullName ||
    user?.username ||
    user?.email ||
    "User";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <DashboardLayout>

      <div className="space-y-6">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <PageHeader
          title="Notifications"
          description="Stay updated with important events across the content lifecycle."
        />

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (

          <div
            className="
              rounded-xl
              border
              border-destructive/40
              bg-destructive/10
              px-4
              py-3
              text-sm
              text-destructive
              flex
              items-center
              justify-between
              gap-4
            "
          >

            <div className="flex items-center gap-2">

              <CircleX className="h-4 w-4 shrink-0" />

              <span>
                {error}
              </span>

            </div>

            <button
              onClick={() => setError(null)}
              className="text-xs hover:underline"
            >
              Dismiss
            </button>

          </div>
        )}

        {/* ================================================= */}
        {/* USER CARD */}
        {/* ================================================= */}

        <Card>

          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-4">

              <div
                className="
                  h-12
                  w-12
                  rounded-xl
                  bg-primary/10
                  text-primary
                  grid
                  place-items-center
                  shrink-0
                "
              >

                <Bell className="h-5 w-5" />

              </div>

              <div>

                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Logged-in user
                </div>

                <div className="mt-1 text-lg font-semibold">
                  @{displayName}
                </div>

                <div className="text-xs text-muted-foreground">
                  User ID: {getUserId(user) ?? "Unknown"}
                </div>

              </div>

            </div>

            <button
              onClick={() =>
                loadNotifications(true)
              }
              disabled={
                refreshing ||
                loading
              }
              className="
                h-10
                px-4
                rounded-xl
                border
                border-border
                inline-flex
                items-center
                gap-2
                text-sm
                font-medium
                hover:bg-accent
                transition
                disabled:opacity-50
              "
            >

              <RefreshCw
                className={cn(
                  "h-4 w-4",
                  refreshing &&
                    "animate-spin"
                )}
              />

              Refresh

            </button>

          </div>

        </Card>

        {/* ================================================= */}
        {/* STAT CARDS */}
        {/* ================================================= */}

        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-3
            gap-4
          "
        >

          <StatCard
            label="Total notifications"
            value={notifications.length}
            icon={Bell}
          />

          <StatCard
            label="Unread"
            value={unreadCount}
            icon={Inbox}
          />

          <StatCard
            label="Read"
            value={readCount}
            icon={CheckCheck}
          />

        </div>

        {/* ================================================= */}
        {/* NOTIFICATION PANEL */}
        {/* ================================================= */}

        <Card className="!p-0 overflow-hidden">

          {/* PANEL HEADER */}

          <div
            className="
              p-5
              border-b
              border-border
              flex
              flex-col
              lg:flex-row
              lg:items-center
              lg:justify-between
              gap-4
            "
          >

            <div>

              <div className="text-sm font-semibold">
                Your Notifications
              </div>

              <div className="text-xs text-muted-foreground mt-1">
                Notifications generated for your account.
              </div>

            </div>

            <div className="flex items-center gap-2">

              {unreadCount > 0 && (

                <button
                  onClick={markAllAsRead}
                  disabled={refreshing}
                  className="
                    h-9
                    px-3
                    rounded-lg
                    border
                    border-border
                    text-xs
                    font-medium
                    inline-flex
                    items-center
                    gap-2
                    hover:bg-accent
                    transition
                    disabled:opacity-50
                  "
                >

                  <CheckCheck className="h-4 w-4" />

                  Mark all as read

                </button>

              )}

            </div>

          </div>

          {/* FILTERS */}

          <div
            className="
              px-5
              py-4
              border-b
              border-border
              flex
              items-center
              gap-2
              flex-wrap
            "
          >

            <FilterButton
              active={
                activeFilter === "ALL"
              }
              onClick={() =>
                setActiveFilter("ALL")
              }
            >
              All
            </FilterButton>

            <FilterButton
              active={
                activeFilter === "UNREAD"
              }
              onClick={() =>
                setActiveFilter("UNREAD")
              }
            >
              Unread
              {unreadCount > 0 && (
                <span
                  className="
                    ml-1
                    min-w-5
                    h-5
                    px-1.5
                    rounded-full
                    bg-primary
                    text-primary-foreground
                    text-[10px]
                    grid
                    place-items-center
                  "
                >
                  {unreadCount}
                </span>
              )}
            </FilterButton>

            <FilterButton
              active={
                activeFilter === "READ"
              }
              onClick={() =>
                setActiveFilter("READ")
              }
            >
              Read
            </FilterButton>

          </div>

          {/* CONTENT */}

          {loading ? (

            <LoadingState />

          ) : filteredNotifications.length === 0 ? (

            <EmptyState
              filter={activeFilter}
            />

          ) : (

            <div className="divide-y divide-border">

              {filteredNotifications.map(
                (notification) => (

                  <NotificationItem
                    key={
                      notification.notificationId
                    }
                    notification={
                      notification
                    }
                    actionId={actionId}
                    onRead={
                      markAsRead
                    }
                    onDelete={
                      deleteNotification
                    }
                  />

                )
              )}

            </div>

          )}

        </Card>

      </div>

    </DashboardLayout>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {

  return (

    <Card>

      <div className="flex items-center justify-between">

        <div>

          <div
            className="
              text-[10px]
              uppercase
              tracking-widest
              text-muted-foreground
            "
          >
            {label}
          </div>

          <div className="mt-2 text-2xl font-bold">
            {value}
          </div>

        </div>

        <div
          className="
            h-10
            w-10
            rounded-xl
            bg-primary/10
            text-primary
            grid
            place-items-center
          "
        >

          <Icon className="h-5 w-5" />

        </div>

      </div>

    </Card>
  );
}

// ============================================================
// FILTER BUTTON
// ============================================================

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {

  return (

    <button
      onClick={onClick}
      className={cn(
        `
          h-9
          px-4
          rounded-xl
          border
          text-xs
          font-medium
          inline-flex
          items-center
          transition
        `,
        active
          ? `
              border-primary
              bg-primary
              text-primary-foreground
            `
          : `
              border-border
              hover:bg-accent
            `
      )}
    >

      {children}

    </button>
  );
}

// ============================================================
// NOTIFICATION ITEM
// ============================================================

function NotificationItem({
  notification,
  actionId,
  onRead,
  onDelete,
}: {
  notification: NotificationResponse;
  actionId: number | null;
  onRead: (
    notificationId: number
  ) => void;
  onDelete: (
    notificationId: number
  ) => void;
}) {

  const Icon =
    getNotificationIcon(
      notification.notificationType
    );

  const isProcessing =
    actionId ===
    notification.notificationId;

  return (

    <div
      className={cn(
        `
          p-5
          transition
          hover:bg-accent/20
        `,
        !notification.isRead &&
          "bg-primary/[0.03]"
      )}
    >

      <div className="flex items-start gap-4">

        {/* ICON */}

        <div
          className={cn(
            `
              h-11
              w-11
              rounded-xl
              grid
              place-items-center
              shrink-0
            `,
            getNotificationIconBackground(
              notification.notificationType
            )
          )}
        >

          <Icon className="h-5 w-5" />

        </div>

        {/* CONTENT */}

        <div className="min-w-0 flex-1">

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">

            <div>

              <div className="flex items-center gap-2">

                <h3
                  className={cn(
                    "text-sm",
                    notification.isRead
                      ? "font-medium"
                      : "font-semibold"
                  )}
                >
                  {notification.title}
                </h3>

                {!notification.isRead && (

                  <span
                    className="
                      h-2
                      w-2
                      rounded-full
                      bg-primary
                      shrink-0
                    "
                    title="Unread"
                  />

                )}

              </div>

              <p
                className="
                  mt-1.5
                  text-sm
                  text-muted-foreground
                  leading-relaxed
                "
              >
                {notification.message}
              </p>

            </div>

            <Chip
              variant={
                getChipVariant(
                  notification.notificationType
                )
              }
            >
              {notification.notificationType}
            </Chip>

          </div>

          {/* ACTIONS */}

          <div
            className="
              mt-4
              flex
              items-center
              gap-2
              flex-wrap
            "
          >

            {!notification.isRead && (

              <button
                onClick={() =>
                  onRead(
                    notification.notificationId
                  )
                }
                disabled={isProcessing}
                className="
                  h-8
                  px-3
                  rounded-lg
                  border
                  border-border
                  text-xs
                  font-medium
                  inline-flex
                  items-center
                  gap-1.5
                  hover:bg-accent
                  transition
                  disabled:opacity-50
                "
              >

                {isProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}

                Mark as read

              </button>

            )}

            <button
              onClick={() =>
                onDelete(
                  notification.notificationId
                )
              }
              disabled={isProcessing}
              className="
                h-8
                px-3
                rounded-lg
                border
                border-destructive/30
                text-destructive
                text-xs
                font-medium
                inline-flex
                items-center
                gap-1.5
                hover:bg-destructive/10
                transition
                disabled:opacity-50
              "
            >

              <Trash2 className="h-3.5 w-3.5" />

              Delete

            </button>

            {notification.isRead && (

              <span
                className="
                  text-[11px]
                  text-muted-foreground
                  inline-flex
                  items-center
                  gap-1.5
                "
              >

                <CheckCheck className="h-3.5 w-3.5" />

                Read

              </span>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}

// ============================================================
// LOADING
// ============================================================

function LoadingState() {

  return (

    <div
      className="
        min-h-[320px]
        grid
        place-items-center
      "
    >

      <div className="flex flex-col items-center gap-3">

        <Loader2
          className="
            h-7
            w-7
            animate-spin
            text-primary
          "
        />

        <p className="text-sm text-muted-foreground">
          Loading notifications...
        </p>

      </div>

    </div>
  );
}

// ============================================================
// EMPTY
// ============================================================

function EmptyState({
  filter,
}: {
  filter: "ALL" | "UNREAD" | "READ";
}) {

  const message =
    filter === "UNREAD"
      ? "You have no unread notifications."
      : filter === "READ"
        ? "You have no read notifications."
        : "You don't have any notifications yet.";

  return (

    <div
      className="
        min-h-[320px]
        grid
        place-items-center
        p-8
      "
    >

      <div className="text-center">

        <div
          className="
            mx-auto
            h-14
            w-14
            rounded-2xl
            bg-primary/10
            text-primary
            grid
            place-items-center
            mb-4
          "
        >

          <Bell className="h-6 w-6" />

        </div>

        <h3 className="text-base font-semibold">
          No notifications
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          {message}
        </p>

      </div>

    </div>
  );
}

// ============================================================
// ICON
// ============================================================

function getNotificationIcon(
  type: NotificationType
) {

  switch (type) {

    case "SUCCESS":
      return CircleCheck;

    case "WARNING":
      return TriangleAlert;

    case "ERROR":
      return CircleX;

    case "INFO":
    default:
      return Info;
  }
}

// ============================================================
// ICON BACKGROUND
// ============================================================

function getNotificationIconBackground(
  type: NotificationType
) {

  switch (type) {

    case "SUCCESS":
      return "bg-success/10 text-success";

    case "WARNING":
      return "bg-warning/10 text-warning";

    case "ERROR":
      return "bg-destructive/10 text-destructive";

    case "INFO":
    default:
      return "bg-primary/10 text-primary";
  }
}

// ============================================================
// CHIP VARIANT
// ============================================================

function getChipVariant(
  type: NotificationType
) {

  switch (type) {

    case "SUCCESS":
      return "success" as const;

    case "WARNING":
      return "warning" as const;

    case "ERROR":
      return "danger" as const;

    case "INFO":
    default:
      return "info" as const;
  }
}