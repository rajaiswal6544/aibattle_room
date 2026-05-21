import { Wifi, WifiOff } from "lucide-react";
import type { ConnectionStatus as Status } from "@/lib/types";

export function ConnectionStatus({ status }: { status: Status }) {
  const online = status === "connected";
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${online ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-amber-300/40 bg-amber-300/10 text-amber-100"}`}>
      {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
      {online ? "Live" : "Reconnecting"}
    </div>
  );
}

