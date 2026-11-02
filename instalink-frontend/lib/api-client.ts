import type { ApiErrorBody } from "./dashboard-types";

export const API_UNAUTHORIZED_EVENT = "instalink:unauthorized";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly requestId: string | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function csrfToken() {
  if (typeof document === "undefined") return undefined;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("instalink_csrf="));
  return cookie?.slice("instalink_csrf=".length);
}

function readErrorBody(value: unknown): ApiErrorBody {
  if (typeof value !== "object" || value === null) return {};
  const record = value as Record<string, unknown>;
  return {
    ...(typeof record.code === "string" ? { code: record.code } : {}),
    ...(typeof record.requestId === "string"
      ? { requestId: record.requestId }
      : {}),
    ...(typeof record.message === "string" || Array.isArray(record.message)
      ? { message: record.message as string | string[] }
      : {}),
  };
}

type ApiRequestOptions = {
  csrf?: boolean;
  redirectOnUnauthorized?: boolean;
};

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: ApiRequestOptions = {},
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const needsCsrf =
    options.csrf !== false &&
    !["GET", "HEAD", "OPTIONS"].includes(method);
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (needsCsrf) {
    const token = csrfToken();
    if (!token) {
      throw new ApiError(
        "Token keamanan tidak tersedia. Muat ulang halaman dan coba lagi.",
        403,
        "CSRF_INVALID",
        null,
      );
    }
    headers.set("x-csrf-token", token);
  }

  const response = await fetch(path, {
    ...init,
    method,
    headers,
    credentials: "include",
    cache: "no-store",
  });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    if (response.ok) {
      throw new ApiError(
        "Respons server tidak valid.",
        response.status,
        "INVALID_RESPONSE",
        response.headers.get("x-request-id"),
      );
    }
    payload = null;
  }

  if (!response.ok) {
    const error = readErrorBody(payload);
    const message = Array.isArray(error.message)
      ? error.message.join(", ")
      : error.message ?? "Permintaan tidak dapat diproses.";
    if (
      response.status === 401 &&
      options.redirectOnUnauthorized !== false &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(new Event(API_UNAUTHORIZED_EVENT));
    }
    throw new ApiError(
      message,
      response.status,
      error.code ?? "REQUEST_FAILED",
      error.requestId ?? response.headers.get("x-request-id"),
    );
  }

  return payload as T;
}
