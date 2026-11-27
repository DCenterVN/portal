import { ErrorState } from "@/components/patterns/empty-state";
import { NAMES_FAILED } from "./name-lookup";

export function NamesLoadError({ retry }: { retry: () => void }) {
  return <ErrorState title={NAMES_FAILED} onRetry={retry} className="mb-4" />;
}
