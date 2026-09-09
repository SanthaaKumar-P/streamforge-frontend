import { apiRequest } from "@/api/client";

export type ShowStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "UNDER_REVIEW"
  | "IN_PRODUCTION"
  | "SUBMITTED";

export interface ShowCreator {
  userId: number;
  fullName: string;
  username: string;
  email: string;
  phone?: string | null;
  isActive?: boolean;
  role?: {
    roleId?: number;
    roleName?: string;
  } | null;
}

export interface GenreResponse {
  genreId: number;
  genreName: string;
  description?: string;
}

export interface ShowResponse {
  showId: number;
  title: string;
  description?: string;
  synopsis?: string;
  language?: string;
  targetAudience?: string;
  episodeCount?: number;
  estimatedBudget?: number;
  expectedReleaseDate?: string;
  status?: string;
  creator?: unknown;
  genres?: GenreResponse[];
}

export interface ShowRequest {
  title: string;
  description?: string;
  synopsis?: string;
  language?: string;
  targetAudience: string;
  episodeCount: number;
  genreIds: number[];
  estimatedBudget?: number;
  expectedReleaseDate?: string;
  status?: string;
  creatorId: number;
}
export async function getAllShows(): Promise<ShowResponse[]> {
  return apiRequest<ShowResponse[]>("/api/shows");
}

export async function getShowById(
  showId: number
): Promise<ShowResponse> {
  return apiRequest<ShowResponse>(
    `/api/shows/${showId}`
  );
}

export async function createShow(
  request: ShowRequest
): Promise<ShowResponse> {
  return apiRequest<ShowResponse>(
    "/api/shows",
    {
      method: "POST",
      body: JSON.stringify(request),
    }
  );
}

export async function updateShow(
  showId: number,
  request: ShowRequest
): Promise<ShowResponse> {
  return apiRequest<ShowResponse>(
    `/api/shows/${showId}`,
    {
      method: "PUT",
      body: JSON.stringify(request),
    }
  );
}

export async function deleteShow(
  showId: number
): Promise<void> {
  await apiRequest<void>(
    `/api/shows/${showId}`,
    {
      method: "DELETE",
    }
  );
}