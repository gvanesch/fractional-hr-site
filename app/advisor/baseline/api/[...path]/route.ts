// Keep browser administration under the same Access application as its page.
// Every operation still verifies the authorised advisor inside the shared handler.
import {
  GET as baselineGET,
  POST as baselinePOST,
} from "@/app/api/baseline/[...path]/route";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
function administration(context: Context): Context {
  return {
    params: context.params.then(({ path }) => ({ path: ["admin", ...path] })),
  };
}
export function GET(request: Request, context: Context) {
  return baselineGET(request, administration(context));
}
export function POST(request: Request, context: Context) {
  return baselinePOST(request, administration(context));
}
