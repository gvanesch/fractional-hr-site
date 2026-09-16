import { getD1Database } from "@/lib/d1/database";
import { insertD1HealthCheckSubmission } from "@/lib/d1/diagnostic-submissions";

type ProbeRow = {
  id: string;
  submission_id: string;
  public_token: string | null;
  score: number | null;
  process_clarity_score: number | null;
  answers: string | null;
  advisor_brief: string | null;
  submission_source: string | null;
  completion_version: string | null;
};

const localHostnames = new Set(["127.0.0.1", "localhost", "::1"]);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function POST(request: Request) {
  const hostname = new URL(request.url).hostname;

  if (!localHostnames.has(hostname)) {
    return Response.json({ status: "not_found" }, { status: 404 });
  }

  const database = getD1Database();
  const id = crypto.randomUUID();
  const submissionId = crypto.randomUUID();
  const publicToken = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  let inserted = false;

  try {
    await insertD1HealthCheckSubmission({
      id,
      createdAt,
      companySize: "51-200",
      industry: "Professional services",
      role: "HR leader",
      countryRegion: "United Kingdom",
      email: "probe@example.invalid",
      score: 50,
      band: "Developing Structure",
      processClarityScore: 3,
      consistencyScore: 3,
      serviceAccessScore: 2,
      ownershipScore: 3,
      onboardingScore: 4,
      technologyAlignmentScore: 3,
      knowledgeSelfServiceScore: 3,
      operationalCapacityScore: 2,
      dataHandoffsScore: 3,
      changeResilienceScore: 3,
      answers: {
        1: 3,
        2: 3,
        3: 2,
        4: 3,
        5: 4,
        6: 3,
        7: 3,
        8: 2,
        9: 3,
        10: 3,
      },
      submissionId,
      advisorBrief: {
        headline: "Synthetic D1 application writer probe",
      },
      completedAt: createdAt,
      submissionSource: "health-check",
      completionVersion: "v1",
      publicToken,
    });

    inserted = true;

    const row = await database
      .prepare(
        `SELECT
          id,
          submission_id,
          public_token,
          score,
          process_clarity_score,
          answers,
          advisor_brief,
          submission_source,
          completion_version
        FROM diagnostic_submissions
        WHERE id = ?`,
      )
      .bind(id)
      .first<ProbeRow>();

    if (
      !row ||
      row.id !== id ||
      row.submission_id !== submissionId ||
      row.public_token !== publicToken ||
      row.score !== 50 ||
      row.process_clarity_score !== 3 ||
      row.submission_source !== "health-check" ||
      row.completion_version !== "v1" ||
      !row.answers ||
      JSON.parse(row.answers)["1"] !== 3 ||
      !row.advisor_brief ||
      JSON.parse(row.advisor_brief).headline !==
        "Synthetic D1 application writer probe"
    ) {
      throw new Error("D1 diagnostic submission did not round-trip correctly.");
    }

    const deleteResult = await database
      .prepare("DELETE FROM diagnostic_submissions WHERE id = ?")
      .bind(id)
      .run();

    if (!deleteResult.success) {
      throw new Error("D1 diagnostic probe cleanup did not succeed.");
    }

    inserted = false;

    const remaining = await database
      .prepare(
        "SELECT COUNT(*) AS row_count FROM diagnostic_submissions WHERE id = ?",
      )
      .bind(id)
      .first<{ row_count: number }>();

    if (!remaining || remaining.row_count !== 0) {
      throw new Error("D1 diagnostic probe row remained after cleanup.");
    }

    return Response.json({
      status: "ok",
      d1: {
        applicationWriter: "passed",
        read: "passed",
        json: "passed",
        cleanup: "passed",
      },
    });
  } catch (error) {
    if (inserted) {
      try {
        await database
          .prepare("DELETE FROM diagnostic_submissions WHERE id = ?")
          .bind(id)
          .run();
      } catch (cleanupError) {
        console.error("D1_DIAGNOSTIC_PROBE_CLEANUP_FAILED", {
          submissionId,
          error: errorMessage(cleanupError),
        });
      }
    }

    console.error("D1_DIAGNOSTIC_PROBE_FAILED", {
      submissionId,
      error: errorMessage(error),
    });

    return Response.json(
      {
        status: "error",
        message: errorMessage(error),
      },
      { status: 500 },
    );
  }
}
