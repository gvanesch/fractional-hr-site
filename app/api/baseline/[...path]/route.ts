import { NextResponse } from "next/server";
import * as service from "@/lib/baseline/server";
import { ROSTER_FIELDS, LAUNCH_ROSTER_FIELDS } from "@/lib/baseline/roster-fields";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
const json = (value: unknown, status = 200) =>
  NextResponse.json(value, { status, headers: service.securityHeaders });
function failure(error: unknown) {
  return json(
    {
      error:
        error instanceof service.BaselineError
          ? error.message
          : "Unable to complete this request. Please try again.",
    },
    error instanceof service.BaselineError ? error.status : 503,
  );
}
export async function GET(request: Request, context: Context) {
  try {
    service.baselineEnv();
    const path = (await context.params).path.join("/");
    if (path === "response")
      return json(
        await service.readResponse(await service.participant(request)),
      );
    const actor = await service.admin(),
      url = new URL(request.url),
      campaign = url.searchParams.get("campaign") ?? "";
    if (path === "admin/roster-template")
      return new NextResponse((url.searchParams.get("full") === "1" ? ROSTER_FIELDS : LAUNCH_ROSTER_FIELDS).join(",") + "\n", {
        headers: {
          ...service.securityHeaders,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="baseline-roster-template.csv"',
        },
      });
    if (path === "admin/campaigns")
      return json({ campaigns: await service.campaigns() });
    if (path === "admin/dashboard")
      return json(await service.completionDashboard(campaign));
    if (path === "admin/readiness")
      return json(await service.launchReadiness(campaign));
    if (path === "admin/shares")
      return json({ shares: await service.dashboardShares(campaign) });
    if (path === "admin/campaign") {
      const data = await service.campaignRows(campaign);
      await service.audit(actor, "campaign_viewed", campaign, campaign);
      return json(data);
    }
    if (path === "admin/export") {
      const format = url.searchParams.get("format") ?? "json";
      if (!["respondents", "activities", "json", "xlsx"].includes(format))
        return json({ error: "Choose an export format." }, 400);
      if (format === "xlsx") {
        const bytes = await service.exportAnalysisWorkbook(actor, campaign);
        return new NextResponse(new Uint8Array(bytes).buffer, {
          headers: {
            ...service.securityHeaders,
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition":
              'attachment; filename="baseline-analysis.xlsx"',
          },
        });
      }
      const content = await service.exportDataset(actor, campaign, format);
      return new NextResponse(content, {
        headers: {
          ...service.securityHeaders,
          "Content-Type":
            format === "json"
              ? "application/json; charset=utf-8"
              : "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="baseline-${format}.${format === "json" ? "json" : "csv"}"`,
        },
      });
    }
    return json({ error: "Not found." }, 404);
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request, context: Context) {
  try {
    service.baselineEnv();
    service.sameOrigin(request);
    const path = (await context.params).path.join("/");
    const body = await service.readBody(
      request,
      ["admin/import", "admin/import-preview", "save", "submit"].includes(path)
        ? 300000
        : 75000,
    );
    if (path === "dashboard")
      return json(
        await service.sharedDashboard(request, String(body.token ?? "")),
      );
    if (path === "invitation-info")
      return json(
        await service.invitationInfo(request, String(body.token ?? "")),
      );
    if (path === "request-code")
      return json(
        await service.requestVerification(request, String(body.token ?? "")),
      );
    if (path === "qa-email-test")
      return json(
        await service.qaTestInvitation(request, String(body.token ?? "")),
      );
    if (path === "verify-code") {
      const value = await service.verifyCode(
        request,
        String(body.token ?? ""),
        String(body.challenge ?? ""),
        String(body.code ?? ""),
      );
      const response = json({ success: true });
      response.cookies.set(service.COOKIE, value.session, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        expires: new Date(value.expires),
      });
      return response;
    }
    if (path === "access") {
      const value = await service.redeem(request, String(body.token ?? ""));
      const response = json({ success: true });
      response.cookies.set(service.COOKIE, value.session, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        expires: new Date(value.expires),
      });
      return response;
    }
    if (path === "logout") {
      await service.endSession();
      const response = json({ success: true });
      response.cookies.set(service.COOKIE, "", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });
      return response;
    }
    if (path === "answer-copy")
      return json(
        await service.requestAnswerCopy(await service.participant(request)),
      );
    if (path === "save" || path === "submit") {
      const p = await service.participant(request);
      return json(
        await service.saveResponse(
          p,
          body.draft,
          Number(body.revision),
          Number(body.progress),
          path === "submit",
        ),
      );
    }
    const actor = await service.admin(),
      campaign = String(body.campaign ?? "");
    if (path === "admin/test-code")
      return json(
        await service.requestVerification(
          request,
          String(body.token ?? ""),
          true,
        ),
      );
    if (path === "admin/retry-answer-copies")
      return json(await service.retryAnswerCopies(actor, campaign));
    if (path === "admin/import-preview")
      return json(
        await service.previewRoster(campaign, String(body.csv ?? "")),
      );
    if (path === "admin/participant")
      return json(
        await service.changeParticipant(
          actor,
          campaign,
          String(body.participantId ?? ""),
          body,
        ),
      );
    if (path === "admin/extend")
      return json(
        await service.extendBaselineInvite(
          actor,
          campaign,
          String(body.participantId ?? ""),
          body,
        ),
      );
    if (path === "admin/share")
      return json(await service.createDashboardShare(actor, campaign, body));
    if (path === "admin/share-revoke")
      return json(
        await service.revokeDashboardShare(
          actor,
          campaign,
          String(body.shareId ?? ""),
        ),
      );
    if (path === "admin/launch")
      return json(await service.launchCampaign(actor, campaign, body));
    if (path === "admin/invite-batch")
      return json(await service.inviteBatch(actor, campaign, body));
    if (path === "admin/create")
      return json(await service.createCampaign(actor, body));
    if (path === "admin/configure")
      return json(await service.configureCampaign(actor, campaign, body));
    if (path === "admin/import")
      return json(
        await service.importRoster(actor, campaign, String(body.csv ?? "")),
      );
    if (path === "admin/invite")
      return json(
        await service.invite(
          actor,
          campaign,
          String(body.participantId ?? ""),
          body.send === true,
        ),
      );
    if (path === "admin/revoke")
      return json(
        await service.revoke(actor, campaign, String(body.participantId ?? "")),
      );
    return json({ error: "Not found." }, 404);
  } catch (error) {
    return failure(error);
  }
}
