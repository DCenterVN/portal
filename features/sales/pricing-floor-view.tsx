"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, PageShell } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import {
	approvePrice,
	approvePriceFloorPolicyVersion,
	createPriceFloorPolicy,
	createPriceFloorPolicyVersion,
	formatVND,
	getPricingPreview,
	PricingPreview,
	proposePrice,
} from "@/lib/api/sales";

type AuthContext = { active_context?: { branch_id?: string }; permissions?: string[] };

export function PricingFloorView() {
	const { toast } = useToast();
	const [permissions, setPermissions] = useState<string[]>([]);
	const [branchRef, setBranchRef] = useState("");
	const [productRef, setProductRef] = useState("");
	const [variantRef, setVariantRef] = useState("");
	const [bomRef, setBomRef] = useState("");
	const [bomVersion, setBomVersion] = useState(1);
	const [priceBookRef, setPriceBookRef] = useState("");
	const [proposedPrice, setProposedPrice] = useState(0);
	const [preview, setPreview] = useState<PricingPreview | null>(null);
	const [priceVersionRef, setPriceVersionRef] = useState("");
	const [scopeType, setScopeType] = useState<"ORG" | "PRODUCT" | "VARIANT">("PRODUCT");
	const [multiplierPercent, setMultiplierPercent] = useState(125);
	const [policyRef, setPolicyRef] = useState("");
	const [policyVersionRef, setPolicyVersionRef] = useState("");
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		fetch("/api/auth/context")
			.then((response) => response.ok ? response.json() as Promise<AuthContext> : Promise.reject(new Error("Không tải được quyền")))
			.then((value) => { setPermissions(value.permissions ?? []); setBranchRef(value.active_context?.branch_id ?? ""); })
			.catch(() => setPermissions([]));
	}, []);

	const canPreview = permissions.includes("sales:price_floor:read");
	const canCreatePolicy = permissions.includes("sales:price_floor_policy:create");
	const canApprovePolicy = permissions.includes("sales:price_floor_policy_approval:create");
	const canPropose = permissions.includes("sales:price_book:create");
	const canApprovePrice = permissions.includes("sales:price_book_approval:create");
	const belowFloor = preview !== null && proposedPrice < preview.minimum_sale_price_vnd;

	async function run(task: () => Promise<void>) {
		setBusy(true);
		try { await task(); } catch (error) {
			toast({ title: "Không thể thực hiện", description: error instanceof Error ? error.message : "Lỗi không xác định", variant: "error" });
		} finally { setBusy(false); }
	}

	const loadPreview = () => run(async () => {
		const value = await getPricingPreview(productRef, variantRef, { bom_ref: bomRef, bom_version: bomVersion, ...(branchRef ? { branch_ref: branchRef } : {}) });
		setPreview(value);
		setProposedPrice((current) => current || value.minimum_sale_price_vnd);
	});

	const createPolicy = () => run(async () => {
		const scopeRef = scopeType === "ORG" ? undefined : scopeType === "PRODUCT" ? productRef : variantRef;
		const policy = await createPriceFloorPolicy({ scope_type: scopeType, ...(scopeRef ? { scope_ref: scopeRef } : {}) });
		const id = policy.id ?? policy.ID;
		if (!id) throw new Error("Sales API không trả policy id");
		setPolicyRef(id);
		const version = await createPriceFloorPolicyVersion(id, {
			floor_multiplier_bps: Math.round(multiplierPercent * 100),
			cost_basis_method: "MOVING_WEIGHTED_AVERAGE",
			rounding_increment_vnd: 1,
			expected_sellable_yield_rate: 1,
			reason: `Thiết lập hệ số giá sàn ${multiplierPercent}%`,
		});
		const versionId = version.id ?? version.ID;
		if (!versionId) throw new Error("Sales API không trả policy version id");
		setPolicyVersionRef(versionId);
		toast({ title: "Đã tạo bản nháp chính sách", description: "Cần người có quyền duyệt thực hiện bước tiếp theo.", variant: "success" });
	});

	const approvePolicy = () => run(async () => {
		const result = await approvePriceFloorPolicyVersion(policyRef, policyVersionRef);
		toast({ title: result.status === "APPROVED" ? "Cần duyệt lần hai" : "Chính sách đã có hiệu lực", description: result.status === "APPROVED" ? "Hệ số đang giảm nên cần một người duyệt độc lập nữa (VT-22)." : "Có thể tải lại pricing preview.", variant: "success" });
	});

	const propose = () => run(async () => {
		if (!preview || belowFloor) throw new Error("Giá đề xuất phải bằng hoặc cao hơn giá sàn");
		const version = await proposePrice(priceBookRef, {
			output_sku_ref: variantRef, bom_ref: bomRef, bom_version: bomVersion,
			proposed_price_vnd: proposedPrice, effective_from: new Date().toISOString(),
			reason: "Giá bán đề xuất từ pricing console", ...(branchRef ? { branch_ref: branchRef } : {}),
		});
		setPriceVersionRef(version.id);
		toast({ title: "Đã tạo đề xuất giá DRAFT", description: "Giá chưa được dùng để bán cho đến khi người khác duyệt.", variant: "success" });
	});

	const approve = () => run(async () => {
		await approvePrice(priceBookRef, priceVersionRef);
		toast({ title: "Giá đã ACTIVE", description: "Variant được kích hoạt và cart/order dùng mức giá đã duyệt.", variant: "success" });
	});

	return <PageShell>
		<PageHeader title="Giá sàn & bảng giá" description="Dữ liệu lấy từ BOM, phiếu nhập kho đã QC và policy có version; không có dữ liệu demo." />
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
				<label className="text-sm">Phạm vi<select className="ml-3 rounded border p-2" value={scopeType} onChange={(event) => setScopeType(event.target.value as typeof scopeType)}><option value="ORG">Toàn tổ chức</option><option value="PRODUCT">Sản phẩm</option><option value="VARIANT">Variant</option></select></label>
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
	return <label className="block text-sm"><span className="mb-1 block text-muted-foreground">{label}</span><input className="w-full rounded border p-2" type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
