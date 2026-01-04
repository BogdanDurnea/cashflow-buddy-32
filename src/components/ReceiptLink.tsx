import { Paperclip, ExternalLink, Loader2 } from "lucide-react";
import { useSignedUrl } from "@/hooks/useSignedUrl";

interface ReceiptLinkProps {
  attachmentUrl: string;
}

export function ReceiptLink({ attachmentUrl }: ReceiptLinkProps) {
  const { signedUrl, loading, error } = useSignedUrl(attachmentUrl, 3600); // 1 hour expiry

  if (loading) {
    return (
      <>
        <span className="mx-1">•</span>
        <Loader2 className="h-3 w-3 animate-spin" />
      </>
    );
  }

  if (error || !signedUrl) {
    return null;
  }

  return (
    <>
      <span className="mx-1">•</span>
      <Paperclip className="h-3 w-3 shrink-0" />
      <a 
        href={signedUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="hover:underline flex items-center gap-1 active:scale-95 transition-smooth"
        onClick={(e) => e.stopPropagation()}
      >
        Chitanță
        <ExternalLink className="h-2 w-2" />
      </a>
    </>
  );
}
