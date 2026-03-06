import { motion } from "framer-motion";
import { useAchievements, ACHIEVEMENTS, LEVELS } from "@/hooks/useAchievements";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Lock, Sparkles, TrendingUp, HelpCircle, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const Achievements = () => {
  const { t } = useTranslation();
  const { achievements, loading, getProgress, getLevelProgress } = useAchievements();
  const progress = getProgress();
  const levelInfo = getLevelProgress();

  const categories = ["transactions", "budgets", "savings", "streaks", "special"] as const;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {t("achievements.badges")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">{t("achievements.loading")}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const levelName = t(`achievements.levels.${levelInfo.currentLevel.level}`);
  const nextLevelName = levelInfo.nextLevel ? t(`achievements.levels.${levelInfo.nextLevel.level}`) : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 pb-2">
        {/* Level Section */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-4 rounded-xl bg-gradient-to-r ${levelInfo.currentLevel.color} text-white shadow-lg`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{levelInfo.currentLevel.icon}</span>
              <div>
                <p className="text-sm opacity-90">{t("achievements.level", { level: levelInfo.currentLevel.level })}</p>
                <h3 className="text-xl font-bold">{levelName}</h3>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <TrendingUp className="h-4 w-4" />
                <span className="text-2xl font-bold">{progress.unlocked}</span>
                <span className="opacity-75">/ {progress.total}</span>
              </div>
              <p className="text-xs opacity-90">{progress.percentage}% {t("achievements.completed")}</p>
            </div>
          </div>
          
          {levelInfo.nextLevel && nextLevelName && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>{t("achievements.progressTo", { name: nextLevelName })}</span>
                <span>{t("achievements.badgesRemaining", { count: levelInfo.achievementsToNext })}</span>
              </div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${levelInfo.progressToNext}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-white rounded-full"
                />
              </div>
            </div>
          )}
          
          {!levelInfo.nextLevel && (
            <p className="mt-2 text-sm opacity-90 text-center">{t("achievements.maxLevelReached")}</p>
          )}
        </motion.div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/20">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>{t("achievements.badges")}</CardTitle>
              <CardDescription>{t("achievements.collectBadges")}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-4">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              {t("achievements.all")}
            </TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="text-xs sm:text-sm">
                <span className="hidden sm:inline">{t(`achievements.categories.${category}`)}</span>
                <span className="sm:hidden">{t(`achievements.categoryIcons.${category}`)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            <AchievementGrid achievements={achievements} />
          </TabsContent>

          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <AchievementGrid 
                achievements={achievements.filter((a) => a.category === category)} 
              />
            </TabsContent>
          ))}
        </Tabs>
        {/* Achievement Guide Section */}
        <AchievementGuide />
      </CardContent>
    </Card>
  );
};

const AchievementGuide = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-6">
      <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm font-medium text-foreground">
        <HelpCircle className="h-4 w-4 text-primary" />
        <span>{t("achievements.guideTitle")}</span>
        <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground mb-3">
            {t("achievements.guideIntro")}
          </p>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {ACHIEVEMENTS.map((a) => (
              <div key={a.id} className="flex gap-3 p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                <span className="text-2xl shrink-0">{a.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{t(`achievements.badge.${a.id}.name`)}</p>
                  <p className="text-xs text-primary font-medium">{t(`achievements.badge.${a.id}.how`)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(`achievements.badge.${a.id}.detail`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

interface AchievementGridProps {
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    isUnlocked: boolean;
  }>;
}

const AchievementGrid = ({ achievements }: AchievementGridProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {achievements.map((achievement, index) => (
        <motion.div
          key={achievement.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05, duration: 0.2 }}
        >
          <AchievementCard achievement={achievement} />
        </motion.div>
      ))}
    </div>
  );
};

interface AchievementCardProps {
  achievement: {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    isUnlocked: boolean;
  };
}

const AchievementCard = ({ achievement }: AchievementCardProps) => {
  const { t } = useTranslation();
  const { isUnlocked } = achievement;

  return (
    <div
      className={`
        relative p-3 rounded-xl border text-center transition-all duration-300
        ${
          isUnlocked
            ? "bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-primary/30 shadow-md hover:shadow-lg hover:scale-105"
            : "bg-muted/30 border-border/50 opacity-60 hover:opacity-80"
        }
      `}
    >
      {/* Icon */}
      <div
        className={`
          text-3xl sm:text-4xl mb-2 transition-transform
          ${isUnlocked ? "grayscale-0" : "grayscale"}
        `}
      >
        {isUnlocked ? achievement.icon : <Lock className="h-8 w-8 mx-auto text-muted-foreground/50" />}
      </div>

      {/* Name */}
      <h4
        className={`
          text-xs sm:text-sm font-semibold mb-1 line-clamp-1
          ${isUnlocked ? "text-foreground" : "text-muted-foreground"}
        `}
      >
        {t(`achievements.badge.${achievement.id}.name`)}
      </h4>

      {/* Description */}
      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
        {t(`achievements.badge.${achievement.id}.description`)}
      </p>

      {/* Unlocked badge */}
      {isUnlocked && (
        <Badge
          variant="default"
          className="absolute -top-1 -right-1 text-[8px] px-1.5 py-0 bg-success text-success-foreground"
        >
          ✓
        </Badge>
      )}

      {/* Category indicator */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-background border text-muted-foreground">
          {t(`achievements.categoryIcons.${achievement.category}`)}
        </span>
      </div>
    </div>
  );
};

export default Achievements;
