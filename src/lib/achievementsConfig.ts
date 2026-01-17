import { 
  Trophy, 
  Star, 
  Target, 
  Wallet, 
  TrendingUp, 
  PiggyBank, 
  Bell, 
  RefreshCw, 
  Sparkles, 
  Share2, 
  GraduationCap, 
  Flame, 
  Crown,
  Zap,
  Heart,
  Award,
  Medal,
  Gift
} from "lucide-react";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "transactions" | "budgets" | "goals" | "features" | "milestones";
  points: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

export const achievements: Achievement[] = [
  // Transaction achievements
  {
    id: "first_transaction",
    name: "Primul Pas",
    description: "Adaugă prima ta tranzacție",
    icon: Wallet,
    category: "transactions",
    points: 10,
    rarity: "common"
  },
  {
    id: "first_income",
    name: "Venit Înregistrat",
    description: "Înregistrează primul tău venit",
    icon: TrendingUp,
    category: "transactions",
    points: 10,
    rarity: "common"
  },
  {
    id: "first_expense",
    name: "Cheltuială Notată",
    description: "Înregistrează prima ta cheltuială",
    icon: Wallet,
    category: "transactions",
    points: 10,
    rarity: "common"
  },
  {
    id: "transactions_10",
    name: "Începător Organizat",
    description: "Adaugă 10 tranzacții",
    icon: Star,
    category: "milestones",
    points: 25,
    rarity: "uncommon"
  },
  {
    id: "transactions_50",
    name: "Tracker Dedicat",
    description: "Adaugă 50 tranzacții",
    icon: Award,
    category: "milestones",
    points: 50,
    rarity: "rare"
  },
  {
    id: "transactions_100",
    name: "Maestru Financiar",
    description: "Adaugă 100 tranzacții",
    icon: Trophy,
    category: "milestones",
    points: 100,
    rarity: "epic"
  },
  {
    id: "transactions_500",
    name: "Legendă a Finanțelor",
    description: "Adaugă 500 tranzacții",
    icon: Crown,
    category: "milestones",
    points: 250,
    rarity: "legendary"
  },

  // Budget achievements
  {
    id: "first_budget",
    name: "Planificator",
    description: "Setează primul tău buget lunar",
    icon: Target,
    category: "budgets",
    points: 15,
    rarity: "common"
  },
  {
    id: "category_budget",
    name: "Strategist",
    description: "Setează un buget pe categorie",
    icon: Target,
    category: "budgets",
    points: 20,
    rarity: "uncommon"
  },
  {
    id: "under_budget",
    name: "Econom",
    description: "Finalizează o lună sub buget",
    icon: Medal,
    category: "budgets",
    points: 50,
    rarity: "rare"
  },

  // Savings achievements
  {
    id: "first_goal",
    name: "Visător",
    description: "Creează primul tău obiectiv de economisire",
    icon: PiggyBank,
    category: "goals",
    points: 15,
    rarity: "common"
  },
  {
    id: "goal_progress_50",
    name: "La Jumătatea Drumului",
    description: "Atinge 50% dintr-un obiectiv de economisire",
    icon: TrendingUp,
    category: "goals",
    points: 30,
    rarity: "uncommon"
  },
  {
    id: "goal_completed",
    name: "Obiectiv Atins!",
    description: "Completează un obiectiv de economisire",
    icon: Gift,
    category: "goals",
    points: 75,
    rarity: "epic"
  },

  // Features achievements
  {
    id: "first_reminder",
    name: "Nu Uit Nimic",
    description: "Setează primul memento pentru facturi",
    icon: Bell,
    category: "features",
    points: 15,
    rarity: "common"
  },
  {
    id: "first_recurring",
    name: "Automatizator",
    description: "Creează prima tranzacție recurentă",
    icon: RefreshCw,
    category: "features",
    points: 15,
    rarity: "common"
  },
  {
    id: "ai_insights",
    name: "Explorator AI",
    description: "Folosește analizele AI pentru perspective financiare",
    icon: Sparkles,
    category: "features",
    points: 25,
    rarity: "uncommon"
  },
  {
    id: "share_report",
    name: "Colaborator",
    description: "Partajează un raport financiar",
    icon: Share2,
    category: "features",
    points: 20,
    rarity: "uncommon"
  },
  {
    id: "complete_onboarding",
    name: "Ghid Complet",
    description: "Finalizează tutorialul de onboarding",
    icon: GraduationCap,
    category: "features",
    points: 15,
    rarity: "common"
  },

  // Streak achievements
  {
    id: "week_streak",
    name: "Săptămână Activă",
    description: "Adaugă tranzacții 7 zile consecutive",
    icon: Flame,
    category: "milestones",
    points: 40,
    rarity: "rare"
  },
  {
    id: "month_streak",
    name: "Lună Perfectă",
    description: "Adaugă tranzacții 30 zile consecutive",
    icon: Zap,
    category: "milestones",
    points: 100,
    rarity: "epic"
  },

  // Special
  {
    id: "all_categories",
    name: "Diversificat",
    description: "Folosește toate categoriile de cheltuieli",
    icon: Heart,
    category: "milestones",
    points: 35,
    rarity: "rare"
  }
];

export const rarityColors: Record<Achievement["rarity"], string> = {
  common: "from-slate-400 to-slate-500",
  uncommon: "from-green-400 to-green-600",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-amber-400 to-orange-500"
};

export const rarityBgColors: Record<Achievement["rarity"], string> = {
  common: "bg-slate-100 dark:bg-slate-800",
  uncommon: "bg-green-50 dark:bg-green-900/30",
  rare: "bg-blue-50 dark:bg-blue-900/30",
  epic: "bg-purple-50 dark:bg-purple-900/30",
  legendary: "bg-amber-50 dark:bg-amber-900/30"
};

export const rarityLabels: Record<Achievement["rarity"], string> = {
  common: "Comun",
  uncommon: "Neobișnuit",
  rare: "Rar",
  epic: "Epic",
  legendary: "Legendar"
};

export const categoryLabels: Record<Achievement["category"], string> = {
  transactions: "Tranzacții",
  budgets: "Bugete",
  goals: "Obiective",
  features: "Funcționalități",
  milestones: "Realizări"
};
