import { useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * QR scan landing endpoint. Records a profile_view tagged as a QR scan,
 * then redirects to the public profile. On Android/iOS devices, appends
 * `?mobile=1` so the profile renders in forced mobile layout (no desktop
 * phone-frame chrome).
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

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isMobile = /android|iphone|ipod|ipad|mobile|blackberry|windows phone/i.test(ua);
  const target = isMobile ? `/${username}?mobile=1` : `/${username}`;
  return <Navigate to={target} replace />;
}
