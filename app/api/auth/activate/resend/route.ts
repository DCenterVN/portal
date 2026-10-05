import { NextRequest } from "next/server";
import { customerOperation } from "@/lib/api/auth-journey-bff";
export function POST(request: NextRequest) { return customerOperation(request, "resend"); }
