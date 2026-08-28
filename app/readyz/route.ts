import {NextResponse} from "next/server";
import {getServiceBaseUrl} from "@/lib/api/operations";

const DEPENDENCY_SERVICES = ["auth", "org", "integration"] as const;

export async function GET() {
  const checkService = async (
    service: "auth" | "org" | "integration"
  ): Promise<{service: string; ok: boolean; status: number}> => {
    const baseUrl = getServiceBaseUrl(service);
    try {
      const res = await fetch(`${baseUrl}/healthz`, {
        method: "GET",
        headers: {
          "User-Agent": "portal-bff/readyz"
        },
        signal: AbortSignal.timeout(3000)
      });
      return {service, ok: res.ok, status: res.status};
    } catch {
      return {service, ok: false, status: 0};
    }
  };

  const results = await Promise.all(
    DEPENDENCY_SERVICES.map((s) => checkService(s))
  );

  const dependencies: Record<string, string> = {};
  let allHealthy = true;

  for (const r of results) {
    if (r.ok) {
      dependencies[r.service] = "ready";
    } else {
      dependencies[r.service] = "unreachable";
      allHealthy = false;
    }
  }

  if (!allHealthy) {
    return NextResponse.json(
      {
        status: "degraded",
        dependencies
      },
      {status: 503}
    );
  }

  return NextResponse.json({
    status: "ready",
    dependencies
  });
}

