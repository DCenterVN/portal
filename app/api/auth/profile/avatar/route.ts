import {NextRequest} from "next/server";
import {accountMutation} from "@/lib/api/account-bff";
export const DELETE=(req: NextRequest)=>accountMutation(req,"delete");
