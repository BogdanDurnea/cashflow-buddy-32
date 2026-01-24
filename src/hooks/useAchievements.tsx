import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

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
        const { error } = await supabase.from("user_achievements").insert({
          user_id: user.id,
          achievement_id: achievementId,
        });

        if (error) throw error;

        setUnlockedAchievements((prev) => [...prev, achievementId]);

        // Show celebration toast
        toast.success(
          <div className="flex items-center gap-3">
            <span className="text-2xl">{achievement.icon}</span>
            <div>
              <p className="font-bold">Insignă deblocată!</p>
              <p className="text-sm text-muted-foreground">{achievement.name}</p>
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

  return {
    achievements: getAchievementsWithStatus(),
    unlockedAchievements,
    loading,
    unlockAchievement,
    checkAchievements,
    getProgress,
  };
};
