const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {

  const token = localStorage.getItem("streamforge_token");

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  if (response.status === 401) {

    localStorage.removeItem("streamforge_token");
    localStorage.removeItem("streamforge_user");

    window.location.href = "/login";

    throw new Error("Session expired");
  }

  if (response.status === 403) {
    throw new Error("Access denied");
  }

  if (!response.ok) {

    let message = "Something went wrong";

    try {
      const error = await response.json();

      message =
        error.message ||
        error.error ||
        message;

    } catch {
      // Ignore invalid error response
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}