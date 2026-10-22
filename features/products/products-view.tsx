"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  Check,
  AlertCircle,
  ArrowUpRight,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Product, DataSource, formatVND } from "@/lib/api/sales";
import { PageShell, PageHeader } from "@/components/ui/page";
import { ProductCreateDialog } from "./product-create-dialog";

interface ProductsViewProps {
  initialProducts: Product[];
  dataSource?: DataSource;
  canCreate?: boolean;
}

export function ProductsView({ initialProducts, dataSource = "api", canCreate = false }: ProductsViewProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DRAFT">("ALL");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { filteredProducts, activeCount, draftCount } = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    let active = 0;
    let draft = 0;
    const filtered: Product[] = [];

    for (const p of products) {
      if (p.status === "ACTIVE") active++;
      else if (p.status === "DRAFT") draft++;

      const matchesSearch =
        p.name.toLowerCase().includes(lowerSearch.trim());
      const matchesStatus =
        statusFilter === "ALL" ? true : p.status === statusFilter;

      if (matchesSearch && matchesStatus) {
        filtered.push(p);
      }
    }

    return { filteredProducts: filtered, activeCount: active, draftCount: draft };
  }, [products, search, statusFilter]);

  const handleProductCreated = useCallback((newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
  }, []);

  return (
    <PageShell>
      {dataSource === "unavailable" && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3 text-xs font-semibold text-[var(--color-ink)]" role="alert">
          <TriangleAlert className="size-4 shrink-0" />
          <span>Không thể tải dữ liệu từ Sales API. Danh sách được để trống để tránh hiển thị dữ liệu giả.</span>
        </div>
      )}
      <PageHeader
        icon={<Package />}
        title="Sản phẩm"
        badge={
          <Badge variant="secondary" dot={false} className="text-xs font-bold px-2.5 py-0.5 rounded-full">
            {products.length} sản phẩm
          </Badge>
        }
        description="Theo dõi sản phẩm và tạo bản nháp cho danh mục"
        actions={
          <div className="flex max-w-full flex-wrap items-center gap-2.5">
            {canCreate && <Button
              type="button"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="size-4 mr-1.5" />
              Tạo sản phẩm mới
            </Button>}
          </div>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <Card className="rounded-2xl border-[var(--color-line)] bg-[var(--color-surface)] p-4.5">
          <CardContent className="p-0">
            <div className="text-xs font-semibold text-[var(--color-muted)]">Tổng sản phẩm</div>
            <div className="text-2xl font-extrabold text-[var(--color-ink)] mt-1">{products.length}</div>
            <div className="text-[11px] text-[var(--color-muted)] mt-0.5">Mặt hàng trong hệ thống</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[var(--color-line)] bg-[var(--color-surface)] p-4.5">
          <CardContent className="p-0">
            <div className="text-xs font-semibold text-[var(--color-ink)] flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-[var(--color-leaf)]" />
              Đang mở bán (ACTIVE)
            </div>
            <div className="text-2xl font-extrabold text-[var(--color-ink)] mt-1">{activeCount}</div>
            <div className="text-[11px] text-[var(--color-muted)] mt-0.5">Sản phẩm có trạng thái mở bán</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[var(--color-line)] bg-[var(--color-surface)] p-4.5">
          <CardContent className="p-0">
            <div className="text-xs font-semibold text-[var(--color-ink)] flex items-center gap-1.5">
              <AlertCircle className="size-3.5 text-[var(--color-warn-ink)]" />
              Bản nháp (DRAFT)
            </div>
            <div className="text-2xl font-extrabold text-[var(--color-ink)] mt-1">{draftCount}</div>
            <div className="text-[11px] text-[var(--color-muted)] mt-0.5">Sản phẩm đang được chuẩn bị</div>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 text-[var(--color-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên sản phẩm..."
            className="pl-9 text-xs rounded-xl"
          />
        </div>

        <div className="flex max-w-full flex-wrap items-center gap-1.5 self-start sm:self-auto">
          <Button
            type="button"
            size="sm"
            variant={statusFilter === "ALL" ? "secondary" : "outline"}
            aria-pressed={statusFilter === "ALL"}
            onClick={() => setStatusFilter("ALL")}
          >
            {statusFilter === "ALL" && <Check aria-hidden="true" />}
            Tất cả ({products.length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={statusFilter === "ACTIVE" ? "secondary" : "outline"}
            aria-pressed={statusFilter === "ACTIVE"}
            onClick={() => setStatusFilter("ACTIVE")}
          >
            {statusFilter === "ACTIVE" && <Check aria-hidden="true" />}
            Đang mở bán ({activeCount})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={statusFilter === "DRAFT" ? "secondary" : "outline"}
            aria-pressed={statusFilter === "DRAFT"}
            onClick={() => setStatusFilter("DRAFT")}
          >
            {statusFilter === "DRAFT" && <Check aria-hidden="true" />}
            Bản nháp ({draftCount})
          </Button>
        </div>
      </div>
      <Card className="rounded-2xl border-[var(--color-line)] bg-[var(--color-surface)] overflow-hidden shadow-[var(--elevation-shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[var(--color-line)] bg-[var(--color-tint)] hover:bg-[var(--color-tint)]">
              <TableHead className="w-[140px] text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Mã SKU
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Tên Sản Phẩm
              </TableHead>
              <TableHead className="w-[100px] text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                ĐVT
              </TableHead>
              <TableHead className="w-[140px] text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] text-right">
                Giá Niêm Yết
              </TableHead>
              <TableHead className="w-[130px] text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Trạng Thái
              </TableHead>
              <TableHead className="w-[120px] text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] text-right">
                Thao Tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <TableRow key={p.id} className="border-b border-[var(--color-line)] hover:bg-[var(--color-tint)] transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-[var(--color-ink)]">
                    {p.sku_code}
                  </TableCell>
                  <TableCell>
                    {p.status === "ACTIVE" ? <Link
                      href={`/products/${p.id}` as Route}
                      className="font-bold text-xs text-[var(--color-ink)] hover:text-[var(--color-primary-hover)] dark:hover:text-[var(--color-primary)] transition-colors flex items-center gap-1.5 group"
                    >
                      <span>{p.name}</span>
                      <ArrowUpRight className="size-3 text-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link> : <span className="text-xs font-bold">{p.name}</span>}
                    {p.description && (
                      <p className="text-[11px] text-[var(--color-muted)] truncate max-w-md mt-0.5">
                        {p.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-[var(--color-muted)]">
                    {p.uom}
                  </TableCell>
                  <TableCell className="text-right font-serif font-bold text-xs text-[var(--color-ink)]">
                    {formatVND(p.base_price_vnd)}
                  </TableCell>
                  <TableCell>
                    {p.status === "ACTIVE" ? (
                      <Badge variant="active" dot className="text-[10px] font-bold">
                        Đang mở bán
                      </Badge>
                    ) : p.status === "DRAFT" ? (
                      <Badge variant="secondary" dot className="text-[10px] font-bold text-[var(--color-ink)] bg-[var(--color-surface)] border-[var(--color-line)]">
                        Bản nháp
                      </Badge>
                    ) : (
                      <Badge variant="revoked" dot className="text-[10px] font-bold">
                        Tạm ngưng
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.status === "ACTIVE" ? (
                      <Link href={`/products/${p.id}` as Route} className="text-xs font-semibold">Xem catalog</Link>
                    ) : <details className="text-left text-xs"><summary className="min-h-11 cursor-pointer py-3">Chi tiết</summary>
                      <p className="py-2">{p.sku_code ? `${p.sku_code} · ${p.uom}` : "Chưa có biến thể"}</p>
                    </details>}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-xs text-[var(--color-muted)]">
                  Không tìm thấy sản phẩm nào phù hợp với điều kiện tìm kiếm.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {canCreate && <ProductCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleProductCreated}
      />}
    </PageShell>
  );
}
