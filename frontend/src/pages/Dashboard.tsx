import { BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <BarChart3 className="w-16 h-16 text-primary animate-float" />
      </motion.div>
      <h1 className="text-2xl font-display font-bold neon-text-pink">대시보드</h1>
      <p className="text-muted-foreground">곧 멋진 통계가 여기에 나타날 거예요 ✨</p>
    </div>
  );
}
