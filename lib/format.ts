const vndFormatter = new Intl.NumberFormat("vi-VN");
export function formatVND(amount: number | undefined): string { return amount === undefined ? "Chưa có giá" : vndFormatter.format(amount) + " ₫"; }
