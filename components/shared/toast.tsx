import { CheckCircle2, Info, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

interface AppToastProps {
  title: string;
  description: string;
  variant?: ToastVariant;
}

const variantStyles: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; className: string }
> = {
  success: {
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
  error: {
    icon: OctagonAlert,
    className: "border-rose-200 bg-rose-50 text-rose-950",
  },
  info: {
    icon: Info,
    className: "border-sky-200 bg-sky-50 text-sky-950",
  },
};

export function AppToast({
  title,
  description,
  variant = "info",
}: AppToastProps) {
  const Icon = variantStyles[variant].icon;

  return (
    <div
      className={cn(
        "rounded-3xl border px-4 py-4 shadow-sm",
        variantStyles[variant].className,
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm opacity-80">{description}</p>
        </div>
      </div>
    </div>
  );
}
