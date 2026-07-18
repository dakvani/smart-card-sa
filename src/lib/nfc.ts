/**
 * NFC service for the Capacitor-wrapped mobile app.
 *
 * Uses the community plugin `@exxili/capacitor-nfc` when running natively.
 * On the web the plugin isn't installed — all methods gracefully report that
 * NFC is unavailable so the same UI works in a browser preview.
 *
 * To enable native NFC on device:
 *   npm install @exxili/capacitor-nfc
 *   npx cap sync
 *   iOS: enable "Near Field Communication Tag Reading" capability in Xcode
 *        and add NFCReaderUsageDescription to Info.plist
 *   Android: add <uses-permission android:name="android.permission.NFC" />
 *            to AndroidManifest.xml
 */

import { Capacitor } from "@capacitor/core";

export type NfcAvailability =
  | { available: true }
  | { available: false; reason: string };

// Dynamic import so the web bundle doesn't fail if the plugin isn't installed.
async function loadPlugin(): Promise<any | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    // @vite-ignore — optional peer, installed only when building native
    const pkg = "@exxili/capacitor-nfc";
    const mod: any = await import(/* @vite-ignore */ pkg);
    return mod.NFC ?? mod.Nfc ?? mod.default ?? null;
  } catch {
    return null;
  }
}

export async function checkNfcAvailability(): Promise<NfcAvailability> {
  if (!Capacitor.isNativePlatform()) {
    return { available: false, reason: "NFC is only available in the installed mobile app." };
  }
  const plugin = await loadPlugin();
  if (!plugin) {
    return {
      available: false,
      reason: "NFC plugin not installed. Run `npm install @exxili/capacitor-nfc && npx cap sync`.",
    };
  }
  try {
    if (typeof plugin.isEnabled === "function") {
      const res = await plugin.isEnabled();
      if (res && res.enabled === false) {
        return { available: false, reason: "NFC is turned off in device settings." };
      }
    }
    return { available: true };
  } catch (e) {
    return { available: false, reason: (e as Error).message };
  }
}

/**
 * Read the next NFC tag scanned by the user.
 * Resolves with the tag's first text/URI record payload as a string.
 */
export async function readTag(): Promise<string> {
  const plugin = await loadPlugin();
  if (!plugin) throw new Error("NFC not available on this platform.");

  return new Promise<string>((resolve, reject) => {
    let subscription: { remove?: () => void } | undefined;

    const done = (val: string | Error) => {
      try { subscription?.remove?.(); } catch { /* ignore */ }
      try { plugin.stopScan?.(); } catch { /* ignore */ }
      if (val instanceof Error) reject(val);
      else resolve(val);
    };

    const handler = (event: any) => {
      try {
        const records = event?.records || event?.tag?.records || [];
        const first = records[0];
        const text =
          first?.payload ??
          first?.text ??
          first?.uri ??
          (event?.uri ?? "");
        done(typeof text === "string" ? text : JSON.stringify(text));
      } catch (e) {
        done(e as Error);
      }
    };

    (async () => {
      try {
        if (typeof plugin.addListener === "function") {
          subscription = await plugin.addListener("nfcTag", handler);
        } else if (typeof plugin.onRead === "function") {
          subscription = await plugin.onRead(handler);
        }
        if (typeof plugin.startScan === "function") {
          await plugin.startScan();
        }
      } catch (e) {
        done(e as Error);
      }
    })();

    // Safety timeout — 60 seconds
    setTimeout(() => done(new Error("NFC scan timed out. Please try again.")), 60_000);
  });
}

/**
 * Write a URL to the next NFC tag the user taps.
 */
export async function writeUrl(url: string): Promise<void> {
  const plugin = await loadPlugin();
  if (!plugin) throw new Error("NFC not available on this platform.");

  if (typeof plugin.write === "function") {
    await plugin.write({ records: [{ type: "url", payload: url }] });
    return;
  }
  if (typeof plugin.writeNDEF === "function") {
    await plugin.writeNDEF({ records: [{ type: "U", payload: url }] });
    return;
  }
  throw new Error("The installed NFC plugin does not expose a write method.");
}
