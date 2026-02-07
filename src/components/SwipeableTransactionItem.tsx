import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";

interface SwipeableTransactionItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  transactionId: string;
}

const SWIPE_THRESHOLD = -80;
const DELETE_TRIGGER = -120;

export function SwipeableTransactionItem({ children, onDelete, transactionId }: SwipeableTransactionItemProps) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const x = useMotionValue(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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

  const handleDrag = (_: any, info: PanInfo) => {
    if (info.offset.x < SWIPE_THRESHOLD && !deleteTriggered.current) {
      deleteTriggered.current = true;
      navigator.vibrate?.(30);
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      deleteTriggered.current = false;
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    deleteTriggered.current = false;
    if (info.offset.x < DELETE_TRIGGER) {
      navigator.vibrate?.(50);
      setShowConfirm(true);
    }
  };

  const handleConfirmDelete = () => {
    setShowConfirm(false);
    setIsDeleting(true);
    onDelete();
  };

  return (
    <>
      <div className="relative overflow-hidden">
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

        <motion.div
          drag="x"
          dragConstraints={{ left: -150, right: 0 }}
          dragElastic={0.1}
          dragSnapToOrigin
          style={{ x }}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          className="relative bg-card z-10"
        >
          {children}
        </motion.div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmare ștergere</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să ștergi această tranzacție? Acțiunea nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
