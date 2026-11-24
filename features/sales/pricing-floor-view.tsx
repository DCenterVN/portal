"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useId } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityPicker } from "@/components/patterns/entity-picker";
import { PageShell } from "@/components/ui/page";
import { Field as FormField } from "@/components/patterns/form-field";
import { PageHeading } from "@/components/patterns/page-heading";
import { formatVND } from "@/lib/format";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { breakdownLine } from "./cost-breakdown";
import { PendingPricesCard } from "./pending-prices-card";
import { usePricingFloor } from "./use-pricing-floor";
import { SalesFlowBar } from "./sales-flow-bar";

export function PricingFloorView() {
	const { variants, variantRef, pickVariant, bom, pending, canSeePending, proposedPrice, setProposedPrice, preview, previewError, scopeType, setScopeType, multiplierPercent, setMultiplierPercent, policyRef, policyVersionRef, busy, canPreview, canCreatePolicy, canApprovePolicy, canPropose, canApprovePrice, belowFloor, loadPreview, createPolicy, approvePolicy, propose, approve } = usePricingFloor();
	const hasBom = Boolean(bom.data?.bom_ref);

	return <PageShell>
		<PageHeading title="Giá sàn & bảng giá" description="Giá sàn được tính từ công thức món, giá nguyên liệu đã nhập kho và chính sách giá đã duyệt." actions={<Link className={buttonVariants({ size: "sm", variant: "outline" })} href="/sales/products">Sang mở bán sản phẩm</Link>} />
		<SalesFlowBar current="pricing" />
		<Card className="mb-6"><CardHeader><CardTitle className="text-base">Suất bán cần định giá</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-3">
			<EntityPicker name="price-variant" label="Suất bán" items={variants.data} status={variants.error ? "error" : variants.data ? "ready" : "loading"} getId={(item) => item.id} getLabel={(item) => item.label} getMeta={(item) => item.meta} value={variantRef || null} onChange={pickVariant} onRetry={() => void variants.mutate()} placeholder="Chọn món và suất" className="md:col-span-2" />
			<div className="flex items-end"><Button disabled={busy || !canPreview || !hasBom} onClick={loadPreview}>Tính lại giá sàn</Button></div>
			{variantRef && bom.data !== undefined && !hasBom && <p className="text-sm text-destructive md:col-span-3">Suất này chưa có định mức công thức nên chưa tính được giá sàn.</p>}
		</CardContent></Card>

		{canSeePending && <PendingPricesCard pending={pending} busy={busy} canApprove={canApprovePrice} approve={(row) => void approve(row)} />}

		<div className={canCreatePolicy || canApprovePolicy ? "grid gap-6 lg:grid-cols-2" : "grid gap-6"}>
			{(canCreatePolicy || canApprovePolicy) && <Card><CardHeader><CardTitle className="text-base">Chính sách do quản lý cấu hình</CardTitle></CardHeader><CardContent className="space-y-3">
				<label className="text-sm">Phạm vi<span className="ml-3 inline-block w-48 align-middle"><NativeSelect value={scopeType} onChange={(event) => setScopeType(event.target.value as typeof scopeType)}><NativeSelectOption value="ORG">Toàn tổ chức</NativeSelectOption><NativeSelectOption value="PRODUCT">Sản phẩm</NativeSelectOption><NativeSelectOption value="VARIANT">Suất bán</NativeSelectOption></NativeSelect></span></label>
				<Field label="Hệ số giá sàn (%)" type="number" value={String(multiplierPercent)} onChange={(value) => setMultiplierPercent(Number(value))} />
				<div className="flex gap-2"><Button disabled={busy || !canCreatePolicy || multiplierPercent <= 0} onClick={createPolicy}>Tạo chính sách nháp</Button><Button disabled={busy || !canApprovePolicy || !policyRef || !policyVersionRef} variant="outline" onClick={approvePolicy}>Duyệt chính sách</Button></div>
				<p className="text-xs text-muted-foreground">Người tạo và người duyệt phải khác nhau. Nếu giảm hệ số đang áp dụng, hệ thống giữ trạng thái Đã duyệt cho tới lần duyệt độc lập thứ hai.</p>
			</CardContent></Card>}

			<Card><CardHeader><CardTitle className="text-base">Giá bán của suất</CardTitle></CardHeader><CardContent className="space-y-3">
				{busy && !preview ? <LoadingState title="Đang tính giá sàn…" /> : previewError ? <ErrorState title="Không thể tải giá sàn" description={previewError} onRetry={() => void loadPreview()} /> : preview ? <div className="space-y-2 text-sm"><div className="grid gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-3"><p>Giá vốn đầu ra: <strong className="tabular-nums">{formatVND(preview.full_cost_per_output_vnd)}</strong></p><p>Hệ số: <Badge variant="outline">{preview.floor_multiplier_bps / 100}%</Badge></p><p>Giá bán tối thiểu: <strong className="tabular-nums">{formatVND(preview.minimum_sale_price_vnd)}</strong></p></div>{preview.component_breakdown.length === 0 ? <EmptyState title="Chưa có thành phần giá vốn" /> : preview.component_breakdown.map((item, index) => <p key={item.input_sku_ref} className="text-xs text-muted-foreground">{breakdownLine(item, index)}</p>)}</div> : <EmptyState title="Chưa tải giá sàn" description="Chọn suất bán rồi tính lại giá sàn." />}
				<Field label="Giá bán đề xuất (VND)" type="number" value={String(proposedPrice)} onChange={(value) => setProposedPrice(Number(value))} />
				{belowFloor && <p className="text-sm text-destructive">Giá đề xuất thấp hơn giá sàn.</p>}
				<div className="flex gap-2"><Button disabled={busy || !canPropose || !preview || belowFloor || !variantRef || !hasBom} onClick={propose}>Đề xuất giá</Button></div>
			</CardContent></Card>
		</div>
	</PageShell>;
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
	const id = useId();
	return <FormField label={label} htmlFor={id}><Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} /></FormField>;
}
