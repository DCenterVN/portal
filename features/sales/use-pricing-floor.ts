"use client";

import { useState } from "react";
import { useCallback } from "react";
import { useAccess } from "@/lib/access-boundary";
import { toast } from "@/components/ui/toast";
import {
	approvePrice,
	approvePriceFloorPolicyVersion,
	createPriceFloorPolicy,
	createPriceFloorPolicyVersion,
	getPricingPreview,
	type PricingPreview,
	proposePrice,
} from "@/lib/api/sales";

export function usePricingFloor() {
	const { can, scope } = useAccess();
	const branchRef = scope?.branchId ?? "";
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
	const [previewError, setPreviewError] = useState("");

	const canPreview = can("sales:price_floor:read");
	const canCreatePolicy = can("sales:price_floor_policy:create");
	const canApprovePolicy = can("sales:price_floor_policy_approval:create");
	const canPropose = can("sales:price_book:create");
	const canApprovePrice = can("sales:price_book_approval:create");
	const belowFloor = preview !== null && proposedPrice < preview.minimum_sale_price_vnd;

	async function run(task: () => Promise<void>) {
		setBusy(true);
		try { await task(); } catch (error) {
			toast.error("Không thể thực hiện", { description: error instanceof Error ? error.message : "Lỗi không xác định" });
		} finally { setBusy(false); }
	}

	const loadPreview = useCallback(async () => {
		setPreviewError("");
		try {
			const value = await getPricingPreview(productRef, variantRef, { bom_ref: bomRef, bom_version: bomVersion, ...(branchRef ? { branch_ref: branchRef } : {}) });
			setPreview(value);
			setProposedPrice((current) => current || value.minimum_sale_price_vnd);
		} catch (error) { setPreviewError(error instanceof Error ? error.message : "Không thể tải giá sàn"); }
	}, [productRef, variantRef, bomRef, bomVersion, branchRef]);

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
		toast.success("Đã tạo bản nháp chính sách", { description: "Cần người có quyền duyệt thực hiện bước tiếp theo." });
	});

	const approvePolicy = () => run(async () => {
		const result = await approvePriceFloorPolicyVersion(policyRef, policyVersionRef);
		toast.success(result.status === "APPROVED" ? "Cần duyệt lần hai" : "Chính sách đã có hiệu lực", { description: result.status === "APPROVED" ? "Hệ số đang giảm nên cần một người duyệt độc lập nữa (VT-22)." : "Có thể tải lại pricing preview." });
	});

	const propose = () => run(async () => {
		if (!preview || belowFloor) throw new Error("Giá đề xuất phải bằng hoặc cao hơn giá sàn");
		const version = await proposePrice(priceBookRef, {
			output_sku_ref: variantRef, bom_ref: bomRef, bom_version: bomVersion,
			proposed_price_vnd: proposedPrice, effective_from: new Date().toISOString(),
			reason: "Giá bán đề xuất từ pricing console", ...(branchRef ? { branch_ref: branchRef } : {}),
		});
		setPriceVersionRef(version.id);
		toast.success("Đã tạo đề xuất giá DRAFT", { description: "Giá chưa được dùng để bán cho đến khi người khác duyệt." });
	});

	const approve = () => run(async () => {
		await approvePrice(priceBookRef, priceVersionRef);
		toast.success("Giá đã ACTIVE", { description: "Variant được kích hoạt và cart/order dùng mức giá đã duyệt." });
	});
	return { productRef, setProductRef, variantRef, setVariantRef, bomRef, setBomRef, bomVersion, setBomVersion, priceBookRef, setPriceBookRef, proposedPrice, setProposedPrice, preview, previewError, priceVersionRef, scopeType, setScopeType, multiplierPercent, setMultiplierPercent, policyRef, policyVersionRef, busy, canPreview, canCreatePolicy, canApprovePolicy, canPropose, canApprovePrice, belowFloor, loadPreview, createPolicy, approvePolicy, propose, approve };
}
