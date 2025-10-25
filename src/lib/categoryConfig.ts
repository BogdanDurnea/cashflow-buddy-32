import {
  Briefcase,
  Code,
  TrendingUp,
  ShoppingBag,
  Utensils,
  Car,
  Zap,
  Home,
  Music,
  Heart,
  ShoppingCart,
  GraduationCap,
  DollarSign,
  LucideIcon
} from "lucide-react";

export interface CategoryConfig {
  name: string;
  icon: LucideIcon;
  color: string;
  lightColor: string;
}

export const incomeCategories: CategoryConfig[] = [
  {
    name: "Salariu",
    icon: Briefcase,
    color: "hsl(142 76% 36%)",
    lightColor: "hsl(142 69% 94%)"
  },
  {
    name: "Freelancing",
    icon: Code,
    color: "hsl(210 100% 50%)",
    lightColor: "hsl(210 100% 94%)"
  },
  {
    name: "Investiții",
    icon: TrendingUp,
    color: "hsl(48 96% 53%)",
    lightColor: "hsl(48 100% 96%)"
  },
  {
    name: "Vânzări",
    icon: ShoppingBag,
    color: "hsl(280 60% 50%)",
    lightColor: "hsl(280 60% 94%)"
  },
  {
    name: "Altele",
    icon: DollarSign,
    color: "hsl(142 76% 36%)",
    lightColor: "hsl(142 69% 94%)"
  }
];

export const expenseCategories: CategoryConfig[] = [
  {
    name: "Mâncare",
    icon: Utensils,
    color: "hsl(0 84% 60%)",
    lightColor: "hsl(0 93% 94%)"
  },
  {
    name: "Transport",
    icon: Car,
    color: "hsl(210 100% 50%)",
    lightColor: "hsl(210 100% 94%)"
  },
  {
    name: "Utilități",
    icon: Zap,
    color: "hsl(48 96% 53%)",
    lightColor: "hsl(48 100% 96%)"
  },
  {
    name: "Închiriere",
    icon: Home,
    color: "hsl(280 60% 50%)",
    lightColor: "hsl(280 60% 94%)"
  },
  {
    name: "Distracție",
    icon: Music,
    color: "hsl(330 80% 60%)",
    lightColor: "hsl(330 80% 94%)"
  },
  {
    name: "Sănătate",
    icon: Heart,
    color: "hsl(0 84% 60%)",
    lightColor: "hsl(0 93% 94%)"
  },
  {
    name: "Shopping",
    icon: ShoppingCart,
    color: "hsl(280 60% 50%)",
    lightColor: "hsl(280 60% 94%)"
  },
  {
    name: "Educație",
    icon: GraduationCap,
    color: "hsl(210 100% 50%)",
    lightColor: "hsl(210 100% 94%)"
  },
  {
    name: "Altele",
    icon: DollarSign,
    color: "hsl(215 16% 46%)",
    lightColor: "hsl(210 40% 96%)"
  }
];

export const getCategoryConfig = (categoryName: string, type: "income" | "expense"): CategoryConfig => {
  const categories = type === "income" ? incomeCategories : expenseCategories;
  return categories.find(cat => cat.name === categoryName) || categories[categories.length - 1];
};
