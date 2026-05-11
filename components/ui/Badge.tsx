// components/ui/Badge.tsx
import { TICKET_STATUS } from "@/constants/statuses";

interface BadgeProps {
  status: string;
  needsAttention?: boolean | null;
}

export default function Badge({ status, needsAttention }: BadgeProps) {
  let bgColor = "bg-blue-100 text-blue-600";
  
  if (status === TICKET_STATUS.AI_OPERATED) bgColor = "bg-purple-100 text-purple-600";
  if (status === TICKET_STATUS.CLOSED) bgColor = "bg-green-100 text-green-600";
  if (status === TICKET_STATUS.ESCALATED) bgColor = "bg-orange-100 text-orange-600";

  return (
    <div className="flex items-center gap-2">
      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${bgColor}`}>
        {status}
      </span>
      
      {needsAttention && status !== TICKET_STATUS.CLOSED && (
        <span className="bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 animate-pulse shadow-sm shadow-red-200">
          🚨 Wymaga uwagi
        </span>
      )}
    </div>
  );
}