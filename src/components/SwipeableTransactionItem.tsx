import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SwipeableTransactionItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  transactionId: string;
}

const SWIPE_THRESHOLD = -80;
const DELETE_TRIGGER = -120;

export function SwipeableTransactionItem({ children, onDelete, transactionId }: SwipeableTransactionItemProps) {
  const isMobile = useIsMobile();
  const x = useMotionValue(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteTriggered = useRef(false);

  const deleteOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const deleteScale = useTransform(x, [0, SWIPE_THRESHOLD, DELETE_TRIGGER], [0.5, 1, 1.2]);
  const bgColor = useTransform(
    x,
    [0, SWIPE_THRESHOLD, DELETE_TRIGGER],
    ["hsl(var(--danger) / 0)", "hsl(var(--danger) / 0.15)", "hsl(var(--danger) / 0.3)"]
  );

  if (!isMobile) {
    return <>{children}</>;
  }

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < DELETE_TRIGGER) {
      setIsDeleting(true);
      onDelete();
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Delete background */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-6"
        style={{ backgroundColor: bgColor }}
      >
        <motion.div
          style={{ opacity: deleteOpacity, scale: deleteScale }}
          className="flex items-center gap-2 text-danger font-medium"
        >
          <Trash2 className="h-5 w-5" />
          <span className="text-sm">Șterge</span>
        </motion.div>
      </motion.div>

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={0.1}
        dragSnapToOrigin
        style={{ x }}
        onDragEnd={handleDragEnd}
        className="relative bg-card z-10"
      >
        {children}
      </motion.div>
    </div>
  );
}
