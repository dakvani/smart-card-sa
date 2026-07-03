import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { getPostLoginRedirect } from "@/lib/post-login-redirect";

export default function Auth() {
  const navigate = useNavigate();

  useEffect(() => {
    const go = async (userId: string) => {
      const dest = await getPostLoginRedirect(userId);
      navigate(dest, { replace: true });
    };

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) go(session.user.id);
      } catch (error) {
        console.error("Session check failed:", error);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) go(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Redirect /auth to /login, /auth?signup=true to /signup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("signup") === "true") {
      const username = params.get("username");
      navigate(username ? `/signup?username=${encodeURIComponent(username)}` : "/signup", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return null;
}
