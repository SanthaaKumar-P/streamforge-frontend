import { apiRequest } from "./client";

export interface Role {
  roleId?: number;
  roleName?: string;
  description?: string;
}

export interface User {
  userId: number;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  employeeCode?: string;
  bio?: string;
  role?: Role | string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserRequest {
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  employeeCode?: string;
  bio?: string;
  roleId?: number;
}

/**
 * Get currently selected user
 */
export async function getUserById(
  userId: number
): Promise<User> {
  return apiRequest<User>(
    `/api/users/${userId}`,
    {
      method: "GET",
    }
  );
}

/**
 * Get all users
 * ADMIN only
 */
export async function getAllUsers(): Promise<User[]> {
  return apiRequest<User[]>(
    "/api/users",
    {
      method: "GET",
    }
  );
}

/**
 * Update user
 */
export async function updateUser(
  userId: number,
  data: UpdateUserRequest
): Promise<User> {
  return apiRequest<User>(
    `/api/users/${userId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Delete user
 * ADMIN only
 */
export async function deleteUser(
  userId: number
): Promise<string> {
  return apiRequest<string>(
    `/api/users/${userId}`,
    {
      method: "DELETE",
    }
  );
}