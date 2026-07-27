import type { ReactNode } from "react";
import { PackageOpen, AlertTriangle, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Squiggle } from "@/components/ui/Squiggle";

interface StateMessageProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

function StateMessage({ icon, title, description, actionLabel, onAction }: StateMessageProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
      <div className="mb-1 text-ink-soft">{icon}</div>
      <h3 className="text-xl font-semibold text-ink">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-ink-soft">{description}</p>
      )}
      <Squiggle className="my-2" />
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="mt-1">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/** Used when a collection genuinely has nothing in it (empty cart, wishlist, etc). */
export function EmptyState(props: Omit<StateMessageProps, "icon">) {
  return <StateMessage icon={<PackageOpen size={40} strokeWidth={1.5} />} {...props} />;
}

/** Used when a request/render fails - always pairs with a retry action. */
export function ErrorState(props: Omit<StateMessageProps, "icon">) {
  return <StateMessage icon={<AlertTriangle size={40} strokeWidth={1.5} />} {...props} />;
}

/** Used when the browser reports it's offline. */
export function OfflineState(props: Omit<StateMessageProps, "icon">) {
  return <StateMessage icon={<WifiOff size={40} strokeWidth={1.5} />} {...props} />;
}
