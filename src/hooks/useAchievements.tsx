import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { achievements, Achievement } from "@/lib/achievementsConfig";
import { toast } from "sonner";
import { Trophy } from "lucide-react";

interface UnlockedAchievement {
  achievement_id: string;
  unlocked_at: string;
}

export const useAchievements = () => {
  const { user } = useAuth();
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<Achievement | null>(null);

  // Load unlocked achievements
  useEffect(() => {
    if (!user) {
      setUnlockedAchievements([]);
      setLoading(false);
      return;
    }

    const loadAchievements = async () => {
      try {
        const { data, error } = await supabase
          .from("user_achievements")
          .select("achievement_id, unlocked_at")
          .eq("user_id", user.id);

        if (error) throw error;
        setUnlockedAchievements(data || []);
      } catch (error) {
        console.error("Error loading achievements:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();
  }, [user]);

  const isUnlocked = useCallback((achievementId: string) => {
    return unlockedAchievements.some(a => a.achievement_id === achievementId);
  }, [unlockedAchievements]);

  const unlockAchievement = useCallback(async (achievementId: string) => {
    if (!user || isUnlocked(achievementId)) return false;

    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) return false;

    try {
      const { error } = await supabase
        .from("user_achievements")
        .insert({
          user_id: user.id,
          achievement_id: achievementId
        });

      if (error) {
        // Already unlocked (unique constraint)
        if (error.code === "23505") return false;
        throw error;
      }

      setUnlockedAchievements(prev => [
        ...prev,
        { achievement_id: achievementId, unlocked_at: new Date().toISOString() }
      ]);

      setRecentlyUnlocked(achievement);
      
      // Show toast notification
      toast.success(
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/20">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Realizare Deblocată!</p>
            <p className="text-sm text-muted-foreground">{achievement.name}</p>
          </div>
        </div>,
        { duration: 5000 }
      );

      return true;
    } catch (error) {
      console.error("Error unlocking achievement:", error);
      return false;
    }
  }, [user, isUnlocked]);

  // Check transaction-based achievements
  const checkTransactionAchievements = useCallback(async (
    transactionCount: number,
    hasIncome: boolean,
    hasExpense: boolean,
    usedCategories: string[]
  ) => {
    const unlocks: string[] = [];

    if (transactionCount >= 1 && !isUnlocked("first_transaction")) {
      unlocks.push("first_transaction");
    }
    if (hasIncome && !isUnlocked("first_income")) {
      unlocks.push("first_income");
    }
    if (hasExpense && !isUnlocked("first_expense")) {
      unlocks.push("first_expense");
    }
    if (transactionCount >= 10 && !isUnlocked("transactions_10")) {
      unlocks.push("transactions_10");
    }
    if (transactionCount >= 50 && !isUnlocked("transactions_50")) {
      unlocks.push("transactions_50");
    }
    if (transactionCount >= 100 && !isUnlocked("transactions_100")) {
      unlocks.push("transactions_100");
    }
    if (transactionCount >= 500 && !isUnlocked("transactions_500")) {
      unlocks.push("transactions_500");
    }

    // Check all expense categories
    const expenseCategories = ["food", "transport", "entertainment", "shopping", "bills", "health", "education", "other"];
    const usedExpenseCategories = usedCategories.filter(c => expenseCategories.includes(c));
    if (usedExpenseCategories.length >= expenseCategories.length && !isUnlocked("all_categories")) {
      unlocks.push("all_categories");
    }

    // Unlock achievements sequentially with delay
    for (const achievementId of unlocks) {
      await unlockAchievement(achievementId);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }, [isUnlocked, unlockAchievement]);

  // Check feature-based achievements
  const checkFeatureAchievement = useCallback(async (featureId: string) => {
    if (!isUnlocked(featureId)) {
      await unlockAchievement(featureId);
    }
  }, [isUnlocked, unlockAchievement]);

  const totalPoints = unlockedAchievements.reduce((total, unlocked) => {
    const achievement = achievements.find(a => a.id === unlocked.achievement_id);
    return total + (achievement?.points || 0);
  }, 0);

  const progressPercentage = (unlockedAchievements.length / achievements.length) * 100;

  const dismissRecentlyUnlocked = useCallback(() => {
    setRecentlyUnlocked(null);
  }, []);

  return {
    achievements,
    unlockedAchievements,
    loading,
    isUnlocked,
    unlockAchievement,
    checkTransactionAchievements,
    checkFeatureAchievement,
    totalPoints,
    progressPercentage,
    recentlyUnlocked,
    dismissRecentlyUnlocked
  };
};
