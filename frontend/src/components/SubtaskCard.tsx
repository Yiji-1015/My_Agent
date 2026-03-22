import { motion } from "framer-motion";
import { Clock, Bot, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Subtask } from "@/lib/api";

const priorityConfig = {
  high: { label: "상", className: "bg-neon-pink/20 text-neon-pink border-neon-pink/30" },
  medium: { label: "중", className: "bg-neon-yellow/20 text-neon-yellow border-neon-yellow/30" },
  low: { label: "하", className: "bg-neon-mint/20 text-neon-mint border-neon-mint/30" },
};

export function SubtaskCard({ subtask, index }: { subtask: Subtask; index: number }) {
  const priority = subtask.priority || "medium";
  const config = priorityConfig[priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: "easeOut" }}
    >
      <Card className="glass-panel border-border/30 hover:border-primary/40 transition-all duration-300 group overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-3">
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                {subtask.title}
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-xl px-3 py-1 text-xs font-medium gap-1.5 bg-muted/50 border-border/50">
                  <Clock className="w-3 h-3" />
                  {subtask.estimatedMin}분
                </Badge>
                {subtask.handledBy && (
                  <Badge variant="outline" className="rounded-xl px-3 py-1 text-xs font-medium gap-1.5 bg-secondary/10 border-secondary/30 text-secondary">
                    <Bot className="w-3 h-3" />
                    {subtask.handledBy}
                  </Badge>
                )}
              </div>
            </div>
            <Badge variant="outline" className={`shrink-0 rounded-xl px-3 py-1 text-xs font-bold ${config.className}`}>
              <Zap className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
