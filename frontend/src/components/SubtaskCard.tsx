import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Subtask } from "@/lib/api";

const priorityConfig = {
  high: { label: "상", className: "bg-priority-high/10 text-priority-high border-priority-high/20" },
  medium: { label: "중", className: "bg-priority-medium/10 text-priority-medium border-priority-medium/20" },
  low: { label: "하", className: "bg-priority-low/10 text-priority-low border-priority-low/20" },
};

export function SubtaskCard({ title, estimatedMin, priority = "medium" }: Subtask) {
  const p = priorityConfig[priority];

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-card-foreground">{title}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {estimatedMin}분
        </span>
      </div>
      <Badge variant="outline" className={p.className}>
        {p.label}
      </Badge>
    </div>
  );
}
