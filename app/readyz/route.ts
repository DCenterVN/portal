import {NextResponse} from "next/server";

export function GET() {
  return NextResponse.json({status: "ready", dependencies: ["mock-bff"]});
}
