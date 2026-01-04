import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to generate signed URLs for storage files on demand
 * Returns a signed URL that expires after the specified duration
 */
export function useSignedUrl(filePath: string | undefined, expiresIn: number = 3600) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) {
      setSignedUrl(null);
      return;
    }

    // Check if filePath is already a full URL (legacy data)
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      setSignedUrl(filePath);
      return;
    }

    const generateSignedUrl = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: signError } = await supabase.storage
          .from('receipts')
          .createSignedUrl(filePath, expiresIn);

        if (signError) {
          throw signError;
        }

        setSignedUrl(data.signedUrl);
      } catch (err: any) {
        console.error("Error generating signed URL:", err);
        setError(err.message);
        setSignedUrl(null);
      } finally {
        setLoading(false);
      }
    };

    generateSignedUrl();
  }, [filePath, expiresIn]);

  return { signedUrl, loading, error };
}

/**
 * Utility function to generate a signed URL imperatively
 */
export async function getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
  // Check if filePath is already a full URL (legacy data)
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  try {
    const { data, error } = await supabase.storage
      .from('receipts')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error("Error generating signed URL:", error);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error("Error generating signed URL:", err);
    return null;
  }
}
