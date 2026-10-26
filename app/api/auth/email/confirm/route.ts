import {NextRequest} from "next/server";
import {accountMutation} from "@/lib/api/account-bff";
export const POST=(req: NextRequest)=>accountMutation(req,"emailConfirm");
