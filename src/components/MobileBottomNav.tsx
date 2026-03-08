import { motion } from "framer-motion";
import { Home, TrendingUp, Wallet, Trophy, FileText, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";

interface MobileBottomNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const sections = [
  { id: "transactions", icon: Home, labelKey: "nav.transactions" },
  { id: "analytics", icon: TrendingUp, labelKey: "analytics.title" },
  { id: "budgets", icon: Wallet, labelKey: "budgets.title" },
  { id: "achievements", icon: Trophy, labelKey: "achievements.title" },
  { id: "reports", icon: FileText, labelKey: "reports.title" },
  { id: "settings", icon: Settings, labelKey: "settings.title" },
];

export function MobileBottomNav({ activeSection, onSectionChange }: MobileBottomNavProps) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  if (!isMobile) return null;

  const handleNavClick = (sectionId: string) => {
    onSectionChange(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t shadow-lg safe-area-bottom"
    >
      <div className="flex items-center justify-around px-1 py-1.5">
        {sections.map(({ id, icon: Icon, labelKey }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg relative transition-colors duration-200"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-0 bg-primary/10 rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={`h-5 w-5 relative z-10 transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-[10px] relative z-10 transition-colors duration-200 ${
                  isActive ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                {t(labelKey).split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
