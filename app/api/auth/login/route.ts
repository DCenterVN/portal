import { NextRequest } from "next/server";
import { loginJourney } from "@/lib/api/auth-journey-bff";
export function POST(request: NextRequest) { return loginJourney(request, "customer"); }
