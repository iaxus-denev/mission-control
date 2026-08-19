import { NextResponse } from "next/server";
import { withRoute } from "@/lib/api-route";
import { jobsQuerySchema } from "@/lib/clawops-schemas";
import { listJobs } from "@/lib/clawops-store";
export const GET=withRoute({name:"/api/jobs",querySchema:jobsQuerySchema},async(_r,ctx)=>NextResponse.json({jobs:await listJobs(ctx.query)}));
