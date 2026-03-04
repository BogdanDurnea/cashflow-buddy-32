import { useState, useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PULL_THRESHOLD = 80;

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const isMobile = useIsMobile();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);

  const spinnerOpacity = useTransform(y, [0, PULL_THRESHOLD * 0.5, PULL_THRESHOLD], [0, 0.5, 1]);
  const spinnerScale = useTransform(y, [0, PULL_THRESHOLD], [0.5, 1]);
  const spinnerRotate = useTransform(y, [0, PULL_THRESHOLD], [0, 180]);

  const handleDragEnd = useCallback(async (_: any, info: PanInfo) => {
    if (info.offset.y >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      navigator.vibrate?.(20);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [isRefreshing, onRefresh]);

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 pointer-events-none"
        style={{ opacity: isRefreshing ? 1 : spinnerOpacity, height: 48 }}
      >
        <motion.div
          style={{ scale: isRefreshing ? 1 : spinnerScale, rotate: isRefreshing ? undefined : spinnerRotate }}
          className={isRefreshing ? "animate-spin" : ""}
        >
          <Loader2 className="h-5 w-5 text-primary" />
        </motion.div>
      </motion.div>

      {/* Draggable content */}
      <motion.div
        drag={isRefreshing ? false : "y"}
        dragConstraints={{ top: 0, bottom: PULL_THRESHOLD + 20 }}
        dragElastic={0.4}
        dragSnapToOrigin
        style={{ y }}
        onDragEnd={handleDragEnd}
        onDragStart={(_, info) => {
          // Only allow pull down when scrolled to top
          const scrollArea = containerRef.current?.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollArea && scrollArea.scrollTop > 5) {
            // Cancel drag by snapping back
            y.set(0);
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
