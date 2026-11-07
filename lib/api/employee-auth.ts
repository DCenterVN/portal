import {mutationFetcher} from "@/lib/fetcher";
export function login(identifier: string, password: string, redirect?: string) {
 return mutationFetcher<{next_path: string}>("/api/auth/staff/login", {arg: {identifier, password, ...(redirect ? {redirect} : {})}});
}
export function acceptInvite(token: string, password: string) {
 return mutationFetcher<{status: string}>("/api/auth/staff/invite/accept", {arg: {token, password}});
}
