"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page";
import { Skeleton, EmptyState, ErrorState } from "@/components/ui/state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TablePager, TableRow } from "@/components/ui/table";
import { errorText, formatTime } from "./access";
import { RequireAction, useAccess } from "./access-boundary";
import { CompanyOnboardForm } from "./company-onboard-form";
import { pageParam, useCompanies } from "./use-companies";

function CompanyList() {
  const router = useRouter();
  const { can } = useAccess();
  const page = pageParam(useSearchParams().get("page"));
  const { data, error, isLoading, isValidating, mutate } = useCompanies(page);
  const goTo = (next: number) => router.replace(`/platform/companies?page=${next}` as Route);

  return (
    <>
      <PageHeader
        icon={<Building2 />}
        title="Công ty"
        description="Mỗi công ty là một cây chi nhánh, định danh bằng chi nhánh MAIN."
        actions={can("platform:org:onboard") ? <CompanyOnboardForm onCreated={() => void mutate()} /> : undefined}
      />
      {isLoading ? (
        <Skeleton title="Đang tải danh sách công ty…" />
      ) : error || !data ? (
        <ErrorState title={errorText(error)} onRetry={() => void mutate()} />
      ) : data.items.length === 0 ? (
        <EmptyState title={page > 1 ? "Không còn công ty ở trang này." : "Chưa có công ty nào."} description="Onboard công ty đầu tiên theo hợp đồng đã ký." action={page > 1 && <Button variant="outline" size="touch" onClick={() => goTo(page - 1)}>Trang trước</Button>} />
      ) : (
        <div>
          <Table aria-busy={isValidating}>
            <TableHeader>
              <TableRow>
                <TableHead>Công ty</TableHead>
                <TableHead>Mã</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="hidden md:table-cell">Tạo lúc</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((company) => (
                <TableRow key={company.root_branch_id}>
                  <TableCell>
                    <Link
                      href={`/platform/companies/${company.root_branch_id}` as Route}
                      className="inline-flex min-h-11 items-center font-semibold text-[var(--primary)] hover:underline"
                    >
                      {company.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{company.code}</TableCell>
                  <TableCell>
                    <Badge variant={company.status === "ACTIVE" ? "active" : "suspended"}>{company.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-[var(--muted-foreground)] md:table-cell">{formatTime(company.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePager page={page} hasNext={data.items.length === data.limit} onPage={goTo} busy={isValidating} />
        </div>
      )}
    </>
  );
}

export function CompaniesView() {
  return (
    <RequireAction action="platform:org:read">
      <CompanyList />
    </RequireAction>
  );
}
