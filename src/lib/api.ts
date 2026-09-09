const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080";


// ============================================================
// STORAGE
// ============================================================

function getStorages(): Storage[] {

  if (
    typeof window === "undefined"
  ) {
    return [];
  }

  return [
    localStorage,
    sessionStorage,
  ];
}


// ============================================================
// CLEAR AUTH
// ============================================================

function clearClientAuth(): void {

  const keys = [
    "streamforge_token",
    "streamforge_refresh_token",
    "streamforge_user",
    "streamforge_user_id",
    "streamforge_username",
    "streamforge_email",
    "streamforge_role",
  ];


  for (
    const storage of getStorages()
  ) {

    for (
      const key of keys
    ) {

      storage.removeItem(
        key
      );
    }
  }


  if (
    typeof window !==
    "undefined"
  ) {

    window.dispatchEvent(
      new Event(
        "streamforge:auth-changed"
      )
    );
  }
}


// ============================================================
// JWT PAYLOAD
// ============================================================

function decodeJwtPayload(
  token: string
): {
  exp?: number;
  sub?: string;
  type?: string;
  [key: string]: unknown;
} | null {

  try {

    const parts =
      token.split(".");

    if (
      parts.length !== 3
    ) {

      return null;
    }


    const base64 =
      parts[1]
        .replace(
          /-/g,
          "+"
        )
        .replace(
          /_/g,
          "/"
        );


    const padded =
      base64 +
      "=".repeat(
        (
          4 -
          (
            base64.length %
            4
          )
        ) % 4
      );


    const decoded =
      atob(
        padded
      );


    return JSON.parse(
      decoded
    );

  } catch {

    return null;
  }
}


// ============================================================
// TOKEN VALIDITY
// ============================================================

function isTokenUsable(
  token: string | null,
  minimumValiditySeconds = 5
): boolean {

  if (!token) {

    return false;
  }


  const payload =
    decodeJwtPayload(
      token
    );


  if (
    typeof payload?.exp !==
    "number"
  ) {

    return false;
  }


  const now =
    Math.floor(
      Date.now() / 1000
    );


  return (
    payload.exp >
    now +
      minimumValiditySeconds
  );
}


/* =========================================================
   FIND VALID ACCESS TOKEN
========================================================= */

function findValidAccessToken(): {
  storage: Storage;
  token: string;
} | null {

  for (
    const storage of getStorages()
  ) {

    const token =
      storage.getItem(
        "streamforge_token"
      );

    /*
     * Explicitly check token !== null
     * before returning it.
     *
     * This satisfies TypeScript that
     * token is definitely a string.
     */
    if (
      token !== null &&
      isTokenUsable(
        token
      )
    ) {

      return {
        storage,
        token,
      };
    }
  }

  return null;
}

// ============================================================
// FIND REFRESH TOKEN
// ============================================================

function findRefreshToken(): {
  storage: Storage;
  token: string;
} | null {

  /*
   * Prefer the refresh token belonging
   * to the same storage as a valid access
   * token.
   */

  const validAccess =
    findValidAccessToken();


  if (validAccess) {

    const refresh =
      validAccess.storage.getItem(
        "streamforge_refresh_token"
      );


    if (refresh) {

      return {
        storage:
          validAccess.storage,

        token:
          refresh,
      };
    }
  }


  /*
   * Otherwise check both storages.
   */

  for (
    const storage of getStorages()
  ) {

    const refresh =
      storage.getItem(
        "streamforge_refresh_token"
      );


    if (refresh) {

      return {
        storage,
        token: refresh,
      };
    }
  }


  return null;
}


// ============================================================
// ACTIVE TOKEN
// ============================================================

function activeToken():
  string | null {

  return (
    findValidAccessToken()
      ?.token ??
    null
  );
}


// ============================================================
// REFRESH ACCESS TOKEN
// ============================================================

let refreshPromise:
  Promise<string | null> | null =
  null;


async function refreshAccessToken():
  Promise<string | null> {

  /*
   * Prevent multiple simultaneous
   * refresh requests.
   */

  if (
    refreshPromise
  ) {

    return refreshPromise;
  }


  refreshPromise =
    (async () => {

      const refreshData =
        findRefreshToken();


      if (!refreshData) {

        return null;
      }


      try {

        const response =
          await fetch(
            `${API_BASE_URL}/api/auth/refresh`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  refreshToken:
                    refreshData.token,
                }),
            }
          );


        if (
          !response.ok
        ) {

          return null;
        }


        const data =
          await response.json();


        if (
          !data?.accessToken
        ) {

          return null;
        }


        refreshData.storage.setItem(
          "streamforge_token",
          data.accessToken
        );


        if (
          data.refreshToken
        ) {

          refreshData.storage.setItem(
            "streamforge_refresh_token",
            data.refreshToken
          );
        }


        if (
          data.user
        ) {

          refreshData.storage.setItem(
            "streamforge_user",
            JSON.stringify(
              data.user
            )
          );
        }


        window.dispatchEvent(
          new Event(
            "streamforge:auth-changed"
          )
        );


        return data.accessToken;

      } catch (
        error
      ) {

        console.error(
          "Token refresh failed:",
          error
        );

        return null;

      } finally {

        refreshPromise =
          null;
      }

    })();


  return refreshPromise;
}


