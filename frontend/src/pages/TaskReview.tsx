import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Subtask } from "@/lib/api";
import { addDays, format, startOfWeek } from "date-fns";
import { ko } from "date-fns/locale";

const dayLabels = ["월", "화", "수", "목", "금"];
const blockColors = [
  "bg-neon-pink/20 border-neon-pink/40",
  "bg-neon-mint/20 border-neon-mint/40",
  "bg-neon-yellow/20 border-neon-yellow/40",
  "bg-primary/15 border-primary/30",
  "bg-secondary/20 border-secondary/40",
];

export default function TaskReview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const subtasks: Subtask[] = location.state?.subtasks || [];

  // distribute subtasks across weekdays
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = dayLabels.map((label, i) => ({
    label,
    date: format(addDays(weekStart, i), "M/d", { locale: ko }),
    tasks: [] as (Subtask & { colorClass: string })[],
  }));

  subtasks.forEach((st, i) => {
    const dayIdx = i % 5;
    days[dayIdx].tasks.push({ ...st, colorClass: blockColors[i % blockColors.length] });
  });

  const handleConfirm = () => {
    toast({ title: "✅ 일정이 확정되었어요!", description: "달력에 성공적으로 등록했습니다 🎉" });
  };

  if (subtasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground text-lg">아직 분석된 태스크가 없어요.</p>
        <Button onClick={() => navigate("/")} className="rounded-2xl">홈으로 돌아가기</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-display font-bold neon-text-mint">📅 주간 타임라인</h1>
        <p className="text-muted-foreground">AI가 배치한 일정을 확인하세요</p>
      </motion.div>

      {/* Timeline grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="grid grid-cols-5 gap-3"
      >
        {days.map((day, di) => (
          <div key={di} className="space-y-2">
            <div className="text-center">
              <div className="font-display font-bold text-foreground">{day.label}</div>
              <div className="text-xs text-muted-foreground">{day.date}</div>
            </div>
            <div className="space-y-2 min-h-[200px]">
              {day.tasks.map((task, ti) => (
                <motion.div
                  key={ti}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: di * 0.1 + ti * 0.05 }}
                  className={`glass-panel p-3 border ${task.colorClass} rounded-2xl`}
                >
                  <p className="text-sm font-semibold text-foreground leading-snug">{task.title}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{task.estimatedMin}분</span>
                    {task.priority && (
                      <>
                        <Zap className="w-3 h-3" />
                        <span>{task.priority === "high" ? "상" : task.priority === "medium" ? "중" : "하"}</span>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </motion.div>

      <Button onClick={handleConfirm}
        className="w-full h-14 text-lg font-bold rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all animate-neon-pulse gap-2"
      >
        <CheckCircle2 className="w-5 h-5" />
        ✨ 이대로 내 달력에 확정하기
      </Button>
    </div>
  );
}
