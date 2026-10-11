"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, CheckCircle, DollarSign, Plus, Send, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, PageShell } from "@/components/ui/page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { createFoodPlan, FoodProductPlan, publishFoodPlan, resumeFoodPlanHandoff, reviewFoodPlan } from "@/lib/api/production";

type AuthContext = { permissions?: string[] };
type ComponentLine = { sku_ref: string; quantity: number; uom: string };
const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Lỗi không xác định";

export function FoodPlansView({ initialPlans, targetId }: { initialPlans: FoodProductPlan[]; targetId?: string }) {
  const { toast } = useToast();
  const [plans, setPlans] = useState(initialPlans);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [productRef, setProductRef] = useState("");
  const [variantCode, setVariantCode] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [uom, setUOM] = useState("EA");
  const [components, setComponents] = useState<ComponentLine[]>([{ sku_ref: "", quantity: 1, uom: "EA" }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/context")
      .then((response) => response.ok ? response.json() as Promise<AuthContext> : Promise.reject(new Error("Không tải được quyền")))
      .then((context) => setPermissions(context.permissions ?? []))
      .catch(() => setPermissions([]));
  }, []);

  const canCreate = permissions.includes("production:food_plan:create");
  const canReview = permissions.includes("production:food_plan:update");
  const canPublish = permissions.includes("production:food_plan:update");
  const validComponents = components.every((component) => component.sku_ref.trim() && component.quantity > 0 && component.uom.trim());
  const updateComponent = (index: number, patch: Partial<ComponentLine>) => setComponents((current) => current.map((component, componentIndex) => componentIndex === index ? { ...component, ...patch } : component));

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!targetId || !validComponents) return;
    setLoading(true);
    try {
      const created = await createFoodPlan(targetId, {
        product_ref: productRef.trim(), variant_sku_code: variantCode.trim(), planned_quantity: quantity,
        uom: uom.trim().toUpperCase(), serving_size: servingSize.trim(),
        components: components.map((component) => ({ ...component, sku_ref: component.sku_ref.trim(), uom: component.uom.trim().toUpperCase() })),
      });
      setPlans((current) => [created, ...current]);
      setShowCreate(false);
      setProductRef("");
      setVariantCode("");
      setServingSize("");
      setComponents([{ sku_ref: "", quantity: 1, uom: "EA" }]);
      toast({ title: "Đã tạo kế hoạch DRAFT", description: `Mã ${created.plan_code}`, variant: "success" });
    } catch (error) {
      toast({ title: "Lỗi tạo kế hoạch", description: errorMessage(error), variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const mutatePlan = async (planId: string, action: "review" | "publish" | "resume") => {
    try {
      if (action === "review") {
        const updated = await reviewFoodPlan(planId);
        setPlans((current) => current.map((plan) => plan.id === planId ? updated : plan));
      } else if (action === "publish") {
        const result = await publishFoodPlan(planId);
        setPlans((current) => current.map((plan) => plan.id === planId ? result.food_plan : plan));
      } else {
        const result = await resumeFoodPlanHandoff(planId);
        setPlans((current) => current.map((plan) => plan.id === planId ? result.food_plan : plan));
      }
      toast({ title: "Đã cập nhật kế hoạch", description: action === "publish" ? "BOM và cost snapshot đã được tạo; chờ giá ACTIVE." : "Trạng thái lấy trực tiếp từ backend.", variant: "success" });
    } catch (error) {
      toast({ title: "Không thể cập nhật kế hoạch", description: errorMessage(error), variant: "error" });
    }
  };

  if (!targetId) return <PageShell><PageHeader title="Kế hoạch dinh dưỡng & BOM" description="Cần chọn một chỉ tiêu đã duyệt trước khi lập variant." /><Card><CardContent className="space-y-3 py-8 text-center"><p>URL chưa có `target_id` hợp lệ.</p><Button asChild><Link href="/production/targets">Quay lại danh sách chỉ tiêu</Link></Button></CardContent></Card></PageShell>;

  return <PageShell>
    <PageHeader title="Kế hoạch dinh dưỡng & BOM" description={`Target: ${targetId}. Variant và định mức nguyên liệu được nhập từ dữ liệu thật, không dùng mẫu demo.`}
      actions={canCreate ? <Button onClick={() => setShowCreate((value) => !value)}><Plus className="mr-2 h-4 w-4" />Lập variant/BOM</Button> : undefined} />

    {showCreate && <Card className="mb-6"><CardContent className="pt-6"><form onSubmit={handleCreate} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Product UUID thuộc target" value={productRef} onChange={setProductRef} required />
        <Field label="Mã variant SKU" value={variantCode} onChange={setVariantCode} required />
        <Field label="Khẩu phần" value={servingSize} onChange={setServingSize} required />
        <Field label="Số lượng kế hoạch" value={String(quantity)} onChange={(value) => setQuantity(Number(value))} type="number" required />
        <Field label="Đơn vị đầu ra" value={uom} onChange={setUOM} required />
      </div>
      <div className="space-y-2"><div className="flex items-center justify-between"><p className="text-sm font-medium">Nguyên liệu BOM cho một đơn vị đầu ra</p><Button type="button" size="sm" variant="outline" onClick={() => setComponents((current) => [...current, { sku_ref: "", quantity: 1, uom: "EA" }])}>Thêm nguyên liệu</Button></div>
        {components.map((component, index) => <div className="grid gap-2 md:grid-cols-[1fr_160px_120px_40px]" key={index}>
          <Field label="Material SKU UUID" value={component.sku_ref} onChange={(value) => updateComponent(index, { sku_ref: value })} required />
          <Field label="Định lượng" value={String(component.quantity)} onChange={(value) => updateComponent(index, { quantity: Number(value) })} type="number" required />
          <Field label="Đơn vị" value={component.uom} onChange={(value) => updateComponent(index, { uom: value })} required />
          <Button aria-label="Xóa nguyên liệu" className="mt-6" type="button" size="icon" variant="ghost" disabled={components.length === 1} onClick={() => setComponents((current) => current.filter((_, componentIndex) => componentIndex !== index))}><Trash2 className="h-4 w-4" /></Button>
        </div>)}
      </div>
      <div className="flex gap-2"><Button type="submit" disabled={loading || !productRef.trim() || !variantCode.trim() || !servingSize.trim() || quantity <= 0 || !validComponents}>Lưu DRAFT</Button><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button></div>
    </form></CardContent></Card>}

    <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Mã kế hoạch</TableHead><TableHead>Variant</TableHead><TableHead>Số lượng</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Handoff</TableHead></TableRow></TableHeader><TableBody>
      {plans.length === 0 ? <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">Chưa có kế hoạch trong phiên này.</TableCell></TableRow> : plans.map((plan) => <TableRow key={plan.id}>
        <TableCell className="font-mono">{plan.plan_code}</TableCell><TableCell>{plan.variant_sku_code}</TableCell><TableCell>{plan.planned_quantity} {plan.uom}</TableCell><TableCell><Badge variant="outline">{plan.status}</Badge></TableCell>
        <TableCell className="text-right">{plan.status === "DRAFT" && canReview && <Button size="sm" variant="outline" onClick={() => mutatePlan(plan.id, "review")}><CheckCircle className="mr-1 h-4 w-4" />Thẩm định</Button>}{plan.status === "REVIEWED" && canPublish && <Button size="sm" onClick={() => mutatePlan(plan.id, "publish")}><Send className="mr-1 h-4 w-4" />Publish BOM</Button>}{plan.status === "WAITING_PRICE_APPROVAL" && canPublish && <span className="inline-flex items-center gap-2"><Badge variant="outline"><DollarSign className="mr-1 h-3 w-3" />Chờ giá ACTIVE</Badge><Button size="sm" onClick={() => mutatePlan(plan.id, "resume")}><ArrowRight className="mr-1 h-4 w-4" />Kiểm tra & handoff</Button></span>}</TableCell>
      </TableRow>)}
    </TableBody></Table></CardContent></Card>
  </PageShell>;
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="block text-sm"><span className="mb-1 block text-muted-foreground">{label}</span><input className="w-full rounded border p-2" type={type} value={value} required={required} min={type === "number" ? 0.000001 : undefined} step={type === "number" ? "any" : undefined} onChange={(event) => onChange(event.target.value)} /></label>;
}
