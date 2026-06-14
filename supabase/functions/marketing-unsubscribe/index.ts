import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  const url = new URL(req.url)

  try {
    if (req.method === 'GET') {
      const token = url.searchParams.get('token') ?? ''
      if (!token) return json({ valid: false }, 400)
      const { data } = await admin
        .from('marketing_email_unsubscribes')
        .select('email, unsubscribed_at')
        .eq('token', token)
        .maybeSingle()
      if (!data) return json({ valid: false }, 404)
      if (data.unsubscribed_at) return json({ alreadyUnsubscribed: true, email: data.email })
      return json({ valid: true, email: data.email })
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}))
      const token = body?.token
      if (!token) return json({ error: 'token required' }, 400)
      const { data, error } = await admin
        .from('marketing_email_unsubscribes')
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq('token', token)
        .select('email')
        .maybeSingle()
      if (error || !data) return json({ error: 'invalid token' }, 404)
      return json({ ok: true, email: data.email })
    }

    return json({ error: 'method not allowed' }, 405)
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
