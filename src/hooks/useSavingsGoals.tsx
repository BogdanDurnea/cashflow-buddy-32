import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAchievements } from "@/hooks/useAchievements";

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  category: string;
  color: string;
  createdAt: Date;
}

const STORAGE_KEY = "savingsGoals";

const GOAL_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
];

export function useSavingsGoals() {
  const { user } = useAuth();
  const { checkFeatureAchievement } = useAchievements();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    const storageKey = `${STORAGE_KEY}_${user.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGoals(parsed.map((g: any) => ({
          ...g,
          deadline: new Date(g.deadline),
          createdAt: new Date(g.createdAt),
        })));
      } catch (error) {
        console.error("Error parsing savings goals:", error);
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user || loading) return;
    
    const storageKey = `${STORAGE_KEY}_${user.id}`;
    localStorage.setItem(storageKey, JSON.stringify(goals));
  }, [goals, user, loading]);

  const addGoal = useCallback((goal: Omit<SavingsGoal, "id" | "createdAt" | "color">) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      color: GOAL_COLORS[Math.floor(Math.random() * GOAL_COLORS.length)],
    };
    setGoals(prev => [...prev, newGoal]);
    checkFeatureAchievement("first_goal");
  }, [checkFeatureAchievement]);

  const updateGoal = useCallback((id: string, updates: Partial<SavingsGoal>) => {
    setGoals(prev => 
      prev.map(g => g.id === id ? { ...g, ...updates } : g)
    );
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  const addToGoal = useCallback((id: string, amount: number) => {
    setGoals(prev => 
      prev.map(g => {
        if (g.id === id) {
          const newAmount = g.currentAmount + amount;
          // Check for 50% progress achievement
          if (newAmount >= g.targetAmount * 0.5 && g.currentAmount < g.targetAmount * 0.5) {
            checkFeatureAchievement("goal_progress_50");
          }
          // Check for completed goal achievement
          if (newAmount >= g.targetAmount && g.currentAmount < g.targetAmount) {
            checkFeatureAchievement("goal_completed");
          }
          return { ...g, currentAmount: newAmount };
        }
        return g;
      })
    );
  }, [checkFeatureAchievement]);

  return {
    goals,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    addToGoal,
  };
}
