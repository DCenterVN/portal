"use client";

import { Badge } from "@/components/ui/badge";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page";
import { Field as FormField } from "@/components/patterns/form-field";
import { PageHeading } from "@/components/patterns/page-heading";
import { formatVND } from "@/lib/api/sales";
import { usePricingFloor } from "./use-pricing-floor";

export function PricingFloorView() {
	const { productRef, setProductRef, variantRef, setVariantRef, bomRef, setBomRef, bomVersion, setBomVersion, priceBookRef, setPriceBookRef, proposedPrice, setProposedPrice, preview, priceVersionRef, scopeType, setScopeType, multiplierPercent, setMultiplierPercent, policyRef, policyVersionRef, busy, canPreview, canCreatePolicy, canApprovePolicy, canPropose, canApprovePrice, belowFloor, loadPreview, createPolicy, approvePolicy, propose, approve } = usePricingFloor();

	return <PageShell>
		<PageHeading title="Giá sàn & bảng giá" description="Dữ liệu lấy từ BOM, phiếu nhập kho đã QC và policy có version; không có dữ liệu demo." />
		<Card className="mb-6"><CardHeader><CardTitle className="text-base">Đối tượng định giá</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-3">
			<Field label="Product UUID" value={productRef} onChange={setProductRef} />
			<Field label="Variant UUID" value={variantRef} onChange={setVariantRef} />
			<Field label="BOM UUID" value={bomRef} onChange={setBomRef} />
			<Field label="BOM version" type="number" value={String(bomVersion)} onChange={(value) => setBomVersion(Number(value))} />
			<Field label="Price book UUID" value={priceBookRef} onChange={setPriceBookRef} />
			<div className="flex items-end"><Button disabled={busy || !canPreview || !productRef || !variantRef || !bomRef} onClick={loadPreview}>Tính lại giá sàn</Button></div>
		</CardContent></Card>

		<div className="grid gap-6 lg:grid-cols-2">
			<Card><CardHeader><CardTitle className="text-base">Policy do quản lý cấu hình</CardTitle></CardHeader><CardContent className="space-y-3">
				<label className="text-sm">Phạm vi<span className="ml-3 inline-block w-48 align-middle"><NativeSelect value={scopeType} onChange={(event) => setScopeType(event.target.value as typeof scopeType)}><NativeSelectOption value="ORG">Toàn tổ chức</NativeSelectOption><NativeSelectOption value="PRODUCT">Sản phẩm</NativeSelectOption><NativeSelectOption value="VARIANT">Variant</NativeSelectOption></NativeSelect></span></label>
				<Field label="Hệ số giá sàn (%)" type="number" value={String(multiplierPercent)} onChange={(value) => setMultiplierPercent(Number(value))} />
				<div className="flex gap-2"><Button disabled={busy || !canCreatePolicy || multiplierPercent <= 0} onClick={createPolicy}>Tạo policy DRAFT</Button><Button disabled={busy || !canApprovePolicy || !policyRef || !policyVersionRef} variant="outline" onClick={approvePolicy}>Duyệt policy</Button></div>
				<p className="text-xs text-muted-foreground">Người tạo và người duyệt phải khác nhau. Nếu giảm hệ số đang áp dụng, hệ thống giữ trạng thái APPROVED cho tới lần duyệt độc lập thứ hai.</p>
			</CardContent></Card>

			<Card><CardHeader><CardTitle className="text-base">Giá bán variant</CardTitle></CardHeader><CardContent className="space-y-3">
				{preview ? <div className="space-y-2 text-sm"><p>Giá vốn đầu ra: <strong>{formatVND(preview.full_cost_per_output_vnd)}</strong></p><p>Hệ số: <Badge variant="outline">{preview.floor_multiplier_bps / 100}%</Badge></p><p>Giá bán tối thiểu: <strong>{formatVND(preview.minimum_sale_price_vnd)}</strong></p>{preview.component_breakdown.map((item) => <p key={item.input_sku_ref} className="text-xs text-muted-foreground">{item.input_sku_ref}: {item.quantity} {item.uom} × {formatVND(item.unit_cost_vnd)} = {formatVND(item.subtotal_vnd)}</p>)}</div> : <p className="text-sm text-muted-foreground">Chưa tải pricing preview.</p>}
				<Field label="Giá bán đề xuất (VND)" type="number" value={String(proposedPrice)} onChange={(value) => setProposedPrice(Number(value))} />
				{belowFloor && <p className="text-sm text-red-600">Giá đề xuất thấp hơn giá sàn.</p>}
				<div className="flex gap-2"><Button disabled={busy || !canPropose || !preview || belowFloor || !priceBookRef} onClick={propose}>Tạo giá DRAFT</Button><Button disabled={busy || !canApprovePrice || !priceVersionRef} variant="outline" onClick={approve}>Duyệt giá</Button></div>
			</CardContent></Card>
		</div>
	</PageShell>;
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
	const id = useId();
	return <FormField label={label} htmlFor={id}><Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} /></FormField>;
}