// ============================================================
// ERROR MESSAGE
// ============================================================

async function readErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";


  try {

    if (
      contentType.includes(
        "application/json"
      )
    ) {

      const error =
        await response.json();


      if (
        typeof error?.message ===
        "string"
      ) {

        return error.message;
      }


      if (
        typeof error?.error ===
        "string"
      ) {

        return error.error;
      }


      if (
        Array.isArray(
          error?.errors
        )
      ) {

        const messages =
          error.errors
            .map(
              (
                item: {
                  defaultMessage?: string;
                  message?: string;
                }
              ) =>
                item.defaultMessage ||
                item.message ||
                ""
            )
            .filter(
              Boolean
            );


        if (
          messages.length > 0
        ) {

          return messages.join(
            ", "
          );
        }
      }

    } else {

      const text =
        await response.text();


      if (
        text.trim()
      ) {

        return text.trim();
      }
    }

  } catch {
    // Use fallback.
  }


  return fallback;
}


// ============================================================
// API REQUEST
// ============================================================

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {

  const headers =
    new Headers(
      options.headers
    );


  // ----------------------------------------------------------
  // CONTENT TYPE
  // ----------------------------------------------------------

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has(
      "Content-Type"
    )
  ) {

    headers.set(
      "Content-Type",
      "application/json"
    );
  }


  // ----------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------

  let token =
    activeToken();


  /*
   * If the access token is already expired,
   * refresh before making the request.
   */

  if (
    !token &&
    !endpoint.startsWith(
      "/api/auth/"
    )
  ) {

    token =
      await refreshAccessToken();
  }


  if (
    token &&
    !endpoint.startsWith(
      "/api/auth/"
    )
  ) {

    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }


  // ----------------------------------------------------------
  // FETCH
  // ----------------------------------------------------------

  let response: Response;


  try {

    response =
      await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
          ...options,
          headers,
        }
      );

  } catch (
    error
  ) {

    console.error(
      "API connection failed:",
      error
    );


    throw new Error(
      "Unable to connect to the StreamForge backend. Please make sure the backend is running on port 8080."
    );
  }


  // ==========================================================
  // 401
  // ==========================================================

  if (
    response.status === 401 &&
    !endpoint.startsWith(
      "/api/auth/"
    )
  ) {

    const freshToken =
      await refreshAccessToken();


    if (
      freshToken
    ) {

      headers.set(
        "Authorization",
        `Bearer ${freshToken}`
      );


      try {

        response =
          await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
              ...options,
              headers,
            }
          );

      } catch {

        throw new Error(
          "Unable to connect to the StreamForge backend."
        );
      }
    }
  }


  // ==========================================================
  // AUTH ENDPOINT 401
  // ==========================================================

  if (
    response.status === 401 &&
    endpoint.startsWith(
      "/api/auth/"
    )
  ) {

    const message =
      await readErrorMessage(
        response,
        "Invalid username or password."
      );


    throw new Error(
      message
    );
  }


  // ==========================================================
  // PROTECTED ENDPOINT STILL 401
  // ==========================================================

  if (
    response.status === 401
  ) {

    clearClientAuth();


    if (
      typeof window !==
        "undefined" &&
      window.location.pathname !==
        "/login"
    ) {

      window.location.href =
        "/login";
    }


    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }


  // ==========================================================
  // 403
  // ==========================================================

  if (
    response.status === 403
  ) {

    throw new Error(
      "Access denied. You do not have permission to perform this action."
    );
  }


  // ==========================================================
  // OTHER ERRORS
  // ==========================================================

  if (
    !response.ok
  ) {

    const message =
      await readErrorMessage(
        response,
        "Something went wrong."
      );


    throw new Error(
      message
    );
  }


  // ==========================================================
  // 204
  // ==========================================================

  if (
    response.status === 204
  ) {

    return undefined as T;
  }


  // ==========================================================
  // RESPONSE
  // ==========================================================

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";


  if (
    contentType.includes(
      "application/json"
    )
  ) {

    return (
      await response.json()
    ) as T;
  }


  const text =
    await response.text();


  return text as T;
}


// ============================================================
// DOWNLOAD REPORT FILE
// ============================================================

