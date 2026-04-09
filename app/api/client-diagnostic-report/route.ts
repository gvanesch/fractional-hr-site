import { NextResponse } from "next/server";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import {
  BuildProjectSummaryError,
  isUuid,
} from "@/lib/client-diagnostic/build-project-summary";
import {
  buildClientDiagnosticReport,
  type ClientDiagnosticReport,
} from "@/lib/client-diagnostic/build-client-diagnostic-report";


type ClientDiagnosticReportResponse = {
  success: true;
  report: ClientDiagnosticReport;
};

type ErrorResponse = {
  success: false;
  error: string;
};

export async function GET(request: Request) {
  try {
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

    const report = await buildClientDiagnosticReport(projectId);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    if (error instanceof BuildProjectSummaryError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: error.status },
      );
    }

    console.error("Unable to build client diagnostic report.", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unexpected server error while building client diagnostic report.",
      },
      { status: 500 },
    );
  }
}