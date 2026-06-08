// Edge function: fetch a URL and return OpenGraph-style preview metadata.
// Public (verify_jwt = false) — used by the dashboard link editor to render
// a card preview matching what the public profile will show.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function pickMeta(html: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return decode(m[1].trim());
  }
  return null;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function abs(url: string, base: string): string {
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Missing url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let target = url.trim();
    if (!/^https?:\/\//i.test(target)) target = `https://${target}`;

    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    let res: Response;
    try {
      res = await fetch(target, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; SmartCardBot/1.0; +https://smartcardsa.shop)",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
    } catch (e) {
      clearTimeout(timeout);
      return new Response(
        JSON.stringify({
          error: "Could not reach URL",
          detail: (e as Error).message,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    clearTimeout(timeout);

    if (!res.ok) {
      return new Response(
        JSON.stringify({
          error: `Site responded ${res.status}`,
          status: res.status,
          url: target,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return new Response(
        JSON.stringify({
          url: target,
          title: parsed.hostname,
          description: null,
          image: null,
          siteName: parsed.hostname,
          favicon: `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Cap to first 256KB — OG tags live in <head>.
    const reader = res.body?.getReader();
    let html = "";
    if (reader) {
      const decoder = new TextDecoder();
      let received = 0;
      const MAX = 256 * 1024;
      while (received < MAX) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        html += decoder.decode(value, { stream: true });
        if (html.includes("</head>")) break;
      }
      try {
        await reader.cancel();
      } catch {
        /* noop */
      }
    } else {
      html = await res.text();
    }

    const title = pickMeta(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
      /<title[^>]*>([^<]+)<\/title>/i,
    ]) || parsed.hostname;

    const description = pickMeta(html, [
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    ]);

    const imageRaw = pickMeta(html, [
      /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    ]);
    const image = imageRaw ? abs(imageRaw, target) : null;

    const siteName = pickMeta(html, [
      /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
    ]) || parsed.hostname;

    const faviconRaw = pickMeta(html, [
      /<link[^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon)["']/i,
    ]);
    const favicon = faviconRaw
      ? abs(faviconRaw, target)
      : `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;

    const payload = {
      url: target,
      title,
      description,
      image,
      siteName,
      favicon,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
