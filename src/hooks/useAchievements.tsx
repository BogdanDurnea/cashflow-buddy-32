import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import i18n from "@/i18n";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "transactions" | "budgets" | "savings" | "streaks" | "special";
  unlockedAt?: Date;
}

// Define all available achievements
export const ACHIEVEMENTS: Achievement[] = [
  // Transactions
  {
    id: "first_transaction",
    name: "Primul Pas",
    description: "Adaugă prima ta tranzacție",
    icon: "🎯",
    category: "transactions",
  },
  {
    id: "ten_transactions",
    name: "Organizat",
    description: "Înregistrează 10 tranzacții",
    icon: "📊",
    category: "transactions",
  },
  {
    id: "fifty_transactions",
    name: "Contabil Junior",
    description: "Înregistrează 50 de tranzacții",
    icon: "📈",
    category: "transactions",
  },
  {
    id: "hundred_transactions",
    name: "Maestrul Finanțelor",
    description: "Înregistrează 100 de tranzacții",
    icon: "🏆",
    category: "transactions",
  },
  {
    id: "first_income",
    name: "Prima Plată",
    description: "Adaugă primul tău venit",
    icon: "💰",
    category: "transactions",
  },
  {
    id: "first_expense",
    name: "Prima Cheltuială",
    description: "Înregistrează prima cheltuială",
    icon: "🛒",
    category: "transactions",
  },
  
  // Budgets
  {
    id: "first_budget",
    name: "Planificator",
    description: "Setează primul buget lunar",
    icon: "📋",
    category: "budgets",
  },
  {
    id: "budget_keeper",
    name: "Disciplinat",
    description: "Rămâi în limitele bugetului o lună întreagă",
    icon: "✅",
    category: "budgets",
  },
  {
    id: "category_budget",
    name: "Specialist",
    description: "Creează un buget pe categorie",
    icon: "🎨",
    category: "budgets",
  },
  
  // Savings
  {
    id: "first_goal",
    name: "Visător",
    description: "Creează primul obiectiv de economii",
    icon: "🌟",
    category: "savings",
  },
  {
    id: "goal_achieved",
    name: "Realizator",
    description: "Atinge un obiectiv de economii",
    icon: "🎉",
    category: "savings",
  },
  {
    id: "big_saver",
    name: "Econom Mare",
    description: "Economisește peste 5000 RON",
    icon: "💎",
    category: "savings",
  },
  
  // Streaks
  {
    id: "week_streak",
    name: "Consecvent",
    description: "Adaugă tranzacții 7 zile consecutive",
    icon: "🔥",
    category: "streaks",
  },
  {
    id: "month_streak",
    name: "Dedicat",
    description: "Adaugă tranzacții 30 de zile consecutive",
    icon: "⚡",
    category: "streaks",
  },
  
  // Special
  {
    id: "first_receipt",
    name: "Colecționar",
    description: "Atașează prima chitanță la o tranzacție",
    icon: "🧾",
    category: "special",
  },
  {
    id: "recurring_master",
    name: "Automatizator",
    description: "Creează o tranzacție recurentă",
    icon: "🔄",
    category: "special",
  },
  {
    id: "shared_budget",
    name: "Colaborator",
    description: "Creează un buget partajat",
    icon: "👥",
    category: "special",
  },
  {
    id: "report_shared",
    name: "Transparent",
    description: "Partajează un raport financiar",
    icon: "📤",
    category: "special",
  },
  {
    id: "night_owl",
    name: "Bufnița de Noapte",
    description: "Adaugă o tranzacție după miezul nopții",
    icon: "🦉",
    category: "special",
  },
  {
    id: "early_bird",
    name: "Matinal",
    description: "Adaugă o tranzacție înainte de ora 6",
    icon: "🐦",
    category: "special",
  },
];

// Level definitions based on achievement count
export const LEVELS = [
  { level: 1, minAchievements: 0, name: "Începător", icon: "🌱", color: "from-slate-400 to-slate-500" },
  { level: 2, minAchievements: 3, name: "Explorator", icon: "🧭", color: "from-green-400 to-green-600" },
  { level: 3, minAchievements: 6, name: "Avansat", icon: "⭐", color: "from-blue-400 to-blue-600" },
  { level: 4, minAchievements: 10, name: "Expert", icon: "💫", color: "from-purple-400 to-purple-600" },
  { level: 5, minAchievements: 15, name: "Maestru", icon: "👑", color: "from-amber-400 to-amber-600" },
  { level: 6, minAchievements: 20, name: "Legendă", icon: "🏆", color: "from-rose-400 to-rose-600" },
];

export const getLevelInfo = (achievementCount: number) => {
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];
  
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (achievementCount >= LEVELS[i].minAchievements) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] || null;
      break;
    }
  }
  
  const progressToNext = nextLevel
    ? ((achievementCount - currentLevel.minAchievements) / 
       (nextLevel.minAchievements - currentLevel.minAchievements)) * 100
    : 100;
  
  const achievementsToNext = nextLevel 
    ? nextLevel.minAchievements - achievementCount 
    : 0;
  
  return {
    currentLevel,
    nextLevel,
    progressToNext: Math.min(progressToNext, 100),
    achievementsToNext,
  };
};

