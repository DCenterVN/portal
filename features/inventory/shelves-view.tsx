"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Store, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/components/ui/toast";
import { PageShell, PageHeader } from "@/components/ui/page";
import { ShelfPlacement, placeOnShelf } from "@/lib/api/production";

interface ShelvesViewProps {
  initialPlacements: ShelfPlacement[];
}

export function ShelvesView({ initialPlacements }: ShelvesViewProps) {
  const { toast } = useToast();
  const [placements, setPlacements] = useState<ShelfPlacement[]>(initialPlacements);
  const [showCreate, setShowCreate] = useState(false);
  const [shelfCode, setShelfCode] = useState("KE-MAT-01");
  const [finishedLotRef, setFinishedLotRef] = useState("");
  const [branchRef, setBranchRef] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [placedQty, setPlacedQty] = useState(20);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/context", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Không thể tải phạm vi làm việc")))
      .then((context: { active_context?: { branch_id?: string }; permissions?: string[] }) => {
        setBranchRef(context.active_context?.branch_id ?? "");
        setPermissions(context.permissions ?? []);
      })
      .catch(() => {
        setBranchRef("");
        setPermissions([]);
      });
  }, []);

  const canPlace = permissions.includes("inventory:shelf_placement:create");

  const handlePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await placeOnShelf({
        finished_lot_ref: finishedLotRef.trim(),
        branch_ref: branchRef,
        shelf_code: shelfCode,
        placed_quantity: placedQty,
        uom: "EA",
      });
      setPlacements([created, ...placements]);
      setShowCreate(false);
      setFinishedLotRef("");
      toast({
        title: "Đã đưa hàng lên kệ tại chi nhánh",
        description: `Mã truy vết QR: ${created.trace_code}`,
        variant: "success",
      });
    } catch (err: unknown) {
      toast({ title: "Lỗi đưa hàng lên kệ", description: err instanceof Error ? err.message : "Không thể đưa hàng lên kệ", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Quản lý Kệ hàng & Tem Truy xuất QR (VT-08 / VT-16)"
        description="Đưa các lô thành phẩm đã APPROVED sau QC lên kệ chi nhánh và quản lý mã QR truy vết"
        actions={
          <Button onClick={() => setShowCreate(true)} disabled={!canPlace || !branchRef}>
            <Plus className="mr-2 h-4 w-4" /> Đưa lô thành phẩm lên kệ
          </Button>
        }
      />

      {showCreate && (
        <Card className="mb-6 border-emerald-200 bg-emerald-50/20">
          <CardContent className="pt-6">
            <form onSubmit={handlePlace} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Mã lô thành phẩm đã QC đạt</label>
                  <input
                    type="text"
                    required
                    placeholder="UUID lô thành phẩm"
                    className="w-full mt-1 p-2 border rounded-md font-mono"
                    value={finishedLotRef}
                    onChange={(e) => setFinishedLotRef(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Vị trí Kệ hàng</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: KE-MAT-01, KE-DONG-02"
                    className="w-full mt-1 p-2 border rounded-md"
                    value={shelfCode}
                    onChange={(e) => setShelfCode(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Số lượng đưa lên kệ (EA)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full mt-1 p-2 border rounded-md"
                    value={placedQty}
                    onChange={(e) => setPlacedQty(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Xác nhận lên kệ & Sinh mã QR
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vị trí Kệ</TableHead>
                <TableHead>Mã truy vết QR</TableHead>
                <TableHead>Số lượng trên kệ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Tra cứu công khai (VT-01)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {placements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Chưa có mặt hàng nào được đưa lên kệ
                  </TableCell>
                </TableRow>
              ) : (
                placements.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold flex items-center gap-1.5">
                      <Store className="h-4 w-4 text-emerald-600" /> {p.shelf_code}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium text-blue-600">
                      {p.trace_code}
                    </TableCell>
                    <TableCell>{p.available_quantity} / {p.placed_quantity} {p.uom}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "PLACED" ? "active" : "outline"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/traceability/${encodeURIComponent(p.trace_code)}`}
                        target="_blank"
                        className="inline-flex items-center text-sm font-medium text-emerald-700 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" /> Xem trang QR xuất xứ
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageShell>
  );
}
