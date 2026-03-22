export default function Dashboard() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">대시보드</h1>
      <p className="text-sm text-muted-foreground">업무 현황과 통계가 여기에 표시됩니다.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "진행 중", value: "3", sub: "건" },
          { label: "완료", value: "12", sub: "건" },
          { label: "이번 주 예상 소요", value: "6.5", sub: "시간" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-5">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {s.value}
              <span className="ml-1 text-sm font-normal text-muted-foreground">{s.sub}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
