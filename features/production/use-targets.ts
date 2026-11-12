"use client";

import { toISODate } from "@/lib/format-date";
import { FormEvent, useEffect, useState } from "react";
import { usePagedList } from "@/hooks/use-paged-list";
import { useAccess } from "@/lib/access-boundary";
import { toast } from "@/components/ui/toast";
import { approveTarget, createTarget, deleteTarget, getTargetsPage, updateTarget, type ProductionTarget } from "@/lib/api/production";
import { fold } from "@/components/patterns/entity-picker";
import { getDraftProducts, createDraftProduct, type DraftProduct, type DataResult } from "@/lib/api/sales";

type TargetLine = { product_ref: string; target_quantity: string; uom: string };

const dateInput = (date: Date) => toISODate(date);
const messageOf = (error: unknown) => error instanceof Error ? error.message : "Lỗi không xác định";

export function useTargets(initialTargets?: ProductionTarget[], initialShowCreate = false) {
  const { can, scope } = useAccess();
  const list = usePagedList(cursor => getTargetsPage({ cursor }), `${scope?.orgId}:${scope?.branchId}`, initialTargets);
  const { items: targets, setItems: setTargets, loading: listLoading, error: listError } = list;
  const branchRef = scope?.branchId ?? "";
  const branchName = scope?.branchName ?? "Chi nhánh hiện tại";
  const [showCreate, setShowCreate] = useState(initialShowCreate);
  const [title, setTitle] = useState("");
  const [periodStart, setPeriodStart] = useState(dateInput(new Date()));
  const [periodEnd, setPeriodEnd] = useState(dateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));
  const [lines, setLines] = useState<TargetLine[]>([{ product_ref: "", target_quantity: "4", uom: "EA" }]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<DataResult<DraftProduct[]> | null>(null);

  const reloadProducts = async () => {
    setProducts(null);
    try { setProducts({ data: await getDraftProducts(), source: "api" }); }
    catch (e) { setProducts({ data: [], source: "unavailable", error: messageOf(e) }); }
  };

  useEffect(() => {
    void getDraftProducts().then(data => setProducts({ data, source: "api" })).catch(e => setProducts({ data: [], source: "unavailable", error: messageOf(e) }));
  }, []);

  const [productName, setProductName] = useState("");
  const productSlug = fold(productName).trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const [productError, setProductError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ProductionTarget | null>(null);
  const availableProducts = products?.data;
  const addProduct = async () => {
    setLoading(true); setProductError("");
    try {
      const product = await createDraftProduct({ name: productName.trim(), slug: productSlug.trim() });
      setProducts(current => ({ data: [...(current?.data ?? []), product], source: "api" }));
      setLines(current => current.map((line, index) => index === 0 ? { ...line, product_ref: product.id } : line));
      setProductName("");
    } catch (e) { setProductError(messageOf(e)); }
    finally { setLoading(false); }
  };

  const canCreate = can("production:target:create");
  const canApprove = can("production:target_approval:create");
  const primaryTargetId = !canCreate && !showCreate ? targets.find((target) => (target.status === "DRAFT" && canApprove) || target.status === "APPROVED" || target.status === "IN_PLANNING")?.id : undefined;
  const validLines = lines.every((line) => line.product_ref.trim() && /^\d+$/.test(line.target_quantity) && BigInt(line.target_quantity) > 0n && line.uom.trim());
  const updateLine = (index: number, patch: Partial<TargetLine>) => setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));

  const resetForm = () => {
    setEditingId(null); setShowCreate(false); setTitle("");
    setLines([{ product_ref: "", target_quantity: "4", uom: "EA" }]);
  };
  const startEdit = (target: ProductionTarget) => {
    setEditingId(target.id); setTitle(target.title);
    setPeriodStart(toISODate(new Date(target.period_start))); setPeriodEnd(toISODate(new Date(target.period_end)));
    setLines(target.lines.map(line => ({ ...line, target_quantity: String(line.target_quantity) })));
    setShowCreate(true);
  };
  const periodRange = () => ({ period_start: new Date(`${periodStart}T00:00:00`).toISOString(), period_end: new Date(`${periodEnd}T23:59:59`).toISOString() });

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!canCreate || !branchRef || !validLines) return;
    setLoading(true);
    try {
      if (editingId) {
        const updated = await updateTarget(editingId, { title: title.trim(), ...periodRange(), lines });
        setTargets(current => current.map(target => target.id === editingId ? updated : target));
        toast.success("Đã sửa chỉ tiêu", { description: `Mã ${updated.target_code}` });
      } else {
        const created = await createTarget({ title: title.trim(), branch_ref: branchRef, ...periodRange(), lines });
        if (list.hasPrevious) list.reload(); else setTargets(current => [created, ...current]);
        toast.success("Đã tạo chỉ tiêu APPROVED", { description: `Mã ${created.target_code}` });
      }
      resetForm();
    } catch (error) {
      toast.error(editingId ? "Lỗi sửa chỉ tiêu" : "Lỗi tạo chỉ tiêu", { description: messageOf(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setLoading(true);
    try {
      await deleteTarget(deleting.id);
      toast.success("Đã xoá chỉ tiêu", { description: `Mã ${deleting.target_code}` });
      setDeleting(null); list.reload();
    } catch (error) {
      toast.error("Lỗi xoá chỉ tiêu", { description: messageOf(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, decision: "APPROVE" | "REJECT") => {
    try {
      const updated = await approveTarget(id, decision);
      setTargets((current) => current.map((target) => target.id === id ? updated : target));
      toast.success(decision === "APPROVE" ? "Đã duyệt chỉ tiêu" : "Đã từ chối chỉ tiêu", { description: `${updated.target_code}: ${updated.status}` });
    } catch (error) {
      toast.error("Lỗi duyệt chỉ tiêu", { description: messageOf(error) });
    }
  };

  return { list, targets, editingId, startEdit, resetForm, deleting, setDeleting, handleDelete, listLoading, listError, can, branchName, branchRef, showCreate, setShowCreate, title, setTitle, periodStart, setPeriodStart, periodEnd, setPeriodEnd, lines, setLines, loading, products, productName, setProductName, productSlug, productError, availableProducts, addProduct, reloadProducts, canCreate, canApprove, primaryTargetId, validLines, updateLine, handleCreate, handleApprove };
}
