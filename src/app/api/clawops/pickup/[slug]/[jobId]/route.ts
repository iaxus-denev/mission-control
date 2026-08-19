import { NextResponse } from "next/server";
import { withRoute } from "@/lib/api-route";
import { claimJobSchema, jobRouteSchema } from "@/lib/clawops-schemas";
import { linkExecution, updateJob } from "@/lib/clawops-store";
export const POST=withRoute({name:"/api/clawops/pickup/[slug]/[jobId]",routeSchema:jobRouteSchema,bodySchema:claimJobSchema},async(_r,ctx)=>{const {actorId,...execution}=ctx.body;await linkExecution(ctx.params.slug,ctx.params.jobId,execution,actorId);const job=await updateJob(ctx.params.slug,ctx.params.jobId,{status:"in_progress",actorId,correlationId:execution.executionId});return NextResponse.json({ok:true,job,execution});});
