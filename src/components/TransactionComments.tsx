import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";

interface Comment {
  id: string;
  comment: string;
  user_id: string;
  created_at: string;
  email?: string;
}

interface TransactionCommentsProps {
  transactionId: string;
}

export function TransactionComments({ transactionId }: TransactionCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    loadComments();
    getCurrentUser();
  }, [transactionId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from("transaction_comments")
        .select("*")
        .eq("transaction_id", transactionId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch emails from profiles separately
      const commentsWithEmails = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", comment.user_id)
            .single();
          
          return { ...comment, email: profile?.email || "Utilizator" };
        })
      );

      setComments(commentsWithEmails);
    } catch (error: any) {
      console.error("Error loading comments:", error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("transaction_comments")
        .insert({
          transaction_id: transactionId,
          user_id: user.id,
          comment: newComment,
        });

      if (error) throw error;

      toast({
        title: "✓ Comentariu adăugat",
      });

      setNewComment("");
      loadComments();
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

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("transaction_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      toast({
        title: "✓ Comentariu șters",
      });

      loadComments();
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Comentarii
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Adaugă un comentariu..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
          />
          <Button
            onClick={addComment}
            disabled={loading || !newComment.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nu există comentarii încă
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="p-3 border rounded-lg space-y-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {comment.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: ro,
                        })}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.comment}</p>
                  </div>
                  {comment.user_id === currentUserId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteComment(comment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
