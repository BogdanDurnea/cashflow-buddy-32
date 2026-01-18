import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  Brain, 
  TrendingUp, 
  Lightbulb, 
  AlertTriangle, 
  Sparkles,
  Loader2 
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AIInsightsProps {
  transactions: any[];
  categoryBudgets: Record<string, number>;
  monthlyBudget: number;
}

interface Insight {
  predictions: {
    nextMonthExpenses: number;
    confidence: number;
    explanation: string;
  };
  savings: {
    potentialSavings: number;
    suggestions: Array<{
      category: string;
      saving: number;
      tip: string;
    }>;
  };
  anomalies: Array<{
    type: string;
    description: string;
    severity: "low" | "medium" | "high";
    suggestion: string;
  }>;
  insights: Array<{
    title: string;
    description: string;
    actionable: boolean;
  }>;
}

export function AIInsights({ transactions, categoryBudgets, monthlyBudget }: AIInsightsProps) {
  const [insights, setInsights] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateInsights = async () => {
    if (transactions.length === 0) {
      toast({
        title: "Nu există date",
        description: "Adaugă tranzacții pentru a genera insights AI",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: { transactions, categoryBudgets, monthlyBudget }
      });

      if (error) throw error;
      setInsights(data);
      
      toast({
        title: "✨ Insights generate",
        description: "Analiză AI completă",
      });
    } catch (error: any) {
      console.error('Error generating insights:', error);
      toast({
        title: "Eroare",
        description: error.message || "Nu s-au putut genera insights-urile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Insights
              </CardTitle>
              <CardDescription>
                Analiză inteligentă a finanțelor tale
              </CardDescription>
            </div>
            <Button 
              onClick={generateInsights} 
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analizez...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generează Insights
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        
        {insights && (
          <CardContent className="space-y-6">
            {/* Predicții */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Predicții Luna Viitoare
              </h3>
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Cheltuieli estimate:</span>
                      <span className="font-bold text-lg">
                        {insights.predictions.nextMonthExpenses.toFixed(2)} RON
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Confidence:</span>
                      <span>{(insights.predictions.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-sm mt-2">{insights.predictions.explanation}</p>
                  </div>
                </AlertDescription>
              </Alert>
            </div>

            {/* Sugestii Economisire */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Oportunități de Economisire
              </h3>
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Potențial economii: </span>
                  <span className="font-bold text-primary">
                    {insights.savings.potentialSavings.toFixed(2)} RON/lună
                  </span>
                </div>
                <div className="space-y-2">
                  {insights.savings.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="p-3 bg-background rounded border">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">{suggestion.category}</span>
                        <Badge variant="outline">
                          -{suggestion.saving.toFixed(2)} RON
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{suggestion.tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Anomalii */}
            {insights.anomalies.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Anomalii Detectate
                </h3>
                <div className="space-y-2">
                  {insights.anomalies.map((anomaly, idx) => (
                    <Alert key={idx}>
                      <AlertDescription>
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-medium">{anomaly.type}</div>
                              <div className="text-sm">{anomaly.description}</div>
                            </div>
                            <Badge variant={getSeverityColor(anomaly.severity) as any}>
                              {anomaly.severity}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            💡 {anomaly.suggestion}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Insights Generale */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Insights Generale
              </h3>
              <div className="space-y-2">
                {insights.insights.map((insight, idx) => (
                  <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium mb-1">{insight.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {insight.description}
                        </div>
                      </div>
                      {insight.actionable && (
                        <Badge variant="secondary">Acționabil</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
