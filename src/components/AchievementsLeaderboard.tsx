import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Medal, Trophy, User, TrendingUp } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  achievement_count: number;
  rank: number;
}

interface UserRank {
  achievement_count: number;
  rank: number;
  total_users: number;
}

export const AchievementsLeaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Fetch leaderboard
        const { data: leaderboardData, error: leaderboardError } = await supabase
          .rpc('get_achievements_leaderboard', { limit_count: 10 });

        if (leaderboardError) throw leaderboardError;
        setLeaderboard(leaderboardData || []);

        // Fetch current user's rank if logged in
        if (user) {
          const { data: rankData, error: rankError } = await supabase
            .rpc('get_user_achievement_rank', { target_user_id: user.id });

          if (rankError) throw rankError;
          if (rankData && rankData.length > 0) {
            setUserRank(rankData[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-950";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900";
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-amber-950";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Clasament
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/20">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Clasament Insigne</CardTitle>
              <CardDescription>Top colecționari de insigne</CardDescription>
            </div>
          </div>
          {userRank && (
            <div className="text-right bg-card/80 rounded-lg px-3 py-2 border">
              <p className="text-xs text-muted-foreground">Poziția ta</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xl font-bold text-primary">#{userRank.rank}</span>
                <span className="text-xs text-muted-foreground">
                  din {userRank.total_users}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Încă nu există utilizatori în clasament.</p>
            <p className="text-sm">Deblochează insigne pentru a apărea aici!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, index) => {
              const isCurrentUser = user?.id === entry.user_id;
              
              return (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                    ${isCurrentUser 
                      ? "bg-primary/10 border-2 border-primary/30 shadow-md" 
                      : "bg-muted/30 border border-border/50 hover:bg-muted/50"
                    }
                    ${entry.rank <= 3 ? "shadow-sm" : ""}
                  `}
                >
                  {/* Rank */}
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center shrink-0
                    ${getRankBadgeColor(entry.rank)}
                  `}>
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-10 w-10 border-2 border-background">
                    <AvatarFallback className={`
                      text-sm font-semibold
                      ${isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"}
                    `}>
                      {entry.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium truncate ${isCurrentUser ? "text-primary" : ""}`}>
                        {entry.display_name}
                      </p>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          Tu
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.achievement_count} insigne deblocate
                    </p>
                  </div>

                  {/* Achievement Count */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="text-xl">🏆</div>
                    <span className={`
                      text-lg font-bold
                      ${entry.rank === 1 ? "text-yellow-500" : 
                        entry.rank === 2 ? "text-gray-400" : 
                        entry.rank === 3 ? "text-amber-600" : "text-foreground"}
                    `}>
                      {entry.achievement_count}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Show user's position if not in top 10 */}
        {userRank && userRank.rank > 10 && user && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center mb-2">Poziția ta în clasament</p>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border-2 border-primary/30">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                <span className="text-sm font-bold">#{userRank.rank}</span>
              </div>
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-primary">Tu</p>
                <p className="text-xs text-muted-foreground">
                  {userRank.achievement_count} insigne deblocate
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="text-xl">🏆</div>
                <span className="text-lg font-bold">{userRank.achievement_count}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AchievementsLeaderboard;
