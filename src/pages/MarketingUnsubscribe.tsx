import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, MailX, MailCheck } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const FN_URL = `${SUPABASE_URL}/functions/v1/marketing-unsubscribe`;

type Status =
  | "validating"
  | "subscribed"          // token valid, currently subscribed → offer unsubscribe
  | "unsubscribed"        // token valid, currently unsubscribed → offer resubscribe
  | "invalid"             // bad / expired / unknown token
  | "submitting"
  | "done-unsubscribed"
  | "done-resubscribed"
  | "error";

export default function MarketingUnsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<Status>("validating");
  const [email, setEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    (async () => {
      try {
        const res = await fetch(`${FN_URL}?token=${encodeURIComponent(token)}`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.valid) {
          setEmail(data.email ?? null);
          setStatus(data.isUnsubscribed ? "unsubscribed" : "subscribed");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    })();
  }, [token]);

  const submit = async (action: "unsubscribe" | "resubscribe") => {
    setStatus("submitting");
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ token, action }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErrorMsg(d?.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setStatus(action === "unsubscribe" ? "done-unsubscribed" : "done-resubscribed");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  const isUnsubscribedState =
    status === "unsubscribed" || status === "done-unsubscribed";
  const Icon = isUnsubscribedState ? MailX : MailCheck;

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-8 shadow-xl text-center">
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center">
            <Icon className="w-7 h-7 text-primary" />
          </div>
        </div>

        {status === "validating" && (
          <>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Verifying your link…</p>
          </>
        )}

        {status === "subscribed" && (
          <>
            <h1 className="text-2xl font-bold mb-2">Unsubscribe from marketing emails</h1>
            <p className="text-muted-foreground text-sm mb-2">
              {email ? (
                <>Stop sending promotional emails to <span className="text-foreground font-medium">{email}</span>?</>
              ) : (
                "Stop receiving promotional emails from us."
              )}
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              You'll still receive important account emails (security, orders, password resets).
            </p>
            <Button onClick={() => submit("unsubscribe")} className="w-full">Confirm unsubscribe</Button>
            <Link to="/" className="inline-block mt-4 text-sm text-muted-foreground hover:text-foreground">
              Back to home
            </Link>
          </>
        )}

        {status === "unsubscribed" && (
          <>
            <h1 className="text-2xl font-bold mb-2">You're unsubscribed</h1>
            <p className="text-muted-foreground text-sm mb-2">
              {email ?? "This address"} is currently opted out of marketing emails.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Changed your mind? You can resubscribe to promotional updates at any time.
            </p>
            <Button onClick={() => submit("resubscribe")} className="w-full">
              Resubscribe to marketing emails
            </Button>
            <Link to="/" className="inline-block mt-4 text-sm text-muted-foreground hover:text-foreground">
              Back to home
            </Link>
          </>
        )}

        {status === "submitting" && (
          <>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Updating your preferences…</p>
          </>
        )}

        {status === "done-unsubscribed" && (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-2">You're unsubscribed</h1>
            <p className="text-muted-foreground text-sm mb-4">
              {email ?? "This address"} won't receive promotional emails anymore. Account emails will still be delivered.
            </p>
            <Button onClick={() => submit("resubscribe")} variant="outline" className="w-full mb-2">
              Changed your mind? Resubscribe
            </Button>
            <Link to="/">
              <Button variant="ghost" className="w-full">Back to home</Button>
            </Link>
          </>
        )}

        {status === "done-resubscribed" && (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
            <p className="text-muted-foreground text-sm mb-4">
              {email ?? "This address"} is now subscribed to promotional emails again.
            </p>
            <Button onClick={() => submit("unsubscribe")} variant="outline" className="w-full mb-2">
              Unsubscribe again
            </Button>
            <Link to="/">
              <Button variant="ghost" className="w-full">Back to home</Button>
            </Link>
          </>
        )}

        {(status === "invalid" || status === "error") && (
          <>
            <XCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-2">Link invalid or expired</h1>
            <p className="text-muted-foreground text-sm mb-6">
              {errorMsg || "This unsubscribe link is invalid or no longer valid. Try the link from your most recent email, or contact support."}
            </p>
            <Link to="/"><Button variant="outline" className="w-full">Back to home</Button></Link>
          </>
        )}
      </div>
    </main>
  );
}
