import { User } from "lucide-react";
import { motion } from "framer-motion";

export default function Profile() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <User className="w-16 h-16 text-secondary animate-float" />
      </motion.div>
      <h1 className="text-2xl font-display font-bold neon-text-mint">내 프로필</h1>
      <p className="text-muted-foreground">프로필 기능이 준비 중이에요 💜</p>
    </div>
  );
}
