import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Zap, Loader2 } from "lucide-react";

interface ZapierIntegrationProps {
  transactions: any[];
  budgets: any[];
}

export const ZapierIntegration = ({ transactions, budgets }: ZapierIntegrationProps) => {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!webhookUrl) {
      toast.error("Please enter your Zapier webhook URL");
      return;
    }

    // Security: Enforce HTTPS for webhook URLs
    if (!webhookUrl.startsWith('https://')) {
      toast.error("Only HTTPS webhook URLs are allowed for security reasons");
      return;
    }

    setIsLoading(true);
    console.log("Triggering Zapier webhook:", webhookUrl);

    try {
      const payload = {
        timestamp: new Date().toISOString(),
        triggered_from: window.location.origin,
        total_transactions: transactions.length,
        total_budgets: budgets.length,
        recent_transactions: transactions.slice(0, 5).map(t => ({
          date: t.date,
          description: t.description,
          amount: t.amount,
          category: t.category,
          type: t.type
        })),
        budget_summary: budgets.map(b => ({
          category: b.category,
          amount: b.amount,
          month: b.month,
          year: b.year
        }))
      };

      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify(payload),
      });

      toast.success("Webhook triggered! Check your Zap's history to confirm.");
    } catch (error) {
      console.error("Error triggering webhook:", error);
      toast.error("Failed to trigger webhook. Please check the URL.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Zapier Integration
        </CardTitle>
        <CardDescription>
          Connect your financial data to thousands of apps via Zapier webhooks.
          <span className="block mt-1 text-amber-600 dark:text-amber-500">⚠️ Only use webhook URLs from trusted sources - your financial data will be sent to the specified URL.</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleTrigger} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="url"
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Get your webhook URL from your Zapier dashboard
            </p>
          </div>
          <Button type="submit" disabled={isLoading || !webhookUrl}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Triggering...
              </>
            ) : (
              "Trigger Webhook"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
