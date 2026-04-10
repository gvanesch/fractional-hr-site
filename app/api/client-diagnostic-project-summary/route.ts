import { NextResponse } from "next/server";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import {
  getProjectSummaryData,
  isUuid,
} from "@/lib/client-diagnostic/get-project-summary";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          error: "projectId is required.",
        },
        { status: 400 },
      );
    }

    if (!isUuid(projectId)) {
      return NextResponse.json(
        {
          success: false,
          error: "projectId must be a valid UUID.",
        },
        { status: 400 },
      );
    }

    const advisorUser = await requireAdvisorUser();

    if (!advisorUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 403 },
      );
    }

    const data = await getProjectSummaryData(projectId);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[client-diagnostic-project-summary] protected route failed", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof Error && error.message === "Project not found.") {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load project summary.",
      },
      { status: 500 },
    );
  }
}