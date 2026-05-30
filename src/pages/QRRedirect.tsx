import { useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * QR scan landing endpoint. Records a profile_view tagged as a QR scan
 * (via `referrer = 'qr-scan'`), then redirects to the public profile.
 */
export default function QRRedirect() {
  const { username } = useParams<{ username: string }>();

  useEffect(() => {
    if (!username) return;
    void (async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username.toLowerCase())
          .maybeSingle();
        if (profile?.id) {
          await supabase.from("profile_views").insert({
            profile_id: profile.id,
            referrer: "qr-scan",
            user_agent: navigator.userAgent,
          });
        }
      } catch (e) {
        console.warn("QR view tracking failed:", e);
      }
    })();
  }, [username]);

  if (!username) return <Navigate to="/" replace />;
  return <Navigate to={`/${username}`} replace />;
}
