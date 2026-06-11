import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, MailX } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const FN_URL = `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`;

type Status = "validating" | "valid" | "invalid" | "already" | "submitting" | "done" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<Status>("validating");
  const [email, setEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${FN_URL}?token=${encodeURIComponent(token)}`, {
          headers: { apikey: SUPABASE_ANON_KEY },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.valid) {
          setEmail(data.email ?? null);
          setStatus("valid");
        } else if (data?.alreadyUnsubscribed) {
          setEmail(data.email ?? null);
          setStatus("already");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    })();
  }, [token]);

  const confirm = async () => {
    setStatus("submitting");
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setStatus("done");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data?.error ?? "Something went wrong.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-8 shadow-xl text-center">
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center">
            <MailX className="w-7 h-7 text-primary" />
          </div>
        </div>

        {status === "validating" && (
          <>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Verifying your link…</p>
          </>
        )}

        {status === "valid" && (
          <>
            <h1 className="text-2xl font-bold mb-2">Unsubscribe</h1>
            <p className="text-muted-foreground text-sm mb-6">
              {email ? <>Stop sending emails to <span className="text-foreground font-medium">{email}</span>?</> : "Confirm you'd like to stop receiving emails from us."}
            </p>
            <Button onClick={confirm} className="w-full">Confirm unsubscribe</Button>
            <Link to="/" className="inline-block mt-4 text-sm text-muted-foreground hover:text-foreground">Back to home</Link>
          </>
        )}

        {status === "submitting" && (
          <>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Updating your preferences…</p>
          </>
        )}

        {status === "done" && (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-2">You're unsubscribed</h1>
            <p className="text-muted-foreground text-sm mb-6">
              {email ?? "This address"} won't receive any more emails from us.
            </p>
            <Link to="/"><Button variant="outline" className="w-full">Back to home</Button></Link>
          </>
        )}

        {status === "already" && (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-2">Already unsubscribed</h1>
            <p className="text-muted-foreground text-sm mb-6">
              {email ?? "This address"} is already opted out.
            </p>
            <Link to="/"><Button variant="outline" className="w-full">Back to home</Button></Link>
          </>
        )}

        {(status === "invalid" || status === "error") && (
          <>
            <XCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-2">Link invalid</h1>
            <p className="text-muted-foreground text-sm mb-6">
              {errorMsg || "This unsubscribe link is invalid or has expired."}
            </p>
            <Link to="/"><Button variant="outline" className="w-full">Back to home</Button></Link>
          </>
        )}
      </div>
    </main>
  );
}
