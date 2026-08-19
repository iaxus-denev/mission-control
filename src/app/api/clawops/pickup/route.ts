import { NextResponse } from "next/server";
import { withRoute } from "@/lib/api-route";
import { pickupQuerySchema } from "@/lib/clawops-schemas";
import { getEligibleBacklogJobs } from "@/lib/clawops-store";
export const GET=withRoute({name:"/api/clawops/pickup",querySchema:pickupQuerySchema},async(_r,ctx)=>{const jobs=await getEligibleBacklogJobs(ctx.query.agentId);return NextResponse.json({jobs,count:jobs.length,contract:{assignmentIsNotStart:true,claimRequiresExecutionId:true}})});
