import { NextResponse } from "next/server";
import { withRoute } from "@/lib/api-route";
import { jobRouteSchema, linkExecutionSchema } from "@/lib/clawops-schemas";
import { linkExecution } from "@/lib/clawops-store";
export const POST=withRoute({name:"/api/projects/[slug]/jobs/[jobId]/executions",routeSchema:jobRouteSchema,bodySchema:linkExecutionSchema},async(_r,ctx)=>{const {actorId,...link}=ctx.body;return NextResponse.json(await linkExecution(ctx.params.slug,ctx.params.jobId,link,actorId),{status:201});});
