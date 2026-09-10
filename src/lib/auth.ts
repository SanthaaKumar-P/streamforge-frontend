/* =========================================================
   StreamForge Authentication Utility
   SSR SAFE VERSION
========================================================= */

export const TOKEN_KEY =
  "streamforge_token";

export const USER_KEY =
  "streamforge_user";

const AUTH_KEYS = [
  TOKEN_KEY,
  USER_KEY,
  "streamforge_username",
  "streamforge_email",
  "streamforge_user_id",
  "streamforge_role",
];

/* =========================================================
   STORAGE ACCESS
   SSR SAFE
========================================================= */

function getStorages(): Storage[] {
  if (
    typeof window === "undefined"
  ) {
    return [];
  }

  return [
    window.localStorage,
    window.sessionStorage,
  ];
}

/* =========================================================
   TOKEN
========================================================= */

export function getToken(): string | null {
  const storages =
    getStorages();

  for (
    const storage of storages
  ) {
    const token =
      storage.getItem(
        TOKEN_KEY,
      );

    if (
      token &&
      token.trim()
    ) {
      return token;
    }
  }

  return null;
}

/* =========================================================
   USER
========================================================= */

export function getStoredUser(): any | null {
  const storages =
    getStorages();

  for (
    const storage of storages
  ) {
    const user =
      storage.getItem(
        USER_KEY,
      );

    if (!user) {
      continue;
    }

    try {
      return JSON.parse(
        user,
      );
    } catch {
      continue;
    }
  }

  return null;
}

/* =========================================================
   CURRENT USER ID
========================================================= */

export function getCurrentUserId(): number | null {
  const user =
    getStoredUser();

  /*
   * Preferred source:
   * logged-in backend user object.
   */

  if (
    user?.userId !==
      undefined &&
    user?.userId !== null
  ) {
    const id =
      Number(
        user.userId,
      );

    if (
      Number.isFinite(id)
    ) {
      return id;
    }
  }

  /*
   * Fallback:
   * existing storage value.
   */

  const storages =
    getStorages();

  for (
    const storage of storages
  ) {
    const rawId =
      storage.getItem(
        "streamforge_user_id",
      );

    if (!rawId) {
      continue;
    }

    const id =
      Number(rawId);

    if (
      Number.isFinite(id)
    ) {
      return id;
    }
  }

  return null;
}

/* =========================================================
   ROLE
========================================================= */

export function getStoredRole(): string | null {
  const user =
    getStoredUser();

  /*
   * Backend may return:
   *
   * role: {
   *   roleName: "CREATOR"
   * }
   */

  if (
    user?.role?.roleName
  ) {
    return String(
      user.role.roleName,
    ).toUpperCase();
  }

  /*
   * Some responses may return:
   *
   * roleName: "CREATOR"
   */

  if (
    user?.roleName
  ) {
    return String(
      user.roleName,
    ).toUpperCase();
  }

  /*
   * Fallback to storage.
   */

  const storages =
    getStorages();

  for (
    const storage of storages
  ) {
    const role =
      storage.getItem(
        "streamforge_role",
      );

    if (
      role &&
      role.trim()
    ) {
      return role
        .trim()
        .toUpperCase();
    }
  }

  return null;
}

/* =========================================================
   ALIAS
   =========================================================

   Some frontend files may use getCurrentRole()
   while older files use getStoredRole().

   Keep both so existing imports don't break.
========================================================= */

export function getCurrentRole(): string | null {
  return getStoredRole();
}

/* =========================================================
   SAVE AUTH
========================================================= */

export function saveAuth(
  token: string,
  user: any,
  remember: boolean = true,
): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  /*
   * Important:
   *
   * If user chooses localStorage,
   * remove old session credentials.
   *
   * If user chooses sessionStorage,
   * remove old local credentials.
   *
   * This prevents stale tokens from
   * another login taking priority.
   */

  const storage =
    remember
      ? window.localStorage
      : window.sessionStorage;

  const otherStorage =
    remember
      ? window.sessionStorage
      : window.localStorage;

  /*
   * Clear old auth credentials
   * from the opposite storage.
   */

  for (
    const key of AUTH_KEYS
  ) {
    otherStorage.removeItem(
      key,
    );
  }

  /*
   * Save token.
   */

  storage.setItem(
    TOKEN_KEY,
    token,
  );

  /*
   * Save user.
   */

  storage.setItem(
    USER_KEY,
    JSON.stringify(user),
  );

  /*
   * Username.
   */

  if (
    user?.username
  ) {
    storage.setItem(
      "streamforge_username",
      String(
        user.username,
      ),
    );
  }

  /*
   * Email.
   */

  if (
    user?.email
  ) {
    storage.setItem(
      "streamforge_email",
      String(
        user.email,
      ),
    );
  }

  /*
   * User ID.
   */

  if (
    user?.userId !==
      undefined &&
    user?.userId !== null
  ) {
    storage.setItem(
      "streamforge_user_id",
      String(
        user.userId,
      ),
    );
  }

  /*
   * Role.
   */

  const role =
    user?.role?.roleName ||
    user?.roleName;

  if (role) {
    storage.setItem(
      "streamforge_role",
      String(
        role,
      ).toUpperCase(),
    );
  }

  /*
   * Tell the application that
   * authentication has changed.
   */

  notifyAuthChanged();
}

/* =========================================================
   CLEAR AUTH
========================================================= */

export function clearAuthStorage(): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  for (
    const storage of getStorages()
  ) {
    for (
      const key of AUTH_KEYS
    ) {
      storage.removeItem(
        key,
      );
    }
  }
}

/* =========================================================
   AUTH CHECK
========================================================= */

export function isAuthenticated(): boolean {
  return Boolean(
    getToken(),
  );
}

/* =========================================================
   AUTH CHANGE EVENT
========================================================= */

export function notifyAuthChanged(): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  /*
   * Keep your existing event name.
   */

  window.dispatchEvent(
    new Event(
      "streamforge:auth-changed",
    ),
  );
}

/* =========================================================
   LOGOUT
========================================================= */

export function logout(): void {
  clearAuthStorage();

  notifyAuthChanged();

  if (
    typeof window !==
    "undefined"
  ) {
    window.location.href =
      "/login";
  }
}