import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Paperclip, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SubtaskCard } from "@/components/SubtaskCard";
import { submitTask, type Subtask } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function TaskInput() {
  const [input, setInput] = useState("");
  const [date, setDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setSubtasks([]);
    const res = await submitTask({
      originalInput: input,
      deadline: date ? format(date, "yyyy-MM-dd") : "",
      attachments: [],
    });
    setSubtasks(res.subtasks);
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">새 업무 입력</h1>
        <p className="mt-1 text-sm text-muted-foreground">AI가 업무를 분석하고 일정을 생성합니다.</p>
      </div>

      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="예: NIPA 공공 사업 제안서 써야 해. 마감은 다음 주 금요일까지."
        className="min-h-[120px] resize-none text-sm"
      />

      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "yyyy-MM-dd") : "마감일 선택"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <Button variant="outline" className="text-muted-foreground">
          <Paperclip className="mr-2 h-4 w-4" />
          첨부파일
        </Button>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading || !input.trim()}
        className="w-full bg-brand text-brand-foreground hover:bg-brand/90 h-12 text-base font-semibold"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            AI가 업무를 분해하고 일정을 테트리스 중입니다...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            AI 분석 및 일정 생성
          </>
        )}
      </Button>

      {subtasks.length > 0 && (
        <div className="space-y-3 pt-2">
          <h2 className="text-lg font-semibold text-foreground">분석 결과</h2>
          {subtasks.map((s, i) => (
            <SubtaskCard key={i} {...s} />
          ))}
        </div>
      )}
    </div>
  );
}
