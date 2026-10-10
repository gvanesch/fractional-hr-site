import { NextResponse } from "next/server";
import * as service from "@/lib/baseline/server";
export const dynamic = "force-dynamic";
type Context = {params:Promise<{path:string[]}>};
const json=(value:unknown,status=200)=>NextResponse.json(value,{status,headers:service.securityHeaders});
function failure(error:unknown) { return json({error:error instanceof service.BaselineError ? error.message : "Unable to complete this request. Please try again."},error instanceof service.BaselineError?error.status:503); }
export async function GET(request:Request, context:Context) {
  try { service.baselineEnv(); const path=(await context.params).path.join("/");
    if (path==="response") return json(await service.readResponse(await service.participant(request)));
    const actor=await service.admin(),url=new URL(request.url),campaign=url.searchParams.get("campaign") ?? "";
    if (path==="admin/campaigns") return json({campaigns:await service.campaigns()});
    if (path==="admin/campaign") { const data=await service.campaignRows(campaign); await service.audit(actor,"campaign_viewed",campaign,campaign); return json(data); }
    if (path==="admin/export") { const format=url.searchParams.get("format")??"json"; if (!["respondents","activities","json"].includes(format)) return json({error:"Choose an export format."},400); const content=await service.exportDataset(actor,campaign,format); return new NextResponse(content,{headers:{...service.securityHeaders,"Content-Type":format==="json"?"application/json; charset=utf-8":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="baseline-${format}.${format==="json"?"json":"csv"}"`}}); }
    return json({error:"Not found."},404);
  } catch(error){return failure(error);}
}
export async function POST(request:Request, context:Context) {
  try {service.baselineEnv(); service.sameOrigin(request); const path=(await context.params).path.join("/");
    const body=await service.readBody(request,path==="admin/import"?300000:75000);
    if(path==="access"){const value=await service.redeem(request,String(body.token??""));const response=json({success:true});response.cookies.set(service.COOKIE,value.session,{httpOnly:true,secure:true,sameSite:"strict",path:"/",expires:new Date(value.expires)});return response;}
    if(path==="logout"){await service.endSession();const response=json({success:true});response.cookies.set(service.COOKIE,"",{httpOnly:true,secure:true,sameSite:"strict",path:"/",maxAge:0});return response;}
    if(path==="save"||path==="submit"){const p=await service.participant(request);return json(await service.saveResponse(p,body.draft,Number(body.revision),Number(body.progress),path==="submit"));}
    const actor=await service.admin(),campaign=String(body.campaign??"");
    if(path==="admin/create")return json(await service.createCampaign(actor,body));
    if(path==="admin/configure")return json(await service.configureCampaign(actor,campaign,body));
    if(path==="admin/import")return json(await service.importRoster(actor,campaign,String(body.csv??"")));
    if(path==="admin/invite")return json(await service.invite(actor,campaign,String(body.participantId??""),body.send===true));
    if(path==="admin/revoke")return json(await service.revoke(actor,campaign,String(body.participantId??"")));
    return json({error:"Not found."},404);
  }catch(error){return failure(error);}
}
