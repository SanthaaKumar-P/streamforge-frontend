import type { User } from "../api/UserApi";

export function getToken(): string | null {
  return (
    localStorage.getItem("streamforge_token") ||
    sessionStorage.getItem("streamforge_token")
  );
}

export function getStoredUser(): User | null {
  const raw =
    localStorage.getItem("streamforge_user") ||
    sessionStorage.getItem("streamforge_user");

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function getCurrentUserId(): number | null {
  const user = getStoredUser();

  if (user?.userId !== undefined) {
    return Number(user.userId);
  }

  const storedId =
    localStorage.getItem("streamforge_user_id") ||
    sessionStorage.getItem("streamforge_user_id");

  if (!storedId) {
    return null;
  }

  const id = Number(storedId);

  return Number.isNaN(id) ? null : id;
}

export function getCurrentRole(): string | null {
  return (
    localStorage.getItem("streamforge_role") ||
    sessionStorage.getItem("streamforge_role")
  );
}

export function logout() {
  localStorage.removeItem("streamforge_token");
  localStorage.removeItem("streamforge_user");
  localStorage.removeItem("streamforge_user_id");
  localStorage.removeItem("streamforge_username");
  localStorage.removeItem("streamforge_email");
  localStorage.removeItem("streamforge_role");

  sessionStorage.removeItem("streamforge_token");
  sessionStorage.removeItem("streamforge_user");
  sessionStorage.removeItem("streamforge_user_id");
  sessionStorage.removeItem("streamforge_username");
  sessionStorage.removeItem("streamforge_email");
  sessionStorage.removeItem("streamforge_role");
}