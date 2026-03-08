import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
}

export function SuccessAnimation({ show, message }: SuccessAnimationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5, times: [0, 0.6, 1] }}
            className="bg-success/90 backdrop-blur-sm rounded-full p-6 shadow-2xl"
          >
            <motion.div
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <Check className="h-10 w-10 text-success-foreground" strokeWidth={3} />
            </motion.div>
          </motion.div>
          {message && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute mt-28 text-sm font-medium text-foreground bg-card/90 backdrop-blur px-4 py-2 rounded-full shadow-lg"
            >
              {message}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
