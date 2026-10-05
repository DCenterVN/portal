import { mutationFetcher } from "@/lib/fetcher";

export function login(identifier: string, password: string) {
  return mutationFetcher<{next_path: string}>("/api/auth/login", {arg: {identifier, password}});
}
export function register(email: string, phone: string, displayName: string, password: string) {
  return mutationFetcher("/api/auth/register", {arg: {...(email ? {email} : {}), ...(phone ? {phone} : {}), ...(displayName ? {display_name: displayName} : {}), password}});
}
export function activateAccount(token: string) {
  return mutationFetcher("/api/auth/activate", {arg: {token}});
}
export function resendActivation(email: string) {
  return mutationFetcher("/api/auth/activate/resend", {arg: {email}});
}
export function forgotPassword(email: string) {
  return mutationFetcher("/api/auth/forgot", {arg: {email}});
}
export function resetPassword(token: string, newPassword: string) {
  return mutationFetcher("/api/auth/reset", {arg: {token, new_password: newPassword}});
}
