import { cookies } from "next/headers";
import { Home } from "@/features/store/home";
import { Landing } from "@/features/store/landing";

// ponytail: cookie presence like proxy.ts; an expired session still sees Home and the shell sends it to login on the next API call.
export default async function StorePage() {
  const jar = await cookies();
  const signedIn = jar.has("access_token") || jar.has("__Host-refresh_token") || jar.has("refresh_token");
  return signedIn ? <Home /> : <Landing />;
}
