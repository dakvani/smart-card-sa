import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Nfc, ScanLine, Pencil, ArrowLeft, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";
import { checkNfcAvailability, readTag, writeUrl } from "@/lib/nfc";

type Mode = "idle" | "reading" | "writing" | "success" | "error";

export default function NFCPage() {
  const navigate = useNavigate();
  const [availability, setAvailability] = useState<{ available: boolean; reason?: string } | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [writeUrlValue, setWriteUrlValue] = useState("");

  useEffect(() => {
    (async () => {
      const res = await checkNfcAvailability();
      if (res.available) setAvailability({ available: true });
      else setAvailability({ available: false, reason: res.reason });
    })();

    // Pre-fill the "write" field with the current user's public profile URL
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.username) {
        setWriteUrlValue(`${window.location.origin}/${profile.username}`);
      }
    })();
  }, []);

  const handleRead = async () => {
    setMode("reading");
    setErrorMsg(null);
    setLastResult(null);
    try {
      const value = await readTag();
      setLastResult(value);
      setMode("success");
      toast.success("Tag read");
    } catch (e) {
      setErrorMsg((e as Error).message);
      setMode("error");
    }
  };

  const handleWrite = async () => {
    if (!writeUrlValue.trim()) {
      toast.error("Enter a URL to write");
      return;
    }
    try {
      new URL(writeUrlValue);
    } catch {
      toast.error("Please enter a valid URL (including https://)");
      return;
    }
    setMode("writing");
    setErrorMsg(null);
    try {
      await writeUrl(writeUrlValue.trim());
      setMode("success");
      setLastResult(`Wrote: ${writeUrlValue.trim()}`);
      toast.success("Tag written successfully");
    } catch (e) {
      setErrorMsg((e as Error).message);
      setMode("error");
    }
  };

  const busy = mode === "reading" || mode === "writing";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="NFC — SmartCard" description="Read and write NFC tags with SmartCard." path="/nfc" />
      <header className="sticky top-0 z-10 backdrop-blur bg-background/80 border-b border-border/60">
        <div className="max-w-md mx-auto flex items-center gap-2 px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="p-2 -ml-2 rounded-md hover:bg-accent/60"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Nfc className="w-5 h-5 text-primary" />
            <h1 className="text-base font-semibold">NFC</h1>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {availability && !availability.available && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <p className="text-amber-700 dark:text-amber-300">{availability.reason}</p>
          </div>
        )}

        {/* Read */}
        <section className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Scan a SmartCard</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Hold your phone near an NFC tag to read its link.
          </p>
          <Button
            onClick={handleRead}
            disabled={busy || !availability?.available}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
          >
            {mode === "reading" ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Waiting for tag…</>
            ) : (
              "Start scan"
            )}
          </Button>
        </section>

        {/* Write */}
        <section className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Write to a tag</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Program a blank NFC tag or SmartCard with your profile URL.
          </p>
          <Input
            type="url"
            inputMode="url"
            placeholder="https://smartcardsa.shop/yourname"
            value={writeUrlValue}
            onChange={(e) => setWriteUrlValue(e.target.value)}
            className="h-10"
          />
          <Button
            onClick={handleWrite}
            disabled={busy || !availability?.available}
            variant="outline"
            className="w-full h-11 rounded-xl"
          >
            {mode === "writing" ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Tap tag now…</>
            ) : (
              "Write to tag"
            )}
          </Button>
        </section>

        {/* Result */}
        {mode === "success" && lastResult && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <div className="min-w-0">
              <p className="font-medium text-emerald-700 dark:text-emerald-300">Success</p>
              <p className="text-xs break-all text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">{lastResult}</p>
            </div>
          </div>
        )}
        {mode === "error" && errorMsg && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 flex gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-destructive" />
            <p className="text-destructive">{errorMsg}</p>
          </div>
        )}
      </main>
    </div>
  );
}
