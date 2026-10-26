import {NextRequest} from "next/server";
import {accountMutation} from "@/lib/api/account-bff";
export function POST(request: NextRequest) {return accountMutation(request,"password");}
