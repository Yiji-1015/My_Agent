import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AgentPlugin } from "@/lib/orchestration";

interface Props {
  agents: AgentPlugin[];
}

const statusConfig = {
  idle: { label: "대기 중", dotClass: "bg-muted-foreground/40" },
  working: { label: "작업 중", dotClass: "bg-primary animate-pulse" },
  done: { label: "완료", dotClass: "bg-secondary" },
};

export function AgentPluginRegistry({ agents }: Props) {
  return (
    <div className="space-y-3 h-full overflow-y-auto pr-1">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          에이전트 플러그인 레지스트리
        </span>
      </div>

      {agents.map((agent, i) => {
        const sc = statusConfig[agent.status];
        return (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "rounded-xl border p-3 transition-all duration-300",
              agent.status === "working"
                ? "border-primary/50 bg-primary/5 shadow-[0_0_15px_hsl(var(--primary)/0.15)]"
                : agent.status === "done"
                ? "border-secondary/40 bg-secondary/5"
                : "border-border/30 bg-card/40"
            )}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-lg leading-none mt-0.5">{agent.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {agent.name}
                  </span>
                  {agent.type === "plugin" && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                      Plugin
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {agent.description}
                </p>

                {/* Keywords */}
                {agent.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {agent.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/30"
                      >
                        "{kw}"
                      </span>
                    ))}
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center gap-1.5 mt-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full", sc.dotClass)} />
                  <span
                    className={cn(
                      "text-[10px] font-mono",
                      agent.status === "working"
                        ? "text-primary"
                        : agent.status === "done"
                        ? "text-secondary"
                        : "text-muted-foreground"
                    )}
                  >
                    {sc.label}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
