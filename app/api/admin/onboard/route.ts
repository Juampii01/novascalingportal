import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { randomUUID } from "crypto"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminSupabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase environment variables")
  }
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

// POST /api/admin/onboard
// Creates a new client profile and returns the generated client_id + instructions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      clientName,
      expertName,
      businessName,
      niche,
      offerDescription,
      aov,
      revenueSharePct,
      email,
    } = body ?? {}

    if (!clientName) {
      return NextResponse.json({ error: "clientName es requerido." }, { status: 400 })
    }

    const supabase = getAdminSupabase()

    // Check if a profile with this client_name already exists
    const { data: existing } = await supabase
      .from("nova_client_profile")
      .select("client_id")
      .ilike("client_name", clientName.trim())
      .maybeSingle()

    if (existing?.client_id) {
      return NextResponse.json({
        error: `Ya existe un cliente con el nombre "${clientName}". client_id: ${existing.client_id}`,
      }, { status: 409 })
    }

    // If an email is provided, try to find an existing auth user
    // If not found, generate a new UUID for the client_id
    let clientId: string | null = null

    if (email) {
      const { data: users } = await supabase.auth.admin.listUsers()
      const match = users?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())
      if (match) clientId = match.id
    }

    if (!clientId) clientId = randomUUID()

    const row: Record<string, unknown> = {
      client_id: clientId,
      client_name: clientName.trim(),
      expert_name: expertName?.trim() || null,
      business_name: businessName?.trim() || null,
      niche: niche?.trim() || null,
      offer_description: offerDescription?.trim() || null,
      aov: aov ? Number(aov) : null,
      revenue_share_pct: revenueSharePct ? Number(revenueSharePct) : 20,
      start_date: new Date().toISOString().slice(0, 10),
    }

    const { error: insertErr } = await supabase
      .from("nova_client_profile")
      .insert(row)

    if (insertErr) {
      // If duplicate key, return the existing client_id
      if (insertErr.code === "23505") {
        return NextResponse.json({ error: "Ya existe un perfil con ese client_id." }, { status: 409 })
      }
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    const supabaseUrl = process.env.SUPABASE_URL ?? ""
    const webhookUrl = `${supabaseUrl}/functions/v1/manychat-webhook`

    return NextResponse.json({
      clientId,
      clientName: clientName.trim(),
      webhookUrl,
      setupInstructions: {
        webhookUrl,
        clientId,
        headers: { "Content-Type": "application/json" },
        bodyFields: {
          client_id: clientId,
          subscriber_id: "{{subscriber id}}",
          subscriber_name: "{{full name}}",
          tags: "{{tags}}",
        },
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Internal server error" }, { status: 500 })
  }
}
