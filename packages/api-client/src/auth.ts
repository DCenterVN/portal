import { apiFetch } from "./client";
import type {
  RegisterRequest,
  LoginRequest,
  LoginResponse,
  ActivateRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  EmailChangeRequest,
  EmailChangeConfirmRequest,
} from "./types";

export function register(data: RegisterRequest) {
  return apiFetch<void>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function nativeLogin(data: LoginRequest) {
  return apiFetch<LoginResponse>("/auth/native/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function nativeLogout(accessToken: string) {
  return apiFetch<void>("/auth/native/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function nativeRefresh(refreshToken: string) {
  return apiFetch<LoginResponse>("/auth/native/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export function activate(data: ActivateRequest) {
  return apiFetch<void>("/auth/activate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function forgotPassword(data: ForgotPasswordRequest) {
  return apiFetch<void>("/auth/password/forgot", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function resetPassword(data: ResetPasswordRequest) {
  return apiFetch<void>("/auth/password/reset", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function requestEmailChange(
  data: EmailChangeRequest,
  accessToken: string,
) {
  return apiFetch<void>("/auth/account/email", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function confirmEmailChange(
  data: EmailChangeConfirmRequest,
  accessToken: string,
) {
  return apiFetch<void>("/auth/account/email/confirm", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getProfile(accessToken: string) {
  return apiFetch<Record<string, unknown>>("/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
