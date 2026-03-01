import { LoaderCircle } from "lucide-react";

export function LoadingLabel({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LoaderCircle className="h-4 w-4 animate-spin" />
      {label}
    </span>
  );
}
