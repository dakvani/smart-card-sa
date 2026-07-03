import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the route a user should land on after signing in.
 * - Admins → /admin
 * - Everyone else → /dashboard
 * Marketing landing (/) stays public for signed-out visitors.
 */
export async function getPostLoginRedirect(userId: string): Promise<string> {
  try {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return data ? "/admin" : "/dashboard";
  } catch {
    return "/dashboard";
  }
}
