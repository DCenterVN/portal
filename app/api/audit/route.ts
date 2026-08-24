import {NextResponse} from "next/server";
import {listAudit} from "@/lib/audit/store";
import {requireOperator} from "@/lib/auth/operator";

export async function GET() {
  await requireOperator();
  return NextResponse.json({items: listAudit()});
}
