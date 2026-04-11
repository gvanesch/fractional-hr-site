import { NextResponse } from "next/server";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function PATCH(request: Request) {
  try {
    const advisorUser = await requireAdvisorUser();

    if (!advisorUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 403 },
      );
    }

    const body = await request.json();

    const {
      projectId,
      billingContactName,
      billingContactEmail,
      companyWebsite,
      purchaseOrderNumber,
      msaStatus,
      dpaStatus,
      notes,
    } = body;

    if (!projectId || !isUuid(projectId)) {
      return NextResponse.json(
        { success: false, error: "Valid projectId is required." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from("client_projects")
      .update({
        billing_contact_name: billingContactName ?? null,
        billing_contact_email: billingContactEmail ?? null,
        company_website: companyWebsite ?? null,
        purchase_order_number: purchaseOrderNumber ?? null,
        msa_status: msaStatus ?? null,
        dpa_status: dpaStatus ?? null,
        notes: notes ?? null,
      })
      .eq("project_id", projectId);

    if (error) {
      throw new Error("Failed to update project.");
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[client-diagnostic-project-update] failed", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error updating project.",
      },
      { status: 500 },
    );
  }
}