import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TransferLine } from "@/lib/api/stock-transfers";
import { formatDate } from "@/lib/format-date";
import { VARIANCE_LABEL, formatQuantity, lotInfo, shortfall, toMilli, type LotInfo } from "@/lib/stock-transfer";

export function LotCell({ info }: { info?: LotInfo }) {
  return <>{info?.code ?? "—"}{info?.expires && <span className="block text-xs text-muted-foreground">Hạn dùng {formatDate(info.expires)}</span>}</>;
}

type Props = { lines: TransferLine[]; name: (sku: string, position?: number) => string };

export function TransferLinesTable({ lines, name }: Props) {
  const done = lines.some(line => line.received_qty != null);
  return (
    <Table aria-label="Dòng hàng của phiếu" className="min-w-max">
      <TableHeader><TableRow>
        <TableHead>Nguyên liệu</TableHead><TableHead>Lô</TableHead><TableHead>Đơn vị</TableHead><TableHead className="text-right">Số gửi</TableHead>
        {done && <><TableHead className="text-right">Số nhận</TableHead><TableHead className="text-right">Hao hụt</TableHead><TableHead>Lý do lệch</TableHead></>}
      </TableRow></TableHeader>
      <TableBody>{lines.map((line, index) => {
        const info = lotInfo(line);
        const lost = line.received_qty != null && (toMilli(line.sent_qty) ?? 0) > (toMilli(line.received_qty) ?? 0);
        return (
          <TableRow key={line.id}>
            <TableCell className="font-medium">{name(line.sku_ref, index + 1)}</TableCell>
            <TableCell><LotCell info={info} /></TableCell>
            <TableCell>{line.uom.toLowerCase()}</TableCell>
            <TableCell className="text-right tabular-nums">{formatQuantity(line.sent_qty)}</TableCell>
            {done && <>
              <TableCell className="text-right tabular-nums">{line.received_qty != null ? formatQuantity(line.received_qty) : "—"}</TableCell>
              <TableCell className="text-right tabular-nums">{line.received_qty != null ? formatQuantity(shortfall(line.sent_qty, line.received_qty)) : "—"}</TableCell>
              <TableCell>{lost && line.variance_reason ? VARIANCE_LABEL[line.variance_reason] : "—"}</TableCell>
            </>}
          </TableRow>
        );
      })}</TableBody>
    </Table>
  );
}
