const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080";

/* =========================================================
   STORAGE KEYS
   ========================================================= */

const TOKEN_KEY = "streamforge_token";
const USER_KEY = "streamforge_user";

/* =========================================================
   TOKEN STORAGE HELPERS
   ========================================================= */

/**
 * Read a JWT expiration time without verifying the signature.
 *
 * IMPORTANT:
 * This is only used to decide whether a locally stored token
 * is obviously expired. The backend remains responsible for
 * cryptographic JWT validation.
 */
function getJwtExpiration(token: string): number | null {
  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];

    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded =
      base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    const decoded = JSON.parse(
      atob(padded)
    );

    if (
      typeof decoded.exp !== "number" ||
      !Number.isFinite(decoded.exp)
    ) {
      return null;
    }

    return decoded.exp;
  } catch {
    return null;
  }
}

/**
 * Check whether a JWT is expired.
 */
function isTokenExpired(token: string): boolean {
  const expiration = getJwtExpiration(token);

  // If we cannot read exp, let the backend validate it.
  if (expiration === null) {
    return false;
  }

  const nowInSeconds = Math.floor(
    Date.now() / 1000
  );

  return expiration <= nowInSeconds;
}

/**
 * Remove all StreamForge authentication information
 * from both browser storage locations.
 */
function clearAuthStorage(): void {
  const keys = [
    TOKEN_KEY,
    USER_KEY,
    "streamforge_username",
    "streamforge_email",
    "streamforge_user_id",
    "streamforge_role",
  ];

  for (const key of keys) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}

/**
 * Get a usable JWT.
 *
 * IMPORTANT:
 *
 * We inspect BOTH localStorage and sessionStorage.
 *
 * If localStorage contains an expired token but
 * sessionStorage contains a valid token, the valid token wins.
 */
function getAccessToken(): string | null {
  const localToken =
    localStorage.getItem(TOKEN_KEY);

  const sessionToken =
    sessionStorage.getItem(TOKEN_KEY);

  const candidates = [
    sessionToken,
    localToken,
  ].filter(
    (token): token is string =>
      Boolean(token && token.trim())
  );

  if (candidates.length === 0) {
    return null;
  }

  // Prefer a non-expired token.
  const validToken = candidates.find(
    (token) => !isTokenExpired(token)
  );

  if (validToken) {
    return validToken;
  }

  // Every locally stored token is expired.
  clearAuthStorage();

  return null;
}

/* =========================================================
   ERROR PARSING
   ========================================================= */

async function getErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const contentType =
      response.headers.get("content-type") || "";

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      const data = await response.json();

      return (
        data?.message ||
        data?.error ||
        data?.detail ||
        fallback
      );
    }

    const text =
      await response.text();

    return text.trim() || fallback;
  } catch {
    return fallback;
  }
}

/* =========================================================
   API REQUEST
   ========================================================= */

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();

  const headers =
    new Headers(options.headers);

  /*
   * JSON requests get application/json.
   *
   * FormData is intentionally excluded because the browser
   * must generate the multipart boundary automatically.
   */
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  /*
   * Add JWT only when we actually have a usable token.
   */
  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  } else {
    headers.delete("Authorization");
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  /* =======================================================
     401 — AUTHENTICATION FAILURE
     ======================================================= */

  if (response.status === 401) {
    clearAuthStorage();

    /*
     * Don't redirect if we're already on login.
     */
    if (
      window.location.pathname !== "/login"
    ) {
      window.location.href = "/login";
    }

    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  /* =======================================================
     403 — AUTHORIZED USER DOES NOT HAVE PERMISSION
     ======================================================= */

  if (response.status === 403) {
    const message =
      await getErrorMessage(
        response,
        "Access denied. You do not have permission to perform this action."
      );

    throw new Error(message);
  }

  /* =======================================================
     OTHER HTTP ERRORS
     ======================================================= */

  if (!response.ok) {
    const message =
      await getErrorMessage(
        response,
        `Request failed with status ${response.status}.`
      );

    throw new Error(message);
  }

  /* =======================================================
     NO CONTENT
     ======================================================= */

  if (response.status === 204) {
    return undefined as T;
  }

  /* =======================================================
     RESPONSE PARSING
     ======================================================= */

  const contentType =
    response.headers.get("content-type") || "";

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    return await response.json() as T;
  }

  /*
   * Supports successful text/plain responses.
   *
   * Important for DELETE endpoints that return:
   * "Show deleted successfully"
   */
  return await response.text() as T;
}

/* =========================================================
   AUTHENTICATED FILE DOWNLOAD
   ========================================================= */

export async function downloadFile(
  filePath: string
): Promise<void> {
  const token = getAccessToken();

  const headers =
    new Headers();

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const response =
    await fetch(
      `${API_BASE_URL}${filePath}`,
      {
        method: "GET",
        headers,
      }
    );

  /* =======================================================
     401
     ======================================================= */

  if (response.status === 401) {
    clearAuthStorage();

    if (
      window.location.pathname !== "/login"
    ) {
      window.location.href = "/login";
    }

    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  /* =======================================================
     403
     ======================================================= */

  if (response.status === 403) {
    throw new Error(
      "Access denied. You do not have permission to download this file."
    );
  }

  /* =======================================================
     OTHER ERRORS
     ======================================================= */

  if (!response.ok) {
    const message =
      await getErrorMessage(
        response,
        "Unable to download the file."
      );

    throw new Error(message);
  }

  /* =======================================================
     DOWNLOAD BLOB
     ======================================================= */

  const blob =
    await response.blob();

  const url =
    window.URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;

  const disposition =
    response.headers.get(
      "content-disposition"
    );

  const filenameMatch =
    disposition?.match(
      /filename\*?=(?:UTF-8''|")?([^";]+)"?/i
    );

  anchor.download =
    filenameMatch?.[1]
      ? decodeURIComponent(
          filenameMatch[1]
        )
      : "streamforge-report";

  document.body.appendChild(anchor);

  anchor.click();

  anchor.remove();

  window.URL.revokeObjectURL(url);
}

/* =========================================================
   OPTIONAL PUBLIC ACCESS TO API BASE URL
   ========================================================= */

export { API_BASE_URL };