export async function downloadFile(
  filePath: string
): Promise<void> {

  /*
   * --------------------------------------------------------
   * GET VALID TOKEN
   * --------------------------------------------------------
   */

  let token =
    activeToken();


  /*
   * If access token expired,
   * refresh it before downloading.
   */

  if (!token) {

    token =
      await refreshAccessToken();
  }


  if (!token) {

    clearClientAuth();


    if (
      typeof window !==
        "undefined"
    ) {

      window.location.href =
        "/login";
    }


    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }


  /*
   * --------------------------------------------------------
   * VALIDATE PATH
   * --------------------------------------------------------
   */

  if (
    !filePath ||
    !filePath.trim()
  ) {

    throw new Error(
      "Report file path is empty."
    );
  }


  /*
   * Backend stores:
   *
   * /reports/filename.pdf
   *
   * The ReportFileController expects:
   *
   * /api/reports/files/filename.pdf
   *
   * --------------------------------------------------------
   *
   * But old database records may contain:
   *
   * uploads/reports/filename.pdf
   *
   * C:/project/uploads/reports/filename.pdf
   *
   * E:/Netflix/uploads/reports/filename.pdf
   *
   * /api/reports/files/filename.pdf
   *
   * Therefore ALWAYS extract the filename.
   */


  const normalizedPath =
    filePath
      .replace(
        /\\/g,
        "/"
      )
      .split("?")[0]
      .trim();


  const parts =
    normalizedPath
      .split("/")
      .filter(
        Boolean
      );


  const fileName =
    parts[
      parts.length - 1
    ];


  if (
    !fileName
  ) {

    throw new Error(
      "Invalid report file path."
    );
  }


  /*
   * --------------------------------------------------------
   * SAFETY
   * --------------------------------------------------------
   */

  if (
    fileName === "." ||
    fileName === ".." ||
    fileName.includes(
      "\\"
    ) ||
    fileName.includes(
      "/"
    )
  ) {

    throw new Error(
      "Invalid report file name."
    );
  }


  /*
   * --------------------------------------------------------
   * BACKEND DOWNLOAD URL
   * --------------------------------------------------------
   */

  const url =
    `${API_BASE_URL}/api/reports/files/${encodeURIComponent(
      fileName
    )}`;


  console.log(
    "StreamForge report download:",
    {
      originalPath:
        filePath,

      fileName:
        fileName,

      url:
        url,
    }
  );


  /*
   * --------------------------------------------------------
   * FETCH
   * --------------------------------------------------------
   */

  let response =
    await fetch(
      url,
      {
        method:
          "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,

          Accept:
            "application/pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*",
        },
      }
    );


  /*
   * --------------------------------------------------------
   * 401 → REFRESH → RETRY
   * --------------------------------------------------------
   */

  if (
    response.status ===
    401
  ) {

    const freshToken =
      await refreshAccessToken();


    if (
      freshToken
    ) {

      response =
        await fetch(
          url,
          {
            method:
              "GET",

            headers: {
              Authorization:
                `Bearer ${freshToken}`,

              Accept:
                "application/pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*",
            },
          }
        );
    }
  }


  /*
   * --------------------------------------------------------
   * STILL 401
   * --------------------------------------------------------
   */

  if (
    response.status ===
    401
  ) {

    clearClientAuth();


    if (
      typeof window !==
        "undefined"
    ) {

      window.location.href =
        "/login";
    }


    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }


  /*
   * --------------------------------------------------------
   * 403
   * --------------------------------------------------------
   */

  if (
    response.status ===
    403
  ) {

    throw new Error(
      "You are not authorized to download this report."
    );
  }


  /*
   * --------------------------------------------------------
   * OTHER ERRORS
   * --------------------------------------------------------
   */

  if (
    !response.ok
  ) {

    throw new Error(
      await readErrorMessage(
        response,
        "Failed to download report."
      )
    );
  }


  /*
   * --------------------------------------------------------
   * BLOB
   * --------------------------------------------------------
   */

  const blob =
    await response.blob();


  if (
    blob.size === 0
  ) {

    throw new Error(
      "The generated report file is empty."
    );
  }


  /*
   * --------------------------------------------------------
   * CREATE BLOB URL
   * --------------------------------------------------------
   */

  const blobUrl =
    window.URL.createObjectURL(
      blob
    );


  /*
   * --------------------------------------------------------
   * CREATE DOWNLOAD LINK
   * --------------------------------------------------------
   */

  const link =
    document.createElement(
      "a"
    );


  link.href =
    blobUrl;


  link.download =
    fileName;


  link.style.display =
    "none";


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();


  /*
   * --------------------------------------------------------
   * CLEANUP
   * --------------------------------------------------------
   */

  window.setTimeout(
    () => {

      window.URL.revokeObjectURL(
        blobUrl
      );

    },
    1000
  );
}