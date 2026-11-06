"use client";

import { companyMemberships, createMembership, employeeRoles, replaceMembershipRoles, updateMembershipStatus, type Membership } from "@/lib/api/platform-client";

export function useMembershipApi() {
  return {
    employeeRoles,
    list: (page: number) => companyMemberships(page),
    create: (input: Parameters<typeof createMembership>[0]) => createMembership(input),
    replaceRoles: (id: string, roles: string[]) => replaceMembershipRoles(id, roles),
    updateStatus: (id: string, status: Membership["status"]) => updateMembershipStatus(id, status),
  };
}
