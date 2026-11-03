import { apiRequest } from "./api-client";
import type {
  AdminRoleCode,
  AdminUser,
  AdminUserListFilters,
  AdminUserListResponse,
  ChangeRegistrationStatusInput,
  CreateAdminUserInput,
  CurrentUserResponse,
  RegistrationDetail,
  RegistrationListFilters,
  RegistrationListResponse,
  RegistrationSummary,
  RegistrationSummaryFilters,
  TemporaryPasswordUser,
  AdminUserStatus,
} from "./dashboard-types";

function queryString(
  values: Record<string, string | number | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function getCurrentUser() {
  return apiRequest<CurrentUserResponse>("/api/v1/me");
}

export function login(email: string, password: string) {
  return apiRequest<CurrentUserResponse>(
    "/api/v1/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    { csrf: false, redirectOnUnauthorized: false },
  );
}

export function logout() {
  return apiRequest<{ status: string }>("/api/v1/auth/logout", {
    method: "POST",
  });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiRequest<{ status: string }>("/api/v1/auth/password/change", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  }, { redirectOnUnauthorized: false });
}

export function getAdminUsers(filters: AdminUserListFilters = {}) {
  return apiRequest<AdminUserListResponse>(
    `/api/v1/users${queryString(filters)}`,
  );
}

export function createAdminUser(input: CreateAdminUserInput) {
  return apiRequest<TemporaryPasswordUser>("/api/v1/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function changeAdminUserRole(id: string, roleCode: AdminRoleCode) {
  return apiRequest<AdminUser>(
    `/api/v1/users/${encodeURIComponent(id)}/role`,
    {
      method: "PATCH",
      body: JSON.stringify({ roleCode }),
    },
  );
}

export function changeAdminUserStatus(id: string, status: AdminUserStatus) {
  return apiRequest<AdminUser>(
    `/api/v1/users/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}

export function resetAdminUserPassword(id: string) {
  return apiRequest<TemporaryPasswordUser>(
    `/api/v1/users/${encodeURIComponent(id)}/reset-password`,
    { method: "POST" },
  );
}

export function getRegistrationSummary(
  filters: RegistrationSummaryFilters = {},
) {
  return apiRequest<RegistrationSummary>(
    `/api/v1/dashboard/registrations/summary${queryString(filters)}`,
  );
}

export function getRegistrations(filters: RegistrationListFilters = {}) {
  return apiRequest<RegistrationListResponse>(
    `/api/v1/registrations${queryString(filters)}`,
  );
}

export function getRegistration(id: string) {
  return apiRequest<RegistrationDetail>(
    `/api/v1/registrations/${encodeURIComponent(id)}`,
  );
}

export function changeRegistrationStatus(
  id: string,
  input: ChangeRegistrationStatusInput,
) {
  return apiRequest<{ id: string; status: string; updatedAt: string }>(
    `/api/v1/registrations/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function addRegistrationFollowUp(id: string, note: string) {
  return apiRequest<{
    id: string;
    registrationId: string;
    note: string;
    createdAt: string;
  }>(`/api/v1/registrations/${encodeURIComponent(id)}/follow-ups`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}
