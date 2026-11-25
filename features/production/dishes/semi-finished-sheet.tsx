"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { Plus, Search, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/patterns/action-button";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { Tip } from "@/components/patterns/tip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/patterns/form-field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getMaterialTree, listMaterials, type Material } from "@/lib/api/material-catalog";
import { createSemiFinished, SEMI_SLOTS, semiSlotLabels, type SemiFinishedItem, type SemiSlot } from "@/lib/api/semi-finished";
import { uomLabel, uomOf } from "@/lib/dishes/ingredients";
import { MAX_PREP_NOTE_LENGTH } from "@/lib/dishes/types";
import { cn } from "@/lib/utils";
import { matchesName } from "../materials-catalog";

type RowLine = {
  row: string;
  sku_ref: string;
  name: string;
  quantity: string;
  uom: "KG" | "G" | "L" | "ML" | "EA";
  yield_pct: string;
  prep_note: string;
};

const PREP_CHIPS = ["cắt khúc", "bào sợi", "thái lát", "băm nhỏ", "ngâm nở"] as const;

const placeholderBySlot: Record<SemiSlot, string> = {
  COT: "Ví dụ: Cốt bò hầm xương",
  NUOC_CHAM: "Ví dụ: Túi nước chấm nem chua ngọt",
  DO_CHUA: "Ví dụ: Kim chi cải thảo muối bếp",
};

const weightEstimate = (lines: RowLine[]) =>
  Math.round(lines.reduce((sum, l) => {
    const q = Number(l.quantity);
    if (!Number.isFinite(q) || q <= 0) return sum;
    if (l.uom === "KG" || l.uom === "L") return sum + q * 1000;
    if (l.uom === "G" || l.uom === "ML") return sum + q;
    return sum;
  }, 0));

