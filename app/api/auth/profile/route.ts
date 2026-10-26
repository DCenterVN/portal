import {NextRequest} from "next/server";
import {accountMutation} from "@/lib/api/account-bff";
export function PATCH(request: NextRequest) {return accountMutation(request,"profile");}
