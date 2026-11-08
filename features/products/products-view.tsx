"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  Plus,
  Search,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Product, DataSource } from "@/lib/api/sales";
import { safeMessage } from "@/lib/api/dishes";
import { formatVND } from "@/lib/format";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { EmptyState } from "@/components/patterns/empty-state";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { ProductCreateDialog } from "./product-create-dialog";
import { ProductActivateDialog } from "./product-activate-dialog";
import motion from "./filter-motion.module.css";

interface ProductsViewProps {
  initialProducts: Product[];
  dataSource?: DataSource;
  canCreate?: boolean;
  canActivate?: boolean;
  onActivated?: () => Promise<void>;
  onProductCreated?: (product: Product) => void;
}

export function ProductsView({ initialProducts: products, dataSource = "api", canCreate = false, canActivate = false, onActivated, onProductCreated }: ProductsViewProps) {
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

  return (
    <PageShell>
      {dataSource === "unavailable" && (
        <InlineAlert tone="warning" className="mb-4">Không thể tải dữ liệu từ Sales API. Danh sách được để trống để tránh hiển thị dữ liệu giả.</InlineAlert>
      )}
      <PageHeading
        title="Sản phẩm"
        badge={
          <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {products.length} sản phẩm
          </Badge>
        }
        description="Theo dõi sản phẩm, tạo bản nháp và mở bán cho danh mục"
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
        <Card className="border-border bg-card p-4">
          <CardContent className="p-0">
            <div className="text-xs font-semibold text-muted-foreground">Tổng sản phẩm</div>
            <div className="text-2xl font-semibold text-foreground mt-1">{products.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Mặt hàng trong hệ thống</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card p-4">
          <CardContent className="p-0">
            <div className="text-xs font-semibold text-muted-foreground">
              Đang mở bán
            </div>
            <div className="text-2xl font-semibold text-foreground mt-1">{activeCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Sản phẩm có trạng thái mở bán</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card p-4">
          <CardContent className="p-0">
            <div className="text-xs font-semibold text-muted-foreground">
              Bản nháp
            </div>
            <div className="text-2xl font-semibold text-foreground mt-1">{draftCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Sản phẩm đang được chuẩn bị</div>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <InputGroup className="w-full sm:w-80">
          <InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon>
          <InputGroupInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên sản phẩm..." aria-label="Tìm sản phẩm" />
        </InputGroup>

        <div className="flex max-w-full flex-wrap items-center gap-1.5 self-start sm:self-auto">
          <Button
            type="button"
            size="sm"
            variant={statusFilter === "ALL" ? "secondary" : "outline"}
            aria-pressed={statusFilter === "ALL"}
            className={motion.filter}
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
            className={motion.filter}
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
            className={motion.filter}
            onClick={() => setStatusFilter("DRAFT")}
          >
            {statusFilter === "DRAFT" && <Check aria-hidden="true" />}
            Bản nháp ({draftCount})
          </Button>
        </div>
      </div>
      {products.length === 0 ? <EmptyState title="Chưa có sản phẩm" description="Sản phẩm được tạo sẽ hiển thị ở đây." /> : <Card className="border-border bg-card overflow-hidden ">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted hover:bg-muted">
              <TableHead className="w-32 text-xs font-semibold text-muted-foreground">
                Mã SKU
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">
                Tên Sản Phẩm
              </TableHead>
              <TableHead className="w-24 text-xs font-semibold text-muted-foreground">
                ĐVT
              </TableHead>
              <TableHead className="w-32 text-xs font-semibold text-muted-foreground text-right">
                Giá Niêm Yết
              </TableHead>
              <TableHead className="w-28 text-xs font-semibold text-muted-foreground">
                Trạng Thái
              </TableHead>
              <TableHead className="w-28 text-xs font-semibold text-muted-foreground text-right">
                Thao Tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <TableRow key={p.id} className="border-b border-border hover:bg-muted transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-foreground">
                    {safeMessage(p.sku_code)}
                  </TableCell>
                  <TableCell>
                    {p.status === "ACTIVE" ? <Link
                      href={`/products/${p.id}` as Route}
                      className="font-semibold text-xs text-foreground hover:underline transition-colors"
                    >
                      {safeMessage(p.name)}
                    </Link> : <span className="text-xs font-semibold">{safeMessage(p.name)}</span>}
                    {p.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-md mt-0.5">
                        {safeMessage(p.description)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-muted-foreground">
                    {safeMessage(p.uom)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-xs text-foreground">
                    {formatVND(p.base_price_vnd)}
                  </TableCell>
                  <TableCell>
                    {p.status === "ACTIVE" ? (
                      <StatusBadge tone="success" className="text-xs font-semibold">
                        Đang mở bán
                      </StatusBadge>
                    ) : p.status === "DRAFT" ? (
                      <Badge variant="outline">
                        Bản nháp
                      </Badge>
                    ) : (
                      <StatusBadge tone="danger" className="text-xs font-semibold">
                        Tạm ngưng
                      </StatusBadge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {onActivated && <ProductActivateDialog product={p} allowed={canActivate} onActivated={onActivated} />}
                    {p.status === "ACTIVE" ? (
                      <Link href={`/products/${p.id}` as Route} className="text-xs font-semibold">Xem catalog</Link>
                    ) : <details className="text-left text-xs"><summary className="min-h-11 cursor-pointer py-3">Chi tiết</summary>
                      <p className="py-2">{p.sku_code ? safeMessage(`${p.sku_code} · ${p.uom}`) : "Chưa có biến thể"}</p>
                    </details>}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                  Không tìm thấy sản phẩm nào phù hợp với điều kiện tìm kiếm.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>}

      {canCreate && <ProductCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={onProductCreated}
      />}
    </PageShell>
  );
}
