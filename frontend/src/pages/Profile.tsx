import { User } from "lucide-react";

export default function Profile() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold text-foreground">내 프로필</h1>
      <div className="flex items-center gap-4 rounded-lg border bg-card p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <User className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">사용자</p>
          <p className="text-sm text-muted-foreground">user@ezagent.dev</p>
        </div>
      </div>
    </div>
  );
}
