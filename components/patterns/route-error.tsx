"use client";

import { ErrorState } from "@/components/patterns/empty-state";

export function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      title="Không thể tải trang này"
      description={error.digest ? `Đã xảy ra lỗi. Mã tham chiếu: ${error.digest}` : "Đã xảy ra lỗi. Vui lòng thử lại."}
      onRetry={reset}
    />
  );
}

export default RouteError;
