"use client";
import useSWR from "swr";
import {ACCOUNT_PROFILE_KEY,getAccountProfile} from "@/lib/api/account-client";
import {logoutTo} from "@/lib/auth/client";
export function useStaffProfile() {
 const profile=useSWR(ACCOUNT_PROFILE_KEY,getAccountProfile,{revalidateOnFocus:false});
 return {...profile,logout:()=>logoutTo("/staff/login")};
}
