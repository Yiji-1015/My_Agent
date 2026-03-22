import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["월", "화", "수", "목", "금"];

const MOCK_SCHEDULE = [
  { day: 0, start: 9, duration: 0.5, title: "텍스트 맥락 분석", priority: "high" as const },
  { day: 0, start: 10, duration: 1, title: "제안서 목차 작성", priority: "high" as const },
  { day: 1, start: 9, duration: 2, title: "각 섹션 초안 작성", priority: "medium" as const },
  { day: 2, start: 9, duration: 1.5, title: "예산 및 일정표 작성", priority: "medium" as const },
  { day: 3, start: 9, duration: 0.75, title: "최종 검토 및 수정", priority: "low" as const },
  { day: 3, start: 10.5, duration: 0.5, title: "제출 준비 및 포맷팅", priority: "low" as const },
];

const HOURS = Array.from({ length: 9 }, (_, i) => i + 9); // 9~17

const priorityColors = {
  high: "bg-priority-high/15 border-priority-high/30 text-priority-high",
  medium: "bg-priority-medium/15 border-priority-medium/30 text-priority-medium",
  low: "bg-priority-low/15 border-priority-low/30 text-priority-low",
};

export default function TaskReview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">일정 리뷰</h1>
        <p className="mt-1 text-sm text-muted-foreground">AI가 배치한 주간 일정을 확인하세요.</p>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <div className="grid min-w-[700px]" style={{ gridTemplateColumns: "60px repeat(5, 1fr)" }}>
          {/* Header */}
          <div className="border-b bg-muted/50 p-2" />
          {DAYS.map((d) => (
            <div key={d} className="border-b border-l bg-muted/50 p-2 text-center text-xs font-semibold text-muted-foreground">
              {d}
            </div>
          ))}

          {/* Time grid */}
          {HOURS.map((hour) => (
            <>
              <div key={`h-${hour}`} className="border-b p-2 text-right text-xs text-muted-foreground pr-3">
                {hour}:00
              </div>
              {DAYS.map((_, dayIdx) => {
                const block = MOCK_SCHEDULE.find((b) => b.day === dayIdx && hour >= b.start && hour < b.start + b.duration);
                const isStart = block && hour === Math.floor(block.start);
                return (
                  <div key={`${hour}-${dayIdx}`} className="relative border-b border-l min-h-[48px]">
                    {isStart && block && (
                      <div
                        className={`absolute inset-x-1 rounded-md border px-2 py-1 text-xs font-medium ${priorityColors[block.priority]}`}
                        style={{
                          top: `${(block.start - hour) * 48}px`,
                          height: `${block.duration * 48 - 4}px`,
                        }}
                      >
                        {block.title}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      <Button
        onClick={() => toast.success("일정이 확정되었습니다!")}
        className="bg-brand text-brand-foreground hover:bg-brand/90"
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        이대로 확정하기
      </Button>
    </div>
  );
}