export const useAchievements = () => {
  const { user } = useAuth();
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load unlocked achievements from database
  useEffect(() => {
    if (!user) return;

    const loadAchievements = async () => {
      try {
        const { data, error } = await supabase
          .from("user_achievements")
          .select("achievement_id, unlocked_at")
          .eq("user_id", user.id);

        if (error) throw error;

        setUnlockedAchievements(data.map((a) => a.achievement_id));
      } catch (error) {
        console.error("Error loading achievements:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();
  }, [user]);

  // Unlock an achievement
  const unlockAchievement = useCallback(
    async (achievementId: string) => {
      if (!user || unlockedAchievements.includes(achievementId)) return false;

      const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
      if (!achievement) return false;

      try {
        const { error } = await supabase.rpc("unlock_achievement", {
          _user_id: user.id,
          _achievement_id: achievementId,
        });

        if (error) throw error;

        setUnlockedAchievements((prev) => [...prev, achievementId]);

        // Show celebration toast
        const badgeName = i18n.t(`achievements.badge.${achievementId}.name`);
        toast.success(
          <div className="flex items-center gap-3">
            <span className="text-2xl">{achievement.icon}</span>
            <div>
              <p className="font-bold">{i18n.t("achievements.badgeUnlocked")}</p>
              <p className="text-sm text-muted-foreground">{badgeName}</p>
            </div>
          </div>,
          {
            duration: 5000,
          }
        );

        return true;
      } catch (error) {
        console.error("Error unlocking achievement:", error);
        return false;
      }
    },
    [user, unlockedAchievements]
  );

  // Check and unlock achievements based on conditions
  const checkAchievements = useCallback(
    async (context: {
      transactionCount?: number;
      hasIncome?: boolean;
      hasExpense?: boolean;
      hasBudget?: boolean;
      hasCategoryBudget?: boolean;
      hasGoal?: boolean;
      goalAchieved?: boolean;
      totalSavings?: number;
      hasReceipt?: boolean;
      hasRecurring?: boolean;
      hasSharedBudget?: boolean;
      hasSharedReport?: boolean;
      currentHour?: number;
      consecutiveDays?: number;
    }) => {
      const {
        transactionCount = 0,
        hasIncome,
        hasExpense,
        hasBudget,
        hasCategoryBudget,
        hasGoal,
        goalAchieved,
        totalSavings = 0,
        hasReceipt,
        hasRecurring,
        hasSharedBudget,
        hasSharedReport,
        currentHour,
        consecutiveDays = 0,
      } = context;

      // Transaction achievements
      if (transactionCount >= 1) await unlockAchievement("first_transaction");
      if (transactionCount >= 10) await unlockAchievement("ten_transactions");
      if (transactionCount >= 50) await unlockAchievement("fifty_transactions");
      if (transactionCount >= 100) await unlockAchievement("hundred_transactions");

      if (hasIncome) await unlockAchievement("first_income");
      if (hasExpense) await unlockAchievement("first_expense");

      // Budget achievements
      if (hasBudget) await unlockAchievement("first_budget");
      if (hasCategoryBudget) await unlockAchievement("category_budget");

      // Savings achievements
      if (hasGoal) await unlockAchievement("first_goal");
      if (goalAchieved) await unlockAchievement("goal_achieved");
      if (totalSavings >= 5000) await unlockAchievement("big_saver");

      // Streak achievements
      if (consecutiveDays >= 7) await unlockAchievement("week_streak");
      if (consecutiveDays >= 30) await unlockAchievement("month_streak");

      // Special achievements
      if (hasReceipt) await unlockAchievement("first_receipt");
      if (hasRecurring) await unlockAchievement("recurring_master");
      if (hasSharedBudget) await unlockAchievement("shared_budget");
      if (hasSharedReport) await unlockAchievement("report_shared");

      if (currentHour !== undefined) {
        if (currentHour >= 0 && currentHour < 5) await unlockAchievement("night_owl");
        if (currentHour >= 5 && currentHour < 6) await unlockAchievement("early_bird");
      }
    },
    [unlockAchievement]
  );

  // Get achievements with unlock status
  const getAchievementsWithStatus = useCallback(() => {
    return ACHIEVEMENTS.map((achievement) => ({
      ...achievement,
      isUnlocked: unlockedAchievements.includes(achievement.id),
    }));
  }, [unlockedAchievements]);

  // Get progress stats
  const getProgress = useCallback(() => {
    const total = ACHIEVEMENTS.length;
    const unlocked = unlockedAchievements.length;
    return {
      total,
      unlocked,
      percentage: Math.round((unlocked / total) * 100),
    };
  }, [unlockedAchievements]);

  // Get level info
  const getLevelProgress = useCallback(() => {
    return getLevelInfo(unlockedAchievements.length);
  }, [unlockedAchievements]);

  return {
    achievements: getAchievementsWithStatus(),
    unlockedAchievements,
    loading,
    unlockAchievement,
    checkAchievements,
    getProgress,
    getLevelProgress,
  };
};
