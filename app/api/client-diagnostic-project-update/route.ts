import { NextResponse } from "next/server";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isD1ClientDiagnosticShadowWriteEnabled } from "@/lib/d1/database";
import { updateD1ClientProjectDetails } from "@/lib/d1/client-diagnostic";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isOptionalText(
  value: unknown,
): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
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

    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400 },
      );
    }

    const {
      projectId,
      billingContactName,
      billingContactEmail,
      companyWebsite,
      purchaseOrderNumber,
      msaStatus,
      dpaStatus,
      notes,
    } = body as Record<string, unknown>;

    if (typeof projectId !== "string" || !isUuid(projectId)) {
      return NextResponse.json(
        { success: false, error: "Valid projectId is required." },
        { status: 400 },
      );
    }

    if (
      !isOptionalText(billingContactName) ||
      !isOptionalText(billingContactEmail) ||
      !isOptionalText(companyWebsite) ||
      !isOptionalText(purchaseOrderNumber) ||
      !isOptionalText(msaStatus) ||
      !isOptionalText(dpaStatus) ||
      !isOptionalText(notes)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Project detail fields must be strings or null.",
        },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: updatedProject, error } = await supabase
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
      .eq("project_id", projectId)
      .select("updated_at")
      .single();

    if (error || !updatedProject) {
      throw new Error("Failed to update project.");
    }

    if (isD1ClientDiagnosticShadowWriteEnabled()) {
      try {
        await updateD1ClientProjectDetails({
          projectId,
          billingContactName: billingContactName ?? null,
          billingContactEmail: billingContactEmail ?? null,
          companyWebsite: companyWebsite ?? null,
          purchaseOrderNumber: purchaseOrderNumber ?? null,
          msaStatus: msaStatus ?? null,
          dpaStatus: dpaStatus ?? null,
          notes: notes ?? null,
          updatedAt: updatedProject.updated_at,
        });
      } catch (d1Error) {
        console.error(
          "[client-diagnostic-project-update] D1 shadow write failed",
          d1Error,
        );
      }
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
