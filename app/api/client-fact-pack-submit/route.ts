import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


type FactPackSubmitRequest = {
  projectId: string;
  participantId: string;
  inviteToken: string;
  responseJson: Record<string, unknown>;
  mode: "draft" | "submit";
};

type SaveClientFactPackRpcResult = {
  success: boolean;
  mode: "draft" | "submit";
  status: "in_progress" | "completed";
  message: string;
};

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getSupabaseAdminClient() {
  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

function isUuid(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateRequestBody(
  body: unknown,
):
  | { isValid: true; data: FactPackSubmitRequest }
  | { isValid: false; message: string } {
  if (!isPlainObject(body)) {
    return {
      isValid: false,
      message: "Request body must be a JSON object.",
    };
  }

  const candidate = body as Partial<FactPackSubmitRequest>;

  if (!isUuid(candidate.projectId)) {
    return {
      isValid: false,
      message: "projectId must be a valid UUID.",
    };
  }

  if (!isUuid(candidate.participantId)) {
    return {
      isValid: false,
      message: "participantId must be a valid UUID.",
    };
  }

  if (!isUuid(candidate.inviteToken)) {
    return {
      isValid: false,
      message: "inviteToken must be a valid UUID.",
    };
  }

  if (!isPlainObject(candidate.responseJson)) {
    return {
      isValid: false,
      message: "responseJson must be an object.",
    };
  }

  if (candidate.mode !== "draft" && candidate.mode !== "submit") {
    return {
      isValid: false,
      message: "mode must be draft or submit.",
    };
  }

  return {
    isValid: true,
    data: {
      projectId: candidate.projectId,
      participantId: candidate.participantId,
      inviteToken: candidate.inviteToken,
      responseJson: candidate.responseJson,
      mode: candidate.mode,
    },
  };
}

function mapRpcErrorToResponse(errorMessage: string) {
  switch (errorMessage) {
    case "Participant record not found for this project.":
      return { status: 404, error: errorMessage };
    case "Participant is not a client fact pack recipient.":
      return { status: 400, error: errorMessage };
    case "Invite token does not match this participant.":
      return { status: 403, error: errorMessage };
    case "This fact pack has already been submitted.":
      return { status: 409, error: errorMessage };
    case "Participant is not in a valid state for fact pack access.":
      return { status: 409, error: errorMessage };
    default:
      return {
        status: 500,
        error: "Unexpected server error while saving client fact pack.",
      };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateRequestBody(body);

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.message },
        { status: 400 },
      );
    }

    const { projectId, participantId, inviteToken, responseJson, mode } =
      validation.data;

    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase.rpc("save_client_fact_pack", {
      p_project_id: projectId,
      p_participant_id: participantId,
      p_invite_token: inviteToken,
      p_response_json: responseJson,
      p_mode: mode,
    });

    if (error) {
      console.error("Client fact pack RPC failed.", error);

      const mapped = mapRpcErrorToResponse(error.message);

      return NextResponse.json(
        {
          success: false,
          error: mapped.error,
        },
        { status: mapped.status },
      );
    }

    const result = data as SaveClientFactPackRpcResult;

    return NextResponse.json({
      success: true,
      mode: result.mode,
      status: result.status,
      message: result.message,
    });
  } catch (error) {
    console.error("Client fact pack save failed.", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unexpected server error while saving client fact pack.",
      },
      { status: 500 },
    );
  }
}