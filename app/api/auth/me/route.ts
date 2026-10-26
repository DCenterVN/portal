import {NextRequest} from "next/server";
import {accountProfile} from "@/lib/api/account-bff";
export function GET(req: NextRequest) {return accountProfile(req);}
