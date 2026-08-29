const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080";


// ============================================================
// NORMAL API REQUEST
// ============================================================

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {

  const token =
    localStorage.getItem(
      "streamforge_token"
    );

  const headers =
    new Headers(options.headers);


  // ----------------------------------------------------------
  // CONTENT TYPE
  // ----------------------------------------------------------

  /*
   * Do not force application/json for FormData.
   *
   * For requests with a normal JSON body, automatically
   * use application/json.
   */
  if (
    options.body &&
    !headers.has("Content-Type") &&
    !(options.body instanceof FormData)
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }


  // ----------------------------------------------------------
  // JWT AUTHORIZATION
  // ----------------------------------------------------------

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }


  // ----------------------------------------------------------
  // SEND REQUEST
  // ----------------------------------------------------------

  const response =
    await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,
        headers,
      }
    );


  // ==========================================================
  // 401 - UNAUTHORIZED
  // ==========================================================

  if (response.status === 401) {

    localStorage.removeItem(
      "streamforge_token"
    );

    localStorage.removeItem(
      "streamforge_user"
    );

    window.location.href =
      "/login";

    throw new Error(
      "Session expired"
    );
  }


  // ==========================================================
  // 403 - FORBIDDEN
  // ==========================================================

  if (response.status === 403) {

    throw new Error(
      "Access denied. You do not have permission to perform this action."
    );
  }


  // ==========================================================
  // OTHER ERROR RESPONSES
  // ==========================================================

  if (!response.ok) {

    let message =
      "Something went wrong";


    const contentType =
      response.headers.get(
        "content-type"
      ) || "";


    try {

      /*
       * Backend returned JSON error.
       *
       * Example:
       *
       * {
       *   "message": "Evaluation not found"
       * }
       */
      if (
        contentType.includes(
          "application/json"
        )
      ) {

        const error =
          await response.json();

        message =
          error?.message ||
          error?.error ||
          message;

      } else {

        /*
         * Backend returned plain text error.
         */
        const text =
          await response.text();

        if (text.trim()) {
          message =
            text.trim();
        }
      }

    } catch {
      // Keep default message
    }


    throw new Error(message);
  }


  // ==========================================================
  // 204 - NO CONTENT
  // ==========================================================

  if (
    response.status === 204
  ) {

    return undefined as T;
  }


  // ==========================================================
  // SUCCESS RESPONSE
  // ==========================================================

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";


  /*
   * ----------------------------------------------------------
   * JSON RESPONSE
   * ----------------------------------------------------------
   *
   * Used for:
   *
   * GET
   * POST
   * PUT
   *
   * Example:
   *
   * EvaluationResponse
   * ProductionResponse
   * ReportResponse
   */

  if (
    contentType.includes(
      "application/json"
    )
  ) {

    return response.json();
  }


  /*
   * ----------------------------------------------------------
   * PLAIN TEXT RESPONSE
   * ----------------------------------------------------------
   *
   * This fixes DELETE endpoints such as:
   *
   * DELETE /api/evaluations/{id}
   *
   * Backend:
   *
   * ResponseEntity.ok(
   *     "Evaluation deleted successfully"
   * )
   *
   * Previously apiRequest() called response.json()
   * and caused:
   *
   * Unexpected token 'E', "Evaluation"... is not valid JSON
   */

  const text =
    await response.text();

  return text as T;
}


// ============================================================
// DOWNLOAD FILE WITH JWT
// ============================================================

export async function downloadFile(
  filePath: string
): Promise<void> {

  const token =
    localStorage.getItem(
      "streamforge_token"
    );


  // ----------------------------------------------------------
  // CHECK LOGIN
  // ----------------------------------------------------------

  if (!token) {

    window.location.href =
      "/login";

    throw new Error(
      "You are not logged in"
    );
  }


  // ----------------------------------------------------------
  // BUILD FILE URL
  // ----------------------------------------------------------

  /*
   * Backend may return:
   *
   * /reports/file.xlsx
   *
   * OR:
   *
   * reports/file.xlsx
   *
   * OR:
   *
   * http://localhost:8080/reports/file.xlsx
   *
   * OR:
   *
   * https://example.com/reports/file.xlsx
   */

  const url =
    filePath.startsWith(
      "http://"
    ) ||
    filePath.startsWith(
      "https://"
    )
      ? filePath
      : `${API_BASE_URL}${
          filePath.startsWith("/")
            ? ""
            : "/"
        }${filePath}`;


  // ----------------------------------------------------------
  // REQUEST FILE WITH JWT
  // ----------------------------------------------------------

  const response =
    await fetch(
      url,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


  // ==========================================================
  // 401 - UNAUTHORIZED
  // ==========================================================

  if (
    response.status === 401
  ) {

    localStorage.removeItem(
      "streamforge_token"
    );

    localStorage.removeItem(
      "streamforge_user"
    );

    window.location.href =
      "/login";

    throw new Error(
      "Session expired"
    );
  }


  // ==========================================================
  // 403 - FORBIDDEN
  // ==========================================================

  if (
    response.status === 403
  ) {

    throw new Error(
      "You are not authorized to download this report."
    );
  }


  // ==========================================================
  // OTHER DOWNLOAD ERRORS
  // ==========================================================

  if (!response.ok) {

    let message =
      "Failed to download report";


    const contentType =
      response.headers.get(
        "content-type"
      ) || "";


    try {

      /*
       * JSON error
       */
      if (
        contentType.includes(
          "application/json"
        )
      ) {

        const error =
          await response.json();

        message =
          error?.message ||
          error?.error ||
          message;

      } else {

        /*
         * Plain text error
         */
        const text =
          await response.text();

        if (text.trim()) {
          message =
            text.trim();
        }
      }

    } catch {
      // Keep default message
    }


    throw new Error(message);
  }


  // ==========================================================
  // CONVERT RESPONSE TO BLOB
  // ==========================================================

  const blob =
    await response.blob();


  // ==========================================================
  // CREATE TEMPORARY BLOB URL
  // ==========================================================

  const blobUrl =
    window.URL.createObjectURL(
      blob
    );


  // ==========================================================
  // EXTRACT FILE NAME
  // ==========================================================

  const cleanPath =
    filePath.split("?")[0];

  const fileName =
    cleanPath
      .split("/")
      .pop() ||
    "report";


  // ==========================================================
  // TRIGGER DOWNLOAD
  // ==========================================================

  const link =
    document.createElement("a");

  link.href =
    blobUrl;

  link.download =
    fileName;

  document.body.appendChild(
    link
  );

  link.click();

  link.remove();


  // ==========================================================
  // CLEANUP
  // ==========================================================

  window.URL.revokeObjectURL(
    blobUrl
  );
}