import {NextRequest, NextResponse} from "next/server";
import {getOperation, operationRequestSchema} from "@/lib/api/operations";
import {appendAudit} from "@/lib/audit/store";
import {requireOperator} from "@/lib/auth/operator";
import {newRequestId} from "@/lib/id";

export async function POST(
  request: NextRequest,
  {params}: {params: Promise<{operationId: string}>}
) {
  const startedAt = performance.now();
  const {operationId} = await params;
  const requestId = newRequestId();
  const operator = await requireOperator();
  const body = operationRequestSchema.safeParse(await request.json().catch(() => ({})));
  const input = body.success ? body.data : {environment: "dev" as const, reason: ""};
  const operation = getOperation(operationId);

  if (!operation) {
    return NextResponse.json(
      {
        ok: false,
        operationId,
        status: 404,
        requestId,
        durationMs: Math.round(performance.now() - startedAt),
        data: {message: "Operation is not registered"}
      },
      {status: 404}
    );
  }

  const denied =
    (input.environment === "production" && !operation.allowedInProduction) ||
    (operation.requiresReason && input.reason.trim().length < 8);

  if (denied) {
    const durationMs = Math.round(performance.now() - startedAt);
    appendAudit({
      actor: operator.login,
      operationId,
      environment: input.environment,
      outcome: "DENY",
      status: 403,
      durationMs,
      reason: input.reason
    });
    return NextResponse.json(
      {
        ok: false,
        operationId,
        status: 403,
        requestId,
        durationMs,
        data: {message: "Operation denied by portal guard policy"}
      },
      {status: 403}
    );
  }

  const data = operation.execute();
  const durationMs = Math.round(performance.now() - startedAt);
  appendAudit({
    actor: operator.login,
    operationId,
    environment: input.environment,
    outcome: "ALLOW",
    status: 200,
    durationMs,
    reason: input.reason
  });

  return NextResponse.json({
    ok: true,
    operationId,
    status: 200,
    requestId,
    durationMs,
    data: {
      target: {
        service: operation.service,
        audience: operation.audience,
        method: operation.method,
        pathTemplate: operation.pathTemplate
      },
      response: data
    }
  });
}
