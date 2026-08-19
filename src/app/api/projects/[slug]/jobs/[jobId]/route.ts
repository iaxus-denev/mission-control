import { NextResponse } from "next/server";
import { withRoute } from "@/lib/api-route";
import { jobRouteSchema, updateJobSchema } from "@/lib/clawops-schemas";
import { getJob, getJobExecutions, getJobHistory, updateJob } from "@/lib/clawops-store";
export const GET=withRoute({name:"/api/projects/[slug]/jobs/[jobId]",routeSchema:jobRouteSchema},async(_r,ctx)=>{
  const [job, executions, history] = await Promise.all([
    getJob(ctx.params.slug,ctx.params.jobId),
    getJobExecutions(ctx.params.slug,ctx.params.jobId),
    getJobHistory(ctx.params.slug,ctx.params.jobId),
  ]);
  return NextResponse.json({job,executions:executions.executions,history});
});
export const PATCH=withRoute({name:"/api/projects/[slug]/jobs/[jobId]",routeSchema:jobRouteSchema,bodySchema:updateJobSchema},async(_r,ctx)=>NextResponse.json({job:await updateJob(ctx.params.slug,ctx.params.jobId,ctx.body)}));
