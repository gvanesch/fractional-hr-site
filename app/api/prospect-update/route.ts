import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const allowedEmails = (process.env.ADVISOR_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);

    const email = session.user.email?.toLowerCase() ?? "";

    if (!allowedEmails.includes(email)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();

    const { prospect_id, status, next_action_date } = body;

    if (!prospect_id) {
      return NextResponse.json(
        { success: false, error: "Missing prospect_id" },
        { status: 400 },
      );
    }

    const validStatuses = [
      "not_contacted",
      "contacted",
      "replied",
      "call_booked",
      "opportunity",
      "won",
      "lost",
    ];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 },
      );
    }

    const admin = createSupabaseAdminClient();

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (status) updatePayload.status = status;
    if (next_action_date !== undefined)
      updatePayload.next_action_date = next_action_date || null;

    const { error } = await admin
      .from("health_check_prospects")
      .update(updatePayload)
      .eq("prospect_id", prospect_id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("prospect-update error", err);

    return NextResponse.json(
      { success: false, error: "Unexpected error" },
      { status: 500 },
    );
  }
}