import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { EnvelopeState } from "@/lib/orchestration";
import type { Phase } from "@/hooks/use-orchestration";

interface Props {
  envelope: EnvelopeState;
  phase: Phase;
}

function Section({
  title,
  icon,
  children,
  highlight,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-all duration-300",
        highlight
          ? "border-primary/40 bg-primary/5"
          : "border-border/30 bg-card/30"
      )}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
          {title}
        </span>
      </div>
      <div className="font-mono text-xs space-y-1">{children}</div>
    </div>
  );
}

function JsonLine({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex gap-1 leading-relaxed">
      <span className="text-muted-foreground">{label}:</span>
      <span className={cn("break-all", color || "text-secondary")}>
        {value}
      </span>
    </div>
  );
}

export function EnvelopeInspector({ envelope, phase }: Props) {
  return (
    <div className="space-y-3 h-full overflow-y-auto pr-1">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          실시간 메모리 인스펙터
        </span>
        {phase === "processing" && (
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>

      {/* Envelope */}
      <Section title="Envelope" icon="📨" highlight={phase === "processing"}>
        <JsonLine label="sender" value={`"${envelope.sender}"`} />
        <JsonLine
          label="receiver"
          value={`"${envelope.receiver}"`}
          color="text-primary"
        />
      </Section>

      {/* Context */}
      <Section title="Context" icon="📋">
        <div className="text-muted-foreground leading-relaxed">
          {envelope.context ? (
            <span className="text-accent">"{envelope.context}"</span>
          ) : (
            <span className="italic text-muted-foreground/50">
              입력 대기 중...
            </span>
          )}
        </div>
      </Section>

      {/* Payload */}
      <Section
        title="Payload"
        icon="📦"
        highlight={
          phase === "processing" &&
          Object.keys(envelope.payload).length > 0
        }
      >
        {Object.keys(envelope.payload).length === 0 ? (
          <span className="text-muted-foreground/50 italic">
            {"{ }"}
          </span>
        ) : (
          <div className="space-y-0.5">
            <span className="text-muted-foreground">{"{"}</span>
            {Object.entries(envelope.payload).map(([key, val]) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, backgroundColor: "hsl(var(--primary) / 0.15)" }}
                animate={{ opacity: 1, backgroundColor: "transparent" }}
                transition={{ duration: 1 }}
                className="pl-3 rounded"
              >
                <span className="text-foreground/80">{key}</span>
                <span className="text-muted-foreground">: </span>
                <span className="text-secondary">
                  {typeof val === "object"
                    ? Array.isArray(val)
                      ? `[${(val as unknown[]).length}개 항목]`
                      : "{...}"
                    : JSON.stringify(val)}
                </span>
              </motion.div>
            ))}
            <span className="text-muted-foreground">{"}"}</span>
          </div>
        )}
      </Section>

      {/* History */}
      <Section title="History" icon="📜">
        {envelope.history.length === 0 ? (
          <span className="text-muted-foreground/50 italic">
            기록 없음
          </span>
        ) : (
          <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
            <AnimatePresence>
              {envelope.history.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-0.5 py-1 border-b border-border/20 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/80 font-medium text-[11px]">
                      {h.agent}
                    </span>
                    <span className="text-muted-foreground/50 text-[10px]">
                      {h.timestamp}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-[11px] leading-snug">
                    {h.action}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </Section>
    </div>
  );
}
