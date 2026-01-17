import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, ExternalLink, Calendar, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useAchievements } from "@/hooks/useAchievements";

interface ShareReportPublicProps {
  reportData: any;
  title: string;
}

export function ShareReportPublic({ reportData, title }: ShareReportPublicProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingShares, setExistingShares] = useState<any[]>([]);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const { toast } = useToast();
  const { checkFeatureAchievement } = useAchievements();

  const loadExistingShares = async () => {
    try {
      const { data, error } = await supabase
        .from("report_shares")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setExistingShares(data || []);
    } catch (error: any) {
      console.error("Error loading shares:", error);
    }
  };

  const generateShareLink = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const shareToken = crypto.randomUUID();
      const expiresAt = expiresInDays > 0
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from("report_shares")
        .insert({
          share_token: shareToken,
          user_id: user.id,
          report_data: reportData,
          title: title,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/shared/${shareToken}`;
      setShareUrl(url);

      toast({
        title: "✓ Link generat",
        description: "Raportul poate fi accesat public",
      });

      // Trigger share report achievement
      checkFeatureAchievement("share_report");

      loadExistingShares();
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "✓ Copiat",
      description: "Link-ul a fost copiat în clipboard",
    });
  };

  const deleteShare = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from("report_shares")
        .delete()
        .eq("id", shareId);

      if (error) throw error;

      toast({
        title: "✓ Link șters",
      });

      loadExistingShares();
      if (shareUrl.includes(shareId)) {
        setShareUrl("");
      }
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open) loadExistingShares();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Link Public
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Partajează Raport Public</DialogTitle>
          <DialogDescription>
            Generează un link public pentru a partaja raportul
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Titlu Raport</Label>
            <Input id="title" value={title} disabled />
          </div>

          <div>
            <Label htmlFor="expires">Expiră după (zile)</Label>
            <Input
              id="expires"
              type="number"
              min="0"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 0)}
              placeholder="0 = niciodată"
            />
          </div>
          
          {!shareUrl ? (
            <Button onClick={generateShareLink} disabled={loading} className="w-full">
              {loading ? "Se generează..." : "Generează Link Nou"}
            </Button>
          ) : (
            <div className="space-y-2">
              <Label>Link Generat</Label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={() => copyToClipboard(shareUrl)} size="icon">
                  <Copy className="w-4 h-4" />
                </Button>
                <Button onClick={() => window.open(shareUrl, '_blank')} size="icon">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {existingShares.length > 0 && (
            <div className="space-y-2">
              <Label>Link-uri Existente</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {existingShares.map((share) => (
                  <Card key={share.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{share.title}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>Vizualizări: {share.view_count}</span>
                            {share.expires_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Expiră: {new Date(share.expires_at).toLocaleDateString('ro-RO')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(`${window.location.origin}/shared/${share.share_token}`)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteShare(share.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
