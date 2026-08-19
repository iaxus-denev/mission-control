import { NextResponse } from "next/server";
import { withRoute } from "@/lib/api-route";
import { createJobSchema, projectRouteSchema } from "@/lib/clawops-schemas";
import { createJob, listJobs } from "@/lib/clawops-store";
export const GET = withRoute({name:"/api/projects/[slug]/jobs",routeSchema:projectRouteSchema},async(_r,ctx)=>NextResponse.json({jobs:await listJobs({project:ctx.params.slug})}));
export const POST = withRoute({name:"/api/projects/[slug]/jobs",routeSchema:projectRouteSchema,bodySchema:createJobSchema},async(_r,ctx)=>NextResponse.json({job:await createJob(ctx.params.slug,ctx.body)},{status:201}));
