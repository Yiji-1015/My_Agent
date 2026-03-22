import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { GraphNode } from "@/lib/orchestration";
import { ArrowRight } from "lucide-react";

interface Props {
  nodes: GraphNode[];
}

export function OrchestrationGraph({ nodes }: Props) {
  if (nodes.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto py-4">
      <div className="flex items-center justify-center gap-1 min-w-max px-4">
        {nodes.map((node, i) => (
          <div key={node.id} className="flex items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border transition-all duration-500 min-w-[90px]",
                node.status === "active" &&
                  "border-primary/60 bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.25)]",
                node.status === "done" &&
                  "border-secondary/50 bg-secondary/10",
                node.status === "pending" &&
                  "border-border/30 bg-muted/20",
                node.status === "skipped" &&
                  "border-border/20 bg-muted/10 opacity-40"
              )}
            >
              <span className="text-lg">{node.icon}</span>
              <span
                className={cn(
                  "text-[11px] font-mono font-medium text-center leading-tight",
                  node.status === "active" && "text-primary",
                  node.status === "done" && "text-secondary",
                  node.status === "pending" && "text-muted-foreground",
                  node.status === "skipped" && "text-muted-foreground/50"
                )}
              >
                {node.label}
              </span>
              {/* Active indicator */}
              {node.status === "active" && (
                <motion.div
                  className="w-1 h-1 rounded-full bg-primary"
                  animate={{ scale: [1, 1.8, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
              {node.status === "done" && (
                <span className="text-[10px] text-secondary">✓</span>
              )}
            </motion.div>

            {/* Arrow connector */}
            {i < nodes.length - 1 && (
              <ArrowRight
                className={cn(
                  "w-4 h-4 mx-1 shrink-0 transition-colors duration-300",
                  node.status === "done"
                    ? "text-secondary/60"
                    : "text-border/40"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
