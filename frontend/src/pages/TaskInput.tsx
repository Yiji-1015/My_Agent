import { useState } from "react";
import { Send, RotateCcw, CalendarSync, Clock, Bot, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AgentPluginRegistry } from "@/components/AgentPluginRegistry";
import { OrchestrationGraph } from "@/components/OrchestrationGraph";
import { EnvelopeInspector } from "@/components/EnvelopeInspector";
import { useOrchestration } from "@/hooks/use-orchestration";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const priorityConfig = {
  high: { label: "상", className: "bg-neon-pink/20 text-neon-pink border-neon-pink/30" },
  medium: { label: "중", className: "bg-neon-yellow/20 text-neon-yellow border-neon-yellow/30" },
  low: { label: "하", className: "bg-neon-mint/20 text-neon-mint border-neon-mint/30" },
};

export default function TaskInput() {
  const [inputText, setInputText] = useState("");
  const orch = useOrchestration();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!inputText.trim()) return;
    orch.run(inputText);
  };

  const handleReset = () => {
    orch.reset();
    setInputText("");
  };

  const handleSyncCalendar = () => {
    toast({
      title: "📅 Google Calendar 동기화",
      description: "일정이 캘린더에 동기화되었습니다! 🎉",
    });
  };

  const totalMin = orch.subtasks.reduce((s, t) => s + t.estimatedMin, 0);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex gap-0 overflow-hidden">
      {/* ─── Column 1: Agent Plugin Registry ─── */}
      <aside className="w-[260px] shrink-0 border-r border-border/20 p-4 overflow-y-auto hidden lg:block">
        <AgentPluginRegistry agents={orch.agents} />
      </aside>

      {/* ─── Column 2: Command Center ─── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-display font-bold neon-text-pink">
              에이전트 컨트롤 타워
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-border/40 text-muted-foreground"
            >
              v3.0
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            멀티 에이전트 오케스트레이션 시스템
          </p>
        </div>

        {/* Input area */}
        <div className="px-6 pb-4">
          <div className="glass-panel p-4 space-y-3">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="메인 에이전트에게 지시할 복잡한 태스크를 입력하세요... (예: NIPA 공공사업 제안서 작성해줘)"
              disabled={orch.phase !== "idle"}
              className="min-h-[80px] text-sm bg-muted/20 border-border/30 rounded-xl resize-none focus:ring-primary/50 focus:border-primary/50 placeholder:text-muted-foreground/50 font-mono"
            />
            <div className="flex gap-2">
              {orch.phase === "idle" ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!inputText.trim()}
                  className="rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 animate-neon-pulse disabled:animate-none font-semibold"
                >
                  <Send className="w-4 h-4" />
                  오케스트레이션 시작
                </Button>
              ) : (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="rounded-xl gap-2 border-border/40"
                >
                  <RotateCcw className="w-4 h-4" />
                  초기화
                </Button>
              )}
              {orch.phase === "done" && (
                <Button
                  onClick={handleSyncCalendar}
                  className="rounded-xl gap-2 bg-gradient-to-r from-secondary to-primary text-primary-foreground hover:opacity-90 font-semibold ml-auto"
                >
                  <CalendarSync className="w-4 h-4" />
                  Google Calendar 동기화
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Execution Graph */}
        <AnimatePresence>
          {orch.graphNodes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 pb-3"
            >
              <div className="glass-panel p-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-2">
                  실행 그래프
                </span>
                <OrchestrationGraph nodes={orch.graphNodes} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing indicator */}
        <AnimatePresence>
          {orch.phase === "processing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-6 py-2 text-center"
            >
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Bot className="w-4 h-4 text-primary" />
                </motion.div>
                <span className="font-mono text-xs">에이전트 파이프라인 실행 중...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {orch.phase === "done" && orch.subtasks.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-6 pb-6 space-y-3 flex-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  분해된 서브태스크 ({orch.subtasks.length}개 · 총 {totalMin}분)
                </span>
              </div>
              <div className="grid gap-2">
                {orch.subtasks.map((st, i) => {
                  const pc = priorityConfig[st.priority || "medium"];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.4 }}
                    >
                      <Card className="glass-panel border-border/20 hover:border-primary/30 transition-all group">
                        <CardContent className="p-4 flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                              {st.title}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono gap-1 rounded-lg bg-muted/40 border-border/30"
                              >
                                <Clock className="w-3 h-3" />
                                {st.estimatedMin}분
                              </Badge>
                              {st.handledBy && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-mono gap-1 rounded-lg bg-secondary/10 border-secondary/25 text-secondary"
                                >
                                  <Bot className="w-3 h-3" />
                                  {st.handledBy}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold",
                              pc.className
                            )}
                          >
                            <Zap className="w-3 h-3 mr-0.5" />
                            {pc.label}
                          </Badge>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ─── Column 3: Envelope Inspector ─── */}
      <aside className="w-[280px] shrink-0 border-l border-border/20 p-4 overflow-y-auto hidden xl:block">
        <EnvelopeInspector envelope={orch.envelope} phase={orch.phase} />
      </aside>
    </div>
  );
}
