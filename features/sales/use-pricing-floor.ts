"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
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
import { usePagedList } from "@/hooks/use-paged-list";
import { approveFailureMessage, getVariantBom, listPendingPrices, loadPriceableVariants, type PendingPriceRow } from "./price-approval";

export function usePricingFloor() {
	const { can, scope } = useAccess();
	const branchRef = scope?.branchId ?? "";
	const [variantRef, setVariantRef] = useState("");
	const [proposedPrice, setProposedPrice] = useState(0);
	const [preview, setPreview] = useState<PricingPreview | null>(null);
	const [scopeType, setScopeType] = useState<"ORG" | "PRODUCT" | "VARIANT">("PRODUCT");
	const [multiplierPercent, setMultiplierPercent] = useState(125);
	const [policyRef, setPolicyRef] = useState("");
	const [policyVersionRef, setPolicyVersionRef] = useState("");
	const [busy, setBusy] = useState(false);
	const [previewError, setPreviewError] = useState("");

	const variants = useSWR(["price-variants", scope?.orgId, scope?.branchId], loadPriceableVariants);
	const picked = variants.data?.find((variant) => variant.id === variantRef);
	const productRef = picked?.productId ?? "";
	const bom = useSWR(picked ? ["variant-bom", picked.productId, picked.id] : null, () => getVariantBom(picked!.productId, picked!.id));
	const outputRef = bom.data?.id ?? "";
	const priceBookRef = outputRef;
	const bomRef = bom.data?.bom_ref ?? "";
	const bomVersion = bom.data?.bom_version ?? 1;
	const canSeePending = can("sales:price_floor_policy:read");
	const pending = usePagedList(cursor => canSeePending ? listPendingPrices(cursor) : Promise.resolve({ items: [] as PendingPriceRow[] }), `${scope?.orgId}:${scope?.branchId}:${canSeePending}`);

	const canPreview = can("sales:price_floor:read");
	const canCreatePolicy = can("sales:price_floor_policy:create");
	const canApprovePolicy = can("sales:price_floor_policy_approval:create");
	const canPropose = can("sales:price_book:create");
	const canApprovePrice = can("sales:price_book_approval:create");
	const belowFloor = preview !== null && proposedPrice < preview.minimum_sale_price_vnd;

	function pickVariant(id: string | null) {
		setVariantRef(id ?? "");
		setPreview(null);
		setProposedPrice(0);
	}

	async function run(task: () => Promise<void>) {
		setBusy(true);
		try { await task(); } catch (error) {
			toast.error("Không thể thực hiện", { description: error instanceof Error ? error.message : "Lỗi không xác định" });
		} finally { setBusy(false); }
	}

	const loadPreview = useCallback(async () => {
		setPreviewError("");
		try {
			const value = await getPricingPreview(productRef, outputRef, { bom_ref: bomRef, bom_version: bomVersion, ...(branchRef ? { branch_ref: branchRef } : {}) });
			setPreview(value);
			setProposedPrice((current) => current || value.minimum_sale_price_vnd);
		} catch (error) { setPreviewError(error instanceof Error ? error.message : "Không thể tải giá sàn"); }
	}, [productRef, outputRef, bomRef, bomVersion, branchRef]);

	const createPolicy = () => run(async () => {
		const scopeRef = scopeType === "ORG" ? undefined : scopeType === "PRODUCT" ? productRef : outputRef;
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
		await proposePrice(priceBookRef, {
			output_sku_ref: outputRef, bom_ref: bomRef, bom_version: bomVersion,
			proposed_price_vnd: proposedPrice, effective_from: new Date().toISOString(),
			reason: "Giá bán đề xuất từ pricing console", ...(branchRef ? { branch_ref: branchRef } : {}),
		});
		pending.reload();
		toast.success("Đã đề xuất giá", { description: "Giá chưa được dùng để bán cho đến khi người khác duyệt." });
	});

	const approve = async (row: PendingPriceRow) => {
		setBusy(true);
		try {
			await approvePrice(row.price_book_id, row.id);
			pending.reload();
			toast.success("Giá đã được duyệt", { description: "Suất bán dùng mức giá đã duyệt cho giỏ hàng và đơn hàng." });
		} catch (error) { toast.error("Không duyệt được giá", { description: approveFailureMessage(error) }); } finally { setBusy(false); }
	};
	return { variants, variantRef, pickVariant, bom, picked, pending, canSeePending, proposedPrice, setProposedPrice, preview, previewError, scopeType, setScopeType, multiplierPercent, setMultiplierPercent, policyRef, policyVersionRef, busy, canPreview, canCreatePolicy, canApprovePolicy, canPropose, canApprovePrice, belowFloor, loadPreview, createPolicy, approvePolicy, propose, approve };
}
