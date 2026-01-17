import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Trophy, 
  Lock, 
  Sparkles,
  Star
} from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import { 
  achievements, 
  Achievement, 
  rarityColors, 
  rarityBgColors, 
  rarityLabels,
  categoryLabels 
} from "@/lib/achievementsConfig";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  unlockedAt?: string;
}

const AchievementCard = ({ achievement, isUnlocked, unlockedAt }: AchievementCardProps) => {
  const Icon = achievement.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        relative p-4 rounded-xl border transition-all duration-300
        ${isUnlocked 
          ? `${rarityBgColors[achievement.rarity]} border-transparent shadow-md hover:shadow-lg` 
          : "bg-muted/30 border-dashed border-muted-foreground/30 opacity-60"
        }
      `}
    >
      {isUnlocked && (
        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-r ${rarityColors[achievement.rarity]}`} />
      )}
      
      <div className="flex items-start gap-4">
        <div className={`
          p-3 rounded-xl shrink-0
          ${isUnlocked 
            ? `bg-gradient-to-br ${rarityColors[achievement.rarity]} text-white shadow-lg` 
            : "bg-muted text-muted-foreground"
          }
        `}>
          {isUnlocked ? (
            <Icon className="h-6 w-6" />
          ) : (
            <Lock className="h-6 w-6" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={`font-semibold ${isUnlocked ? "" : "text-muted-foreground"}`}>
              {achievement.name}
            </h4>
            <Badge 
              variant="outline" 
              className={`text-xs ${isUnlocked ? "" : "opacity-50"}`}
            >
              {rarityLabels[achievement.rarity]}
            </Badge>
          </div>
          
          <p className={`text-sm mt-1 ${isUnlocked ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
            {achievement.description}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-xs">
              <Star className={`h-3 w-3 ${isUnlocked ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
              <span className={isUnlocked ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"}>
                {achievement.points} puncte
              </span>
            </div>
            
            {isUnlocked && unlockedAt && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(unlockedAt), "d MMM yyyy", { locale: ro })}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const AchievementsPanel = () => {
  const { 
    unlockedAchievements, 
    loading, 
    isUnlocked, 
    totalPoints, 
    progressPercentage 
  } = useAchievements();
  
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "Toate" },
    { id: "transactions", label: "Tranzacții" },
    { id: "budgets", label: "Bugete" },
    { id: "goals", label: "Obiective" },
    { id: "features", label: "Funcționalități" },
    { id: "milestones", label: "Realizări" }
  ];

  const filteredAchievements = activeCategory === "all" 
    ? achievements 
    : achievements.filter(a => a.category === activeCategory);

  const getUnlockedAt = (achievementId: string) => {
    return unlockedAchievements.find(a => a.achievement_id === achievementId)?.unlocked_at;
  };

  // Sort: unlocked first, then by rarity
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    const aUnlocked = isUnlocked(a.id);
    const bUnlocked = isUnlocked(b.id);
    if (aUnlocked !== bUnlocked) return bUnlocked ? 1 : -1;
    
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
    return rarityOrder[a.rarity] - rarityOrder[b.rarity];
  });

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-12 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <CardTitle>Realizări</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="font-bold text-lg">{totalPoints}</span>
            <span className="text-sm text-muted-foreground">puncte</span>
          </div>
        </div>
        <CardDescription>
          Deblochează realizări explorând funcționalitățile aplicației
        </CardDescription>
        
        {/* Progress overview */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progres total</span>
            <span className="font-medium">
              {unlockedAchievements.length} / {achievements.length} deblocate
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {categories.map(cat => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id}
                className="text-xs sm:text-sm flex-1 min-w-fit"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <AnimatePresence mode="popLayout">
                <div className="grid gap-3">
                  {sortedAchievements.map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      isUnlocked={isUnlocked(achievement.id)}
                      unlockedAt={getUnlockedAt(achievement.id)}
                    />
                  ))}
                </div>
              </AnimatePresence>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
