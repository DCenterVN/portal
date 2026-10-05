import {NextRequest, NextResponse} from "next/server";
// BLOCKED (auth, D3): no trusted staff recovery delivery/token provenance contract.
export function POST(request: NextRequest) {
 void request; // Deliberately do not inspect identity or consume a token while D3 is blocked.
 return NextResponse.json({error: "INTERNAL_ERROR", message: "Khôi phục mật khẩu nhân viên hiện chưa khả dụng. Liên hệ quản trị công ty."}, {status: 503, headers: {"Cache-Control": "no-store"}});
}
