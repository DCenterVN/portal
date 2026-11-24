"use client";

import { useEffect, useState } from "react";
import { useAccess } from "@/lib/access-boundary";
import { getSupplierHistory, type SupplierHistory } from "@/lib/api/supplier-history";
import { loadContractMaterials } from "./use-contract-materials";
import { SupplierReceiptsView } from "./supplier-receipts-view";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";

type SupplierReceiptsOptions = { supplierId: string };
export function SupplierReceiptsContainer({ supplierId }: SupplierReceiptsOptions) {
  const { can, root } = useAccess();
  const read = can("inventory:supplier:read");
  const [page, setPage] = useState<SupplierHistory>();
  const [names, setNames] = useState<Record<string, string>>({});
  const [nameError, setNameError] = useState(false);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cursors, setCursors] = useState([""]);
  const [revision, setRevision] = useState(0);
  const cursor = cursors[cursors.length - 1];
  useEffect(() => {
    if (!read) return;
    let live = true;
    setNames({}); setNameError(false);
    loadContractMaterials().then(items => { if (live) setNames(Object.fromEntries(items.map(item => [item.id, item.name]))); }).catch(() => { if (live) setNameError(true); });
    return () => { live = false; };
  }, [read, root, supplierId, revision]);
  useEffect(() => {
    if (!read) return;
    let live = true;
    setPage(undefined); setError("");
    getSupplierHistory(supplierId, { cursor, from, to }).then(value => { if (live) setPage(value); }).catch(() => { if (live) setError("Không tải được lịch sử nhập. Kiểm tra chi nhánh và quyền rồi thử lại."); });
    return () => { live = false; };
  }, [supplierId, read, root, cursor, from, to, revision]);
  return <SupplierReceiptsView read={read} page={page} names={names} nameError={nameError} from={from} to={to}
    pending={<LoadingState title="Đang tải lịch sử nhập" />}
    failure={error ? <ErrorState title={error} onRetry={() => setRevision(value => value + 1)} /> : undefined}
    empty={<EmptyState title="Chưa nhập lần nào từ nhà cung cấp này" description="Phiếu nhập từ nhà cung cấp này sẽ hiện ở đây." />}
    onFrom={value => { setFrom(value); setCursors([""]); }} onTo={value => { setTo(value); setCursors([""]); }}
    pageNumber={cursors.length} hasPrevious={cursors.length > 1} onPrevious={() => setCursors(values => values.slice(0, -1))}
    onNext={() => { if (page?.next_cursor) setCursors(values => [...values, page.next_cursor]); }} onRetry={() => setRevision(value => value + 1)} />;
}