export function SemiFinishedSheet({
  open,
  defaultSlot = "DO_CHUA",
  materials: providedMaterials,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  defaultSlot?: SemiSlot;
  materials?: Material[];
  onOpenChange: (open: boolean) => void;
  onCreated: (item: SemiFinishedItem) => void | Promise<void>;
}) {
  const activeSwr = useSWR<Material[]>(
    open && !providedMaterials ? "semi-sheet-materials" : null,
    async () => {
      const tree = await getMaterialTree();
      return listMaterials("ACTIVE", tree);
    },
    { revalidateOnFocus: false },
  );
  const materials = providedMaterials ?? activeSwr.data ?? [];

  const [slot, setSlot] = useState<SemiSlot>(defaultSlot);
  const [name, setName] = useState("");
  const [netWeight, setNetWeight] = useState("60");
  const [instruction, setInstruction] = useState("");
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<RowLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submitKeyRef = useRef<string | null>(null);

  useEffect(() => {
    submitKeyRef.current = null;
  }, [slot, name, netWeight, instruction, lines, open]);

  useEffect(() => {
    if (!open) return;
    setSlot(defaultSlot);
    setName("");
    setNetWeight(defaultSlot === "COT" ? "350" : defaultSlot === "NUOC_CHAM" ? "80" : "60");
    setInstruction("");
    setQuery("");
    setLines([]);
    setError("");
  }, [open, defaultSlot]);

  const selectedIds = useMemo(() => new Set(lines.map(l => l.sku_ref)), [lines]);
  const candidates = useMemo(() => {
    const clean = query.trim();
    const list = clean ? materials.filter(m => matchesName(m.name, clean)) : materials;
    return list.slice(0, 12);
  }, [materials, query]);

  const addRaw = (material: Material) => {
    if (selectedIds.has(material.id)) return;
    const uom = (uomOf(material.unit) || "G") as RowLine["uom"];
    setLines(prev => [
      ...prev,
      { row: crypto.randomUUID(), sku_ref: material.id, name: material.name, quantity: uom === "EA" ? "1" : "50", uom, yield_pct: "100", prep_note: "" },
    ]);
    setError("");
  };

  const updateLine = (row: string, patch: Partial<RowLine>) =>
    setLines(prev => prev.map(item => (item.row === row ? { ...item, ...patch } : item)));

  const removeLine = (row: string) =>
    setLines(prev => prev.filter(item => item.row !== row));

  const submit = async () => {
    setError("");
    const parsedWeight = Number(netWeight);
    if (!name.trim()) { setError("Nhập tên bán thành phẩm."); return; }
    if (!Number.isInteger(parsedWeight) || parsedWeight <= 0) { setError("Khối lượng mỗi túi phải là số nguyên lớn hơn 0 g."); return; }
    if (!lines.length) { setError("Chọn ít nhất một nguyên liệu tươi để muối/nấu."); return; }
    for (const line of lines) {
      if (!/^\d+(\.\d{1,3})?$/.test(line.quantity) || Number(line.quantity) <= 0) {
        setError(`Nhập lượng hợp lệ cho ${line.name}.`);
        return;
      }
      const y = Number(line.yield_pct);
      if (!Number.isFinite(y) || y < 1 || y > 100) {
        setError(`Thu hồi của ${line.name} cần từ 1 đến 100%.`);
        return;
      }
    }
    setBusy(true);
    submitKeyRef.current ??= crypto.randomUUID();
    try {
      const created = await createSemiFinished({
        slot,
        name: name.trim(),
        net_weight_g: parsedWeight,
        components: lines.map(line => ({
          sku_ref: line.sku_ref,
          quantity: line.quantity,
          uom: line.uom,
          yield_pct: line.yield_pct,
          ...(line.prep_note.trim() ? { prep_note: line.prep_note.trim() } : {}),
        })),
        ...(instruction.trim() ? { instruction: instruction.trim() } : {}),
      }, submitKeyRef.current);
      submitKeyRef.current = null;
      await onCreated(created);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tạo được bán thành phẩm");
    } finally {
      setBusy(false);
    }
  };

  const estimated = weightEstimate(lines);

  return <Sheet open={open} onOpenChange={next => { if (!busy) onOpenChange(next); }}>
    <SheetContent side="right" className="w-full gap-0 sm:max-w-[560px]">
      <SheetHeader className="border-b px-5 py-4">
        <SheetTitle>Tạo bán thành phẩm</SheetTitle>
        <SheetDescription>Muối chua, pha nước chấm hoặc hầm cốt từ nguyên liệu tươi để dùng lại cho nhiều món.</SheetDescription>
      </SheetHeader>
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <div className="space-y-1.5">
          <span className="text-sm font-medium">Nhóm gói khi đóng hộp</span>
          <div className="grid grid-cols-3 gap-2">
            {SEMI_SLOTS.map(item => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={slot === item ? "default" : "outline"}
                onClick={() => {
                  setSlot(item);
                  if (!lines.length) setNetWeight(item === "COT" ? "350" : item === "NUOC_CHAM" ? "80" : "60");
                }}
              >
                {semiSlotLabels[item]}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
          <Field htmlFor="semi-name" label="Tên bán thành phẩm">
            <Input id="semi-name" placeholder={placeholderBySlot[slot]} maxLength={120} value={name} onChange={e => setName(e.target.value)} />
          </Field>
          <Field htmlFor="semi-weight" label="Khối lượng / túi" hint="Khối lượng thành phẩm trong túi">
            <InputGroup>
              <InputGroupInput id="semi-weight" className="text-right tabular-nums" inputMode="numeric" value={netWeight} onChange={e => setNetWeight(e.target.value)} />
              <InputGroupAddon align="inline-end" className="pr-2.5"><InputGroupText className="text-xs">g</InputGroupText></InputGroupAddon>
            </InputGroup>
          </Field>
        </div>
        {estimated > 0 && estimated !== Number(netWeight) && (
          <p className="text-xs text-muted-foreground">
            Tổng lượng các thành phần đang là <span className="tabular-nums font-medium text-foreground">{estimated} g</span>.{" "}
            <Button type="button" variant="link" size="content" className="inline underline" onClick={() => setNetWeight(String(estimated))}>
              Lấy {estimated} g làm khối lượng túi
            </Button>
          </p>
        )}
        <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Chọn nguyên liệu tươi ({lines.length} đã chọn)</span>
            {activeSwr.isLoading && <span className="text-xs text-muted-foreground">Đang tải danh mục…</span>}
          </div>
          <InputGroup>
            <InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon>
            <InputGroupInput aria-label="Tìm nguyên liệu tươi" placeholder="Gõ tên nguyên liệu, vd: cải thảo, cà rốt, nước mắm…" value={query} onChange={e => setQuery(e.target.value)} />
          </InputGroup>
          <div className="flex flex-wrap gap-1.5">
            {candidates.map(item => {
              const picked = selectedIds.has(item.id);
              return (
                <Button
                  key={item.id}
                  type="button"
                  size="xs"
                  variant={picked ? "secondary" : "outline"}
                  disabled={picked}
                  className={cn(picked && "opacity-70")}
                  onClick={() => addRaw(item)}
                >
                  {!picked && <Plus className="mr-1 size-3" aria-hidden="true" />}
                  {item.name}
                </Button>
              );
            })}
            {!activeSwr.isLoading && candidates.length === 0 && (
              <p className="text-xs text-muted-foreground">Không tìm thấy nguyên liệu phù hợp.</p>
            )}
          </div>
        </div>
        {lines.length > 0 && (
          <div className="overflow-hidden rounded-lg border">
            <div className="border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
              Định mức cho 1 túi bán thành phẩm
            </div>
            <ul className="divide-y">
              {lines.map(line => (
                <li key={line.row} className="space-y-2 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{line.name}</span>
                    <InputGroup className="h-8 w-28 shrink-0">
                      <InputGroupInput aria-label={`Lượng ${line.name}`} className="h-8 text-right text-sm tabular-nums" inputMode="decimal" value={line.quantity} onChange={e => updateLine(line.row, { quantity: e.target.value })} />
                      <InputGroupAddon align="inline-end" className="pr-2"><InputGroupText className="text-xs">{uomLabel(line.uom)}</InputGroupText></InputGroupAddon>
                    </InputGroup>
                    <InputGroup className="h-8 w-24 shrink-0" title="Tỷ lệ thu hồi sau sơ chế (1–100%)">
                      <InputGroupInput aria-label={`Thu hồi ${line.name}`} className="h-8 text-right text-sm tabular-nums" inputMode="decimal" value={line.yield_pct} onChange={e => updateLine(line.row, { yield_pct: e.target.value })} />
                      <InputGroupAddon align="inline-end" className="pr-2"><InputGroupText className="text-xs">%</InputGroupText></InputGroupAddon>
                    </InputGroup>
                    <Tip label="Bỏ nguyên liệu">
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Bỏ ${line.name}`} onClick={() => removeLine(line.row)}>
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </Tip>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Input
                      aria-label={`Sơ chế ${line.name}`}
                      placeholder="Sơ chế (vd: cắt khúc, ướp muối…)"
                      maxLength={MAX_PREP_NOTE_LENGTH}
                      className="h-7 flex-1 text-xs"
                      value={line.prep_note}
                      onChange={e => updateLine(line.row, { prep_note: e.target.value })}
                    />
                    {PREP_CHIPS.map(chip => (
                      <Badge
                        key={chip}
                        variant="outline"
                        className="cursor-pointer px-1.5 py-0 text-[11px] font-normal hover:bg-muted"
                        onClick={() => updateLine(line.row, { prep_note: chip })}
                      >
                        {chip}
                      </Badge>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Field htmlFor="semi-instruction" label="Cách làm ngắn gọn (tuỳ chọn)" hint="In lên lệnh chế biến cho tổ sơ chế / lên men">
          <Input
            id="semi-instruction"
            placeholder="Ví dụ: Cắt cải thảo, xát muối 2 giờ, rửa sạch trộn sốt ủ 24 giờ"
            maxLength={300}
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
          />
        </Field>
        {error && <InlineAlert>{error}</InlineAlert>}
      </div>
      <SheetFooter className="border-t px-5 py-3">
        <div className="flex w-full gap-2">
          <Button type="button" variant="outline" className="flex-1" disabled={busy} onClick={() => onOpenChange(false)}>Huỷ</Button>
          <ActionButton type="button" className="flex-1" pending={busy} pendingLabel="Đang lưu…" onClick={submit}>Lưu bán thành phẩm</ActionButton>
        </div>
      </SheetFooter>
    </SheetContent>
  </Sheet>;
}
