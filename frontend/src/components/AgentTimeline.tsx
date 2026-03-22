import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AgentStep } from "@/lib/api";

interface AgentTimelineProps {
  steps: AgentStep[];
  currentStep: number;
}

export function AgentTimeline({ steps, currentStep }: AgentTimelineProps) {
  return (
    <div className="space-y-1">
      {steps.map((step, i) => {
        const isActive = i === currentStep;
        const isDone = i < currentStep;
        const isPending = i > currentStep;

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="flex gap-4"
          >
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-500 shrink-0",
                  isDone && "border-secondary bg-secondary/20",
                  isActive && "border-primary bg-primary/20 animate-neon-pulse",
                  isPending && "border-border/40 bg-muted/30"
                )}
              >
                {step.icon}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "w-0.5 h-12 transition-all duration-500",
                    isDone ? "bg-secondary/60" : "bg-border/30"
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="pt-1.5 pb-6 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-display text-sm font-semibold transition-colors",
                    isDone && "text-secondary",
                    isActive && "neon-text-pink",
                    isPending && "text-muted-foreground"
                  )}
                >
                  [{step.label}]
                </span>
                {isDone && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-secondary text-sm"
                  >
                    ✓
                  </motion.span>
                )}
              </div>
              <p
                className={cn(
                  "text-sm mt-1 transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.description}
              </p>
              {isActive && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: step.durationMs / 1000, ease: "linear" }}
                  className="h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full mt-3 max-w-[200px]"
                />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